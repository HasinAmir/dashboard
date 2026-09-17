'use client';

import { useRef, useState } from 'react';

const RATE = 24000; // must match session config below
const PROMPT = `
You are DawnCast, a calm, friendly spoken weather assistant.
Always call get_weather before answering a weather question. Never guess.
If no location is given, omit location; the tool defaults to Sylhet, Bangladesh.
If asked about tomorrow, pass day="tomorrow"; otherwise omit day (defaults to today).
A "today" result's temperature_c is the live current reading right now --
speak it as such (e.g. "it's currently X degrees"), not as a static daily summary.
A "tomorrow" result has no current reading (temperature_c is null) -- describe
only the expected high, low, and rain chance for tomorrow instead.
Reuse fetched data for same-location, same-day follow-ups unless the time
changes notably or the user asks about a different day.
For active_alert=false, give 2-3 short sentences. For active_alert=true, lead
immediately with the alert type in a direct, serious tone, then key conditions.
Never read JSON, field names, or technical details. Do not use markdown.
`;

const TOOLS = [
    {
        type: 'function',
        name: 'get_weather',
        description:
            'Get conditions and active alerts for today or tomorrow. Always use ' +
            'for weather questions; omit location to default to Sylhet, Bangladesh.',
        parameters: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'Named city or country, for example Tokyo, Japan.',
                },
                day: {
                    type: 'string',
                    enum: ['today', 'tomorrow'],
                    description: 'Which day to check. Omit for today.',
                },
            },
            required: [],
        },
    },
];

async function fetchWeatherTool(location, day) {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (day) params.set('day', day);

    const res = await fetch(`/api/weather?${params.toString()}`);
    if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
    const data = await res.json();

    const alerts = data.alerts || [];
    const top = alerts[0];

    return {
        location: data.location,
        day: data.day,
        condition: data.condition,
        temperature_c: data.temperature_c,
        high_c: data.high_c,
        low_c: data.low_c,
        rain_chance_percent: data.rain_probability_percent,
        active_alert: data.active_alert || false,
        alert_type: top ? top.type : null,
        alert_summary: top ? top.description : null,
    };
}

export default function VoiceAgent() {
    const [connState, setConnState] = useState('idle'); // idle | connecting | listening | error
    const [transcript, setTranscript] = useState([]); // {who: 'you'|'dawncast', text}
    const [errorMsg, setErrorMsg] = useState('');

    const wsRef = useRef(null);
    const audioCtxRef = useRef(null);
    const micStreamRef = useRef(null);
    const processorRef = useRef(null);
    const agentSpeakingRef = useRef(false);
    const nextPlayTimeRef = useRef(0);

    function appendTranscript(who, text) {
        if (!text) return;
        setTranscript((prev) => [...prev.slice(-20), { who, text }]);
    }

    function playPcmChunk(base64Audio) {
        const audioCtx = audioCtxRef.current;
        const bytes = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
        const sampleCount = Math.floor(bytes.length / 2);
        if (sampleCount === 0) return;

        const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
        const float32 = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) float32[i] = int16[i] / 32768;

        const buffer = audioCtx.createBuffer(1, sampleCount, RATE);
        buffer.copyToChannel(float32, 0);

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);

        const startAt = Math.max(nextPlayTimeRef.current, audioCtx.currentTime);
        source.start(startAt);
        nextPlayTimeRef.current = startAt + buffer.duration;
    }

    async function start() {
        setErrorMsg('');
        setTranscript([]);
        setConnState('connecting');

        try {
            // 1. Get mic permission + a browser-echo-cancelled stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                },
            });
            micStreamRef.current = stream;

            // 2. Mint a short-lived token from our server (never exposes the real key)
            const tokenRes = await fetch('/api/voice-token');
            if (!tokenRes.ok) {
                const body = await tokenRes.json().catch(() => ({}));
                throw new Error(body.detail || body.error || 'Could not get a voice token');
            }
            const { token } = await tokenRes.json();

            // 3. Open the WebSocket directly to AssemblyAI using that token
            const wsUrl = new URL('wss://agents.assemblyai.com/v1/ws');
            wsUrl.searchParams.set('token', token);
            const ws = new WebSocket(wsUrl.toString());
            wsRef.current = ws;

            // 4. Audio context for both capture (resampled to 24kHz) and playback
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: RATE,
            });
            audioCtxRef.current = audioCtx;
            nextPlayTimeRef.current = audioCtx.currentTime + 0.05;

            ws.addEventListener('open', () => {
                ws.send(
                    JSON.stringify({
                        type: 'session.update',
                        session: {
                            system_prompt: PROMPT,
                            greeting: 'Good morning. Which place should I check?',
                            tools: TOOLS,
                            input: {
                                format: { encoding: 'audio/pcm', sample_rate: RATE },
                                transcription_mode: 'balanced',
                                turn_detection: {
                                    vad_threshold: 0.5,
                                    min_silence: 1200,
                                    max_silence: 3500,
                                    interrupt_response: true,
                                },
                            },
                            output: {
                                voice: 'alba',
                                format: { encoding: 'audio/pcm', sample_rate: RATE },
                            },
                        },
                    })
                );
            });

            ws.addEventListener('message', async (event) => {
                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch {
                    return;
                }

                switch (msg.type) {
                    case 'session.ready':
                        setConnState('listening');
                        break;

                    case 'reply.audio':
                        agentSpeakingRef.current = true; // mute mic while this plays
                        playPcmChunk(msg.data);
                        break;

                    case 'transcript.user':
                        appendTranscript('you', msg.text);
                        break;

                    case 'transcript.agent':
                        appendTranscript('dawncast', msg.text);
                        break;

                    case 'tool.call': {
                        try {
                            if (msg.name !== 'get_weather') throw new Error('Unknown tool');
                            const args = msg.arguments || {};
                            const result = await fetchWeatherTool(args.location, args.day);
                            ws.send(
                                JSON.stringify({
                                    type: 'tool.result',
                                    call_id: msg.call_id,
                                    result: JSON.stringify(result),
                                    is_error: false,
                                })
                            );
                        } catch (err) {
                            ws.send(
                                JSON.stringify({
                                    type: 'tool.result',
                                    call_id: msg.call_id,
                                    result: JSON.stringify({
                                        error: 'Weather data is temporarily unavailable.',
                                    }),
                                    is_error: true,
                                })
                            );
                        }
                        break;
                    }

                    case 'reply.done':
                        // Unmute the mic now that DawnCast has finished speaking
                        // (or is about to run a tool call).
                        agentSpeakingRef.current = false;
                        break;

                    case 'session.error':
                        setErrorMsg(msg.message || 'Session error');
                        setConnState('error');
                        break;

                    default:
                        break;
                }
            });

            ws.addEventListener('close', () => {
                setConnState((s) => (s === 'error' ? s : 'idle'));
            });

            ws.addEventListener('error', () => {
                setErrorMsg('Connection error');
                setConnState('error');
            });

            // 5. Capture mic audio, downsample/convert to PCM16, stream it up
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (ws.readyState !== WebSocket.OPEN) return;
                if (agentSpeakingRef.current) return; // muted while DawnCast talks

                const input = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                }
                const bytes = new Uint8Array(pcm16.buffer);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                const base64 = btoa(binary);

                ws.send(JSON.stringify({ type: 'input.audio', audio: base64 }));
            };

            source.connect(processor);
            processor.connect(audioCtx.destination); // required by some browsers to keep the node alive
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message);
            setConnState('error');
            stop();
        }
    }

    function stop() {
        try {
            wsRef.current?.send(JSON.stringify({ type: 'session.end' }));
        } catch { }
        wsRef.current?.close();
        wsRef.current = null;

        processorRef.current?.disconnect();
        processorRef.current = null;

        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;

        audioCtxRef.current?.close();
        audioCtxRef.current = null;

        setConnState('idle');
    }

    return (
        <div style={{ width: '100%', maxWidth: 360 }}>
            <button
                onClick={connState === 'idle' || connState === 'error' ? start : stop}
                style={{
                    width: '100%',
                    padding: '1.1rem 2.2rem',
                    fontSize: '1.05rem',
                    borderRadius: '999px',
                    border: '2px solid #FBF7F0',
                    background: connState === 'listening' ? '#D64545' : 'transparent',
                    color: '#FBF7F0',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                {connState === 'connecting'
                    ? 'Connecting…'
                    : connState === 'listening'
                        ? '🎙 Talking — tap to stop'
                        : '🎙 Talk to DawnCast'}
            </button>

            {connState === 'error' && (
                <p style={{ color: '#F2A5A5', marginTop: '0.75rem', textAlign: 'center' }}>
                    {errorMsg}
                </p>
            )}

            {transcript.length > 0 && (
                <div
                    style={{
                        marginTop: '1.25rem',
                        textAlign: 'left',
                        background: 'rgba(0,0,0,0.25)',
                        borderRadius: 12,
                        padding: '1rem',
                        maxHeight: 220,
                        overflowY: 'auto',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                    }}
                >
                    {transcript.map((t, i) => (
                        <div key={i} style={{ marginBottom: 6 }}>
                            <strong>{t.who === 'you' ? 'You' : 'DawnCast'}:</strong> {t.text}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}