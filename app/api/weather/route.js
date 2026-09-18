import { getWeather } from '@/lib/openweather';
import { getDisasterAlerts } from '@/lib/gdacs';
import { getRecentEarthquakes } from '@/lib/earthquakes';

// Ensures Next.js never serves a statically cached snapshot of this route --
// every request hits OpenWeatherMap/GDACS/USGS fresh.
export const dynamic = 'force-dynamic';

/**
 * GET /api/weather?location=Dhaka,BD&day=tomorrow
 *
 * `day` accepts "today" (default) or "tomorrow".
 *
 * Returns: location, observed_at, day, temperature_c, condition, high_c,
 * low_c, rain_probability_percent, air_quality, active_alert, alerts[],
 * earthquakes[]
 *
 * (temperature_c is null for "tomorrow" -- there's no "current" reading
 * for a day that hasn't happened yet. air_quality is a current reading.)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');
        const lat = searchParams.get('lat') || request.headers.get('x-vercel-ip-latitude');
        const lon = searchParams.get('lon') || request.headers.get('x-vercel-ip-longitude');
        const ipCity = request.headers.get('x-vercel-ip-city');
        const dayParam = searchParams.get('day');
        const day = dayParam === 'tomorrow' ? 'tomorrow' : 'today';

        const weather = await getWeather({
            location: location || (!lat && ipCity ? decodeURIComponent(ipCity) : null),
            lat,
            lon,
            day,
        });

        // Earthquake data is nice-to-have -- a USGS hiccup must not
        // take down the whole weather response.
        let earthquakes = [];
        try {
            earthquakes = await getRecentEarthquakes({
                lat: weather.resolved_lat,
                lon: weather.resolved_lon,
            });
        } catch (err) {
            console.error('Earthquake fetch failed (continuing without it):', err);
        }

        let alerts = [];
        try {
            alerts = await getDisasterAlerts(weather.country);
        } catch (err) {
            console.error('GDACS alert fetch failed (continuing without it):', err);
        }

        const payload = {
            location: weather.resolved_location,
            observed_at: new Date().toISOString(),
            day: weather.day,
            temperature_c: weather.temperature_c,
            feels_like_c: weather.feels_like_c,
            humidity_percent: weather.humidity_percent,
            condition: weather.condition,
            high_c: weather.high_c,
            low_c: weather.low_c,
            rain_probability_percent: weather.rain_probability_percent,
            air_quality: weather.air_quality,
            active_alert: alerts.length > 0,
            alerts,
            earthquakes,
        };

        return Response.json(payload);
    } catch (err) {
        console.error('Error building /api/weather response:', err);
        return Response.json(
            { error: 'Failed to fetch weather/alert data', detail: err.message },
            { status: 500 }
        );
    }
}