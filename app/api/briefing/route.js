import WebSocket from 'ws';
import { getWeather } from '@/lib/openweather';
import { getDisasterAlerts } from '@/lib/gdacs';
import { buildBriefingScript } from '@/lib/buildBriefingScript';

// This route needs the Node.js runtime (not Edge) to use the `ws` package.
export const runtime = 'nodejs';
export const maxDuration = 30;

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

        weather = await getWeather(location);
        alerts = await getDisasterAlerts(weather.country);
        script = buildBriefingScript(
            { ...weather, location: weather.resolved_location },
            alerts
        );
    } catch (err) {
        console.error('Error preparing briefing script:', err);
        return Response.json(
            { error: 'Failed to prepare briefing', detail: err.message },
            { status: 500 }
        );
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        return Response.json(
            { error: 'Failed to generate briefing', detail: 'ASSEMBLYAI_API_KEY is not set' },
            { status: 500 }
        );
    }

    const stream = new ReadableStream({
        start(controller) {
            let closed = false;
            const finish = (err) => {
                if (closed) return;
                closed = true;
                clearTimeout(timeout);
                try { ws.close(); } catch { }
                if (err) controller.error(err);
                else controller.close();
            };

            const ws = new WebSocket('wss://agents.assemblyai.com/v1/ws', {
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            const timeout = setTimeout(() => {
                ws.terminate();
                finish(new Error('Timed out waiting for speech synthesis'));
            }, 25000);

            ws.on('open', () => {
                ws.send(
                    JSON.stringify({
                        type: 'session.update',
                        session: {
                            greeting: script,
                            system_prompt: 'Speak only the greeting. Do not add anything else.',
                            input: {
                                format: { encoding: 'audio/pcm', sample_rate: RATE },
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
                                format: { encoding: 'audio/pcm', sample_rate: RATE },
                            },
                        },
                    })
                );
            });

            ws.on('message', (raw) => {
                let event;
                try {
                    event = JSON.parse(raw.toString());
                } catch {
                    return;
                }

                if (event.type === 'reply.audio') {
                    // Push this chunk straight through to the client immediately --
                    // no buffering, no waiting for the rest of the speech.
                    controller.enqueue(Buffer.from(event.data, 'base64'));
                } else if (event.type === 'reply.done') {
                    finish();
                } else if (event.type === 'error') {
                    finish(new Error(event.message || 'AssemblyAI returned an error'));
                }
            });

            ws.on('error', (err) => finish(err));
            ws.on('close', () => finish());
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-store',
            'X-Sample-Rate': String(RATE),
        },
    });
}