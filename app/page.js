'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceAgent from '@/components/VoiceAgent';

export default function Home() {
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [errorMsg, setErrorMsg] = useState('');
  const audioCtxRef = useRef(null);

  const isEarlyMorning = () => {
    const hour = new Date().getHours();
    return hour >= 5 && hour <= 9;
  };

  async function playBriefing() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/briefing');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
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

  // Auto-attempt playback if opened during the early-morning window.
  useEffect(() => {
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