import webpush from 'web-push';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.dawncast_KV_REST_API_URL,
    token: process.env.dawncast_KV_REST_API_TOKEN,
});

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const SUBSCRIPTION_KEY = 'push-subscription';

export async function GET() {
    const subscription = await redis.get(SUBSCRIPTION_KEY);

    if (!subscription) {
        return Response.json({ error: 'No subscription stored yet' }, { status: 404 });
    }

    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: '☀️ DawnCast',
                body: "Your morning briefing is ready — tap to hear it.",
                url: '/',
            })
        );
        return Response.json({ ok: true });
    } catch (err) {
        // A 410 Gone / 404 from the push service means the subscription
        // expired or was revoked on the device — clean it up so future
        // cron runs don't keep failing on a dead subscription.
        if (err.statusCode === 404 || err.statusCode === 410) {
            await redis.del(SUBSCRIPTION_KEY);
            return Response.json({ error: 'Subscription expired and was removed' }, { status: 410 });
        }

        console.error('Failed to send push notification:', err);
        return Response.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}