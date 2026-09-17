export const runtime = 'nodejs';

/**
 * GET /api/voice-token
 *
 * Mints a short-lived, single-use AssemblyAI token so the browser can open
 * its own WebSocket directly to the Voice Agent API -- without ever seeing
 * your real ASSEMBLYAI_API_KEY. This is the auth pattern AssemblyAI's docs
 * require for any client-side (browser/mobile) connection.
 */
export async function GET() {
    const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.ASSEMBLY_API_KEY;
    if (!apiKey) {
        return Response.json(
            { error: 'ASSEMBLYAI_API_KEY is not set in .env.local' },
            { status: 500 }
        );
    }

    try {
        const url =
            'https://agents.assemblyai.com/v1/token' +
            '?expires_in_seconds=60&max_session_duration_seconds=600';

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token request failed: ${res.status} ${text.slice(0, 200)}`);
        }

        const data = await res.json();
        return Response.json({ token: data.token });
    } catch (err) {
        console.error('Error minting voice token:', err);
        return Response.json(
            { error: 'Failed to mint voice token', detail: err.message },
            { status: 500 }
        );
    }
}