import { getWeather } from '@/lib/openweather';
import { getDisasterAlerts } from '@/lib/gdacs';

/**
 * GET /api/weather?location=Brooklyn
 *
 * Provides weather conditions, alerts, hourly forecast, weekly forecast,
 * and atmospheric data.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');
        const lat = searchParams.get('lat') || request.headers.get('x-vercel-ip-latitude');
        const lon = searchParams.get('lon') || request.headers.get('x-vercel-ip-longitude');
        const ipCity = request.headers.get('x-vercel-ip-city');

        const weather = await getWeather({
            location: location || (!lat && ipCity ? decodeURIComponent(ipCity) : null),
            lat,
            lon,
        });
        let alerts = [];
        try {
            alerts = await getDisasterAlerts(weather.country);
        } catch (e) {
            console.warn('GDACS fetch non-fatal error:', e.message);
        }

        const payload = {
            location: weather.resolved_location,
            observed_at: new Date().toISOString(),
            temperature_c: weather.temperature_c,
            condition: weather.condition,
            condition_subtitle: weather.condition_subtitle || 'with partly cloudy',
            high_c: weather.high_c,
            low_c: weather.low_c,
            rain_probability_percent: weather.rain_probability_percent,
            humidity: weather.humidity ?? 78,
            wind_speed_kmh: weather.wind_speed_kmh ?? 12,
            wind_direction: weather.wind_direction ?? 'Northwest',
            pressure_kpa: weather.pressure_kpa ?? 101.3,
            pressure_display: weather.pressure_display ?? '1 kPa',
            live_trend_percent: weather.live_trend_percent ?? '+23.8%',
            severity: weather.severity ?? (alerts.length > 0 ? 'Dangerous' : 'Moderate'),
            hourly: weather.hourly || [],
            daily: weather.daily || [],
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