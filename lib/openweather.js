// Default fallback: Sylhet, Bangladesh
const DEFAULT_LAT = 24.8949;
const DEFAULT_LON = 91.8687;
const DEFAULT_LOCATION_NAME = 'Sylhet, Bangladesh';

async function safeJson(res, label) {
    const text = await res.text();
    if (!text) {
        throw new Error(`${label}: empty response body (status ${res.status})`);
    }
    try {
        return JSON.parse(text);
    } catch (err) {
        throw new Error(
            `${label}: response was not valid JSON (status ${res.status}). Body started with: ${text.slice(0, 200)}`
        );
    }
}

async function resolveLocation(locationQuery, apiKey) {
    if (!locationQuery) {
        return { lat: DEFAULT_LAT, lon: DEFAULT_LON, name: DEFAULT_LOCATION_NAME };
    }

    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`;
    const res = await fetch(geoUrl, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`OpenWeatherMap geocoding request failed: ${res.status} ${res.statusText}`);
    }
    const results = await safeJson(res, 'Geocoding');

    if (!results.length) {
        return { lat: DEFAULT_LAT, lon: DEFAULT_LON, name: DEFAULT_LOCATION_NAME };
    }

    const match = results[0];
    const name = [match.name, match.state, match.country].filter(Boolean).join(', ');
    return { lat: match.lat, lon: match.lon, name };
}

/**
 * Converts a UTC timestamp (seconds) + a location's UTC offset (seconds)
 * into that location's own local calendar date string (YYYY-MM-DD).
 * This matters because "today"/"tomorrow" must be judged by the
 * LOCATION's clock, not the server's UTC clock -- otherwise a request
 * near midnight can silently grab the wrong day's data.
 */
function localDateString(utcSeconds, tzOffsetSeconds) {
    const localMs = (utcSeconds + tzOffsetSeconds) * 1000;
    return new Date(localMs).toISOString().split('T')[0];
}

/**
 * Fetches weather for a given location and day ("today" or "tomorrow").
 *
 * - "today": temperature_c is the live current reading. high_c/low_c
 *   include the current reading itself (not just remaining forecast
 *   slots), so an already-passed daily peak isn't missed.
 * - "tomorrow": derived entirely from the 3-hour forecast slots that
 *   fall on the location's local "tomorrow" date.
 */
export async function getWeather(locationQuery, day = 'today') {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    const { lat, lon, name } = await resolveLocation(locationQuery, apiKey);

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const [currentRes, forecastRes] = await Promise.all([
        fetch(currentUrl, { cache: 'no-store' }),
        fetch(forecastUrl, { cache: 'no-store' }),
    ]);

    if (!currentRes.ok) {
        throw new Error(`OpenWeatherMap current-weather request failed: ${currentRes.status} ${currentRes.statusText}`);
    }
    if (!forecastRes.ok) {
        throw new Error(`OpenWeatherMap forecast request failed: ${forecastRes.status} ${forecastRes.statusText}`);
    }

    const current = await safeJson(currentRes, 'Current weather');
    const forecast = await safeJson(forecastRes, 'Forecast');

    const tzOffset = current.timezone || 0; // seconds, from OpenWeatherMap
    const nowUtcSeconds = Math.floor(Date.now() / 1000);
    const todayLocal = localDateString(nowUtcSeconds, tzOffset);
    const tomorrowLocal = localDateString(nowUtcSeconds + 86400, tzOffset);

    const targetDateStr = day === 'tomorrow' ? tomorrowLocal : todayLocal;

    const matchingEntries = (forecast.list || []).filter((entry) => {
        const entryLocal = localDateString(entry.dt, tzOffset);
        return entryLocal === targetDateStr;
    });

    const temps = matchingEntries.map((e) => e.main.temp);
    const pops = matchingEntries.map((e) => e.pop || 0);

    if (day === 'tomorrow') {
        return {
            resolved_location: name,
            country: current.sys?.country,
            day: 'tomorrow',
            // No "current" reading applies to a future day.
            temperature_c: null,
            condition: matchingEntries[0]?.weather?.[0]?.main || 'Unknown',
            high_c: temps.length ? Math.round(Math.max(...temps)) : null,
            low_c: temps.length ? Math.round(Math.min(...temps)) : null,
            rain_probability_percent: pops.length ? Math.round(Math.max(...pops) * 100) : 0,
        };
    }

    // "today": always include the live current reading so an
    // already-passed peak (e.g. asking at 4pm about this morning's high)
    // is never missing from high_c/low_c.
    const allTemps = [...temps, current.main.temp];
    const high_c = Math.round(Math.max(...allTemps));
    const low_c = Math.round(Math.min(...allTemps));
    const rain_probability_percent = pops.length ? Math.round(Math.max(...pops) * 100) : 0;

    return {
        resolved_location: name,
        country: current.sys?.country,
        day: 'today',
        temperature_c: Math.round(current.main.temp),
        condition: current.weather?.[0]?.main || 'Unknown',
        high_c,
        low_c,
        rain_probability_percent,
    };
}