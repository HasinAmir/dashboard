import { kv } from '@vercel/kv';

const SUBSCRIPTION_KEY = 'push-subscription';

export async function POST(request) {
    const subscription = await request.json();

    if (!subscription?.endpoint) {
        return Response.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    await kv.set(SUBSCRIPTION_KEY, subscription);
    return Response.json({ ok: true });
}

export async function DELETE() {
    await kv.del(SUBSCRIPTION_KEY);
    return Response.json({ ok: true });
}