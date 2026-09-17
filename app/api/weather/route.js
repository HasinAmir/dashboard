import { getWeather } from '@/lib/openweather';
import { getDisasterAlerts } from '@/lib/gdacs';

// Ensures Next.js never serves a statically cached snapshot of this route --
// every request hits OpenWeatherMap/GDACS fresh.
export const dynamic = 'force-dynamic';

/**
 * GET /api/weather?location=Dhaka,BD&day=tomorrow
 *
 * `day` accepts "today" (default) or "tomorrow".
 *
 * Returns: location, observed_at, day, temperature_c, condition, high_c,
 * low_c, rain_probability_percent, active_alert, alerts[]
 *
 * (temperature_c is null for "tomorrow" -- there's no "current" reading
 * for a day that hasn't happened yet.)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');
        const dayParam = searchParams.get('day');
        const day = dayParam === 'tomorrow' ? 'tomorrow' : 'today';

        const weather = await getWeather(location, day);
        const alerts = await getDisasterAlerts(weather.country);

        const payload = {
            location: weather.resolved_location,
            observed_at: new Date().toISOString(),
            day: weather.day,
            temperature_c: weather.temperature_c,
            condition: weather.condition,
            high_c: weather.high_c,
            low_c: weather.low_c,
            rain_probability_percent: weather.rain_probability_percent,
            active_alert: alerts.length > 0,
            alerts,
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