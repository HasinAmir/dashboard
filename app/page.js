'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceAgent from '@/components/VoiceAgent';
import BriefingToggle from '@/components/BriefingToggle';

export default function Home() {
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [errorMsg, setErrorMsg] = useState('');
  const [detectedLocation, setDetectedLocation] = useState('');
  const audioCtxRef = useRef(null);
  const coordsRef = useRef(null);
  const lastQuakeRef = useRef(0);

  const getIpCoordinates = async () => {
    try {
      const res = await fetch('https://ipwho.is/');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        const coords = {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city,
        };
        coordsRef.current = coords;
        if (typeof window !== 'undefined') window.__DAWNCAST_COORDS__ = coords;
        return coords;
      }
    } catch (e) {
      console.warn('IP geolocation fallback failed:', e);
    }
    return null;
  };

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        return resolve(coordsRef.current || null);
      }
      if (coordsRef.current) {
        return resolve(coordsRef.current);
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            };
            coordsRef.current = coords;
            if (typeof window !== 'undefined') window.__DAWNCAST_COORDS__ = coords;
            resolve(coords);
          },
          async (err) => {
            console.warn('Geolocation lookup skipped or denied:', err.message);
            const ipCoords = await getIpCoordinates();
            resolve(ipCoords || coordsRef.current || null);
          },
          { timeout: 3500, enableHighAccuracy: false }
        );
      } else {
        getIpCoordinates().then((ipCoords) => {
          resolve(ipCoords || coordsRef.current || null);
        });
      }
    });
  };

  const isEarlyMorning = () => {
    const hour = new Date().getHours();
    return hour >= 5 && hour <= 9;
  };

  async function playBriefing() {
    setStatus('loading');
    setErrorMsg('');
    try {
      // Attempt GPS coordinates, falling back gracefully to IP location if unavailable
      const coords = coordsRef.current || (await getCoordinates());
      const params = new URLSearchParams();
      if (coords?.lat && coords?.lon) {
        params.set('lat', coords.lat);
        params.set('lon', coords.lon);
      }
      if (coords?.city) {
        params.set('location', coords.city);
      }
      const url = `/api/briefing${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const locHeader = res.headers.get('X-Detected-Location');
      if (locHeader) {
        setDetectedLocation(decodeURIComponent(locHeader));
      }

      const sampleRate = parseInt(res.headers.get('X-Sample-Rate') || '24000', 10);

      const audioCtx =
        audioCtxRef.current ||
        new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      // Small head start so the very first chunk doesn't get scheduled
      // in the past relative to audioCtx's clock.
      let nextTime = audioCtx.currentTime + 0.05;
      let leftover = new Uint8Array(0); // a dangling odd byte between chunks

      const reader = res.body.getReader();
      setStatus('playing');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value || value.length === 0) continue;

        let bytes = value;
        if (leftover.length > 0) {
          const combined = new Uint8Array(leftover.length + bytes.length);
          combined.set(leftover, 0);
          combined.set(bytes, leftover.length);
          bytes = combined;
          leftover = new Uint8Array(0);
        }
        // PCM16 needs an even number of bytes -- hold back a stray
        // trailing byte until the next chunk completes it.
        if (bytes.length % 2 !== 0) {
          leftover = bytes.slice(bytes.length - 1);
          bytes = bytes.slice(0, bytes.length - 1);
        }
        if (bytes.length === 0) continue;

        const sampleCount = bytes.length / 2;
        const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
        const float32 = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
          float32[i] = int16[i] / 32768;
        }

        const audioBuffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
        audioBuffer.copyToChannel(float32, 0);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);

        const startAt = Math.max(nextTime, audioCtx.currentTime);
        source.start(startAt);
        nextTime = startAt + audioBuffer.duration;
      }

      const remainingMs = Math.max(0, (nextTime - audioCtx.currentTime) * 1000);
      setTimeout(() => setStatus('idle'), remainingMs);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  // Poll USGS (via /api/earthquakes) every minute while the app is open.
  // Only fires a notification for NEW quakes (after this page loaded), and
  // only if the user has already granted notification permission via the
  // briefing toggle. This is what makes earthquake alerts feel live.
  useEffect(() => {
    lastQuakeRef.current = Date.now();

    const check = async () => {
      const coords = coordsRef.current;
      if (!coords?.lat || !coords?.lon) return;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (document.visibilityState !== 'visible') return;

      try {
        const params = new URLSearchParams({
          lat: String(coords.lat),
          lon: String(coords.lon),
        });
        const res = await fetch(`/api/earthquakes?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();

        for (const eq of data.earthquakes || []) {
          if (eq.time_ms <= lastQuakeRef.current) continue;
          lastQuakeRef.current = eq.time_ms;
          new Notification('⚠️ Earthquake nearby', {
            body: `Magnitude ${eq.mag} ${eq.place || ''} — about ${eq.distance_km} km away, ${eq.time_ago}.`,
            icon: '/dawncast-logo.svg',
            badge: '/dawncast-logo.svg',
          });
        }
      } catch (err) {
        console.warn('Earthquake polling failed:', err);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  // Pre-request location in background so playback starts quickly when requested
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            };
            coordsRef.current = coords;
            if (typeof window !== 'undefined') window.__DAWNCAST_COORDS__ = coords;
          },
          () => {
            getIpCoordinates();
          },
          { timeout: 3500, enableHighAccuracy: false }
        );
      } else {
        getIpCoordinates();
      }
    }

    if (isEarlyMorning()) {
      playBriefing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'linear-gradient(180deg, #14182B 0%, #4B3F72 55%, #E98973 100%)',
        color: '#FBF7F0',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.02em' }}>
        DawnCast
      </h1>
      <p style={{ opacity: 0.85, margin: 0, maxWidth: 320 }}>
        Your morning weather and alert briefing, spoken aloud.
      </p>

      <button
        onClick={playBriefing}
        disabled={status === 'loading' || status === 'playing'}
        style={{
          marginTop: '1rem',
          padding: '1.1rem 2.2rem',
          fontSize: '1.1rem',
          borderRadius: '999px',
          border: 'none',
          background: status === 'loading' ? '#B08A3A' : '#F4B942',
          color: '#14182B',
          fontWeight: 600,
          cursor: status === 'loading' || status === 'playing' ? 'default' : 'pointer',
        }}
      >
        {status === 'loading'
          ? 'Connecting…'
          : status === 'playing'
            ? '🔊 Speaking…'
            : '▶ Play Today\u2019s Briefing'}
      </button>

      <BriefingToggle />

      {detectedLocation && (
        <div
          style={{
            fontSize: '0.88rem',
            opacity: 0.9,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            marginTop: '-0.25rem',
          }}
        >
          <span>📍</span>
          <span>{detectedLocation}</span>
        </div>
      )}

      {status === 'error' && (
        <p style={{ color: '#F2A5A5', maxWidth: 320 }}>
          Couldn&apos;t load the briefing: {errorMsg}
        </p>
      )}

      <div style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <VoiceAgent />
      </div>
    </main>
  );
}