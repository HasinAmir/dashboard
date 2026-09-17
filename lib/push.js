// Converts the VAPID public key (base64url string) into the Uint8Array
// format the PushManager subscribe() call expects.
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Registers the service worker, requests notification permission, subscribes
// to push, and sends the subscription to the server so the 7 AM cron job
// can find it later. Must be called from inside a user-gesture handler
// (e.g. a button/switch onClick) or the permission prompt will be blocked.
export async function enablePushBriefing() {
    if (typeof window === 'undefined') {
        throw new Error('enablePushBriefing can only run in the browser');
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser');
    }

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission was not granted');
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
        throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
    }

    const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
    });

    if (!res.ok) {
        throw new Error('Failed to save push subscription on the server');
    }

    return subscription;
}

// Unsubscribes from push on this device and tells the server to forget it.
export async function disablePushBriefing() {
    if (typeof window === 'undefined') return;

    const reg = await navigator.serviceWorker.getRegistration();
    const subscription = await reg?.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
    }

    await fetch('/api/subscribe', { method: 'DELETE' });
}