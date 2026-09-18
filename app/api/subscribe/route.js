import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.dawncast_KV_REST_API_URL,
    token: process.env.dawncast_KV_REST_API_TOKEN,
});

const SUBSCRIPTION_KEY = 'push-subscription';

export async function POST(request) {
    const subscription = await request.json();

    if (!subscription?.endpoint) {
        return Response.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    await redis.set(SUBSCRIPTION_KEY, subscription);
    return Response.json({ ok: true });
}

export async function DELETE() {
    await redis.del(SUBSCRIPTION_KEY);
    return Response.json({ ok: true });
}