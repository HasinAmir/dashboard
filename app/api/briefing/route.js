import WebSocket from 'ws';
import { getWeather } from '@/lib/openweather';
import { getDisasterAlerts } from '@/lib/gdacs';
import { getRecentEarthquakes } from '@/lib/earthquakes';
import { buildBriefingScript } from '@/lib/buildBriefingScript';

// This route needs the Node.js runtime (not Edge) to use the `ws` package.
export const runtime = 'nodejs';
export const maxDuration = 60;

const RATE = 24000; // must match the sample rate we request from AssemblyAI

/**
 * GET /api/briefing?location=Dhaka
 *
 * Streams raw 16-bit PCM audio (today's spoken DawnCast briefing, voice
 * "alba") to the client AS IT ARRIVES from AssemblyAI, instead of waiting
 * for the whole thing to finish and buffering it first. This is what lets
 * playback start almost immediately on the client instead of after a long
 * pause.
 */
export async function GET(request) {
    let weather, alerts, script;

    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');
        const lat = searchParams.get('lat') || request.headers.get('x-vercel-ip-latitude');
        const lon = searchParams.get('lon') || request.headers.get('x-vercel-ip-longitude');
        const ipCity = request.headers.get('x-vercel-ip-city');

        weather = await getWeather({
            location: location || (!lat && ipCity ? decodeURIComponent(ipCity) : null),
            lat,
            lon,
        });
        // Earthquake info is nice-to-have -- a USGS hiccup must not
        // take down the briefing.
        let earthquakes = [];
        try {
            earthquakes = await getRecentEarthquakes({
                lat: weather.resolved_lat,
                lon: weather.resolved_lon,
            });
        } catch (err) {
            console.error('Earthquake fetch failed (continuing without it):', err);
        }
        alerts = [];
        try {
            alerts = await getDisasterAlerts(weather.country);
        } catch (err) {
            console.error('GDACS alert fetch failed (continuing without it):', err);
        }
        script = buildBriefingScript(
            { ...weather, location: weather.resolved_location },
            alerts,
            earthquakes
        );
    } catch (err) {
        console.error('Error preparing briefing script:', err);
        return Response.json(
            { error: 'Failed to prepare briefing', detail: err.message },
            { status: 500 }
        );
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.ASSEMBLY_API_KEY;
    if (!apiKey) {
        return Response.json(
            { error: 'Failed to generate briefing', detail: 'ASSEMBLYAI_API_KEY is not set in .env.local' },
            { status: 500 }
        );
    }
    console.log('[DawnCast] API key present, length:', apiKey.length);

    let finishStream;
    const stream = new ReadableStream({
        start(controller) {
            let closed = false;
            let inactivityTimer = null;

            const resetInactivity = (ms = 15000) => {
                clearTimeout(inactivityTimer);
                if (closed) return;
                inactivityTimer = setTimeout(() => {
                    if (closed) return;
                    console.error(`[DawnCast] Stream timed out after ${ms}ms of inactivity`);
                    try { ws.terminate(); } catch { }
                    finish(new Error('Timed out waiting for speech synthesis'));
                }, ms);
            };

            const finish = (err) => {
                if (closed) return;
                closed = true;
                clearTimeout(inactivityTimer);
                try {
                    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                } catch { }
                try {
                    if (err) {
                        console.error('[DawnCast] Finishing with error:', err.message);
                        controller.error(err);
                    } else {
                        console.log('[DawnCast] Finishing successfully');
                        controller.close();
                    }
                } catch { }
            };
            finishStream = finish;

            console.log('[DawnCast] Creating WebSocket connection to AssemblyAI...');
            const ws = new WebSocket('wss://agents.assemblyai.com/v1/ws', {
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            // Initial timeout: allow up to 25s for connection and initial reply
            resetInactivity(25000);

            ws.on('open', () => {
                console.log('[DawnCast] WebSocket OPEN — sending session.update');
                ws.send(
                    JSON.stringify({
                        type: 'session.update',
                        session: {
                            greeting: script,
                            system_prompt: 'Speak only the greeting. Do not add anything else.',
                            input: {
                                format: { encoding: 'audio/pcm' },
                                transcription_mode: 'balanced',
                                turn_detection: {
                                    vad_threshold: 0.5,
                                    min_silence: 1200,
                                    max_silence: 3500,
                                    interrupt_response: false,
                                },
                            },
                            output: {
                                voice: 'alba',
                                format: { encoding: 'audio/pcm' },
                            },
                        },
                    })
                );
                console.log('[DawnCast] session.update sent');
            });

            ws.on('message', (raw) => {
                if (closed) return;
                // As long as AssemblyAI is actively sending chunks, keep the stream alive
                resetInactivity(15000);

                let event;
                try {
                    event = JSON.parse(raw.toString());
                } catch {
                    console.log('[DawnCast] Received non-JSON message, ignoring');
                    return;
                }

                console.log('[DawnCast] Received event type:', event.type);

                if (event.type === 'reply.audio') {
                    // Push this chunk straight through to the client immediately --
                    // no buffering, no waiting for the rest of the speech.
                    if (closed) return;
                    try {
                        controller.enqueue(Buffer.from(event.data, 'base64'));
                    } catch (err) {
                        console.warn('[DawnCast] Enqueue failed (stream closed/cancelled):', err.message);
                        finish();
                    }
                } else if (event.type === 'reply.done') {
                    console.log('[DawnCast] reply.done received, status:', event.status);
                    finish();
                } else if (event.type === 'session.error') {
                    // AssemblyAI rejects a bad session.update with `session.error`
                    // and KEEPS the socket open -- so without this branch the
                    // request would silently hang until the 25s timeout.
                    finish(
                        new Error(
                            `AssemblyAI session error (${event.code || 'unknown'}): ${event.message || 'session rejected'}`
                        )
                    );
                } else if (event.type === 'error') {
                    finish(new Error(event.message || 'AssemblyAI returned an error'));
                }
            });

            ws.on('error', (err) => {
                console.error('[DawnCast] WebSocket ERROR event:', err.message);
                finish(err);
            });

            ws.on('close', (code, reason) => {
                console.log('[DawnCast] WebSocket CLOSED — code:', code, 'reason:', reason?.toString());
                finish();
            });

            ws.on('unexpected-response', (req, res) => {
                console.error('[DawnCast] Unexpected response during handshake — status:', res.statusCode);
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                    console.error('[DawnCast] Handshake response body:', body);
                    finish(new Error(`WebSocket handshake failed with status ${res.statusCode}: ${body}`));
                });
            });
        },
        cancel() {
            console.log('[DawnCast] ReadableStream cancelled by consumer');
            if (finishStream) finishStream();
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-store',
            'X-Sample-Rate': String(RATE),
            'X-Detected-Location': encodeURIComponent(weather?.resolved_location || ''),
        },
    });
}