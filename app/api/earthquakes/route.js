import { getRecentEarthquakes } from '@/lib/earthquakes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/earthquakes?lat=24.89&lon=91.87
 *
 * Returns recent earthquakes (mag >= 3.5) within 350km of the given point,
 * sorted by time. Uses the request's IP geolocation headers when lat/lon
 * are omitted. This is what the browser polls every ~60s to produce
 * live earthquake notifications.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') || request.headers.get('x-vercel-ip-latitude');
    const lon = searchParams.get('lon') || request.headers.get('x-vercel-ip-longitude');

    try {
        const earthquakes = await getRecentEarthquakes({ lat, lon });
        return Response.json({
            earthquakes,
            checked_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Error fetching earthquakes:', err);
        return Response.json(
            { error: 'Failed to fetch earthquake data', detail: err.message },
            { status: 500 }
        );
    }
}