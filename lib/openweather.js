import { getAirQuality } from '@/lib/airquality';

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

function formatLocationName(cityName, countryCode) {
    if (!cityName) return DEFAULT_LOCATION_NAME;
    if (!countryCode) return cityName;
    try {
        const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode);
        return `${cityName}, ${countryName || countryCode}`;
    } catch {
        return `${cityName}, ${countryCode}`;
    }
}

async function detectLocationByIp() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch('https://ipwho.is/', {
            cache: 'no-store',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            if (data && data.success !== false && data.latitude && data.longitude) {
                const name = formatLocationName(data.city, data.country_code);
                return {
                    lat: Number(data.latitude),
                    lon: Number(data.longitude),
                    name: name || data.city,
                };
            }
        }
    } catch (err) {
        console.warn('IP location detection fallback failed:', err.message);
    }
    return null;
}

async function resolveLocation({ location, lat, lon } = {}, apiKey) {
    if (lat != null && lon != null && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
        const parsedLat = Number(lat);
        const parsedLon = Number(lon);
        let name = (location && location !== 'Your location') ? location : null;

        if (!name && apiKey) {
            try {
                const reverseUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${parsedLat}&lon=${parsedLon}&limit=1&appid=${apiKey}`;
                const res = await fetch(reverseUrl, { cache: 'no-store' });
                if (res.ok) {
                    const results = await safeJson(res, 'Reverse Geocoding');
                    if (results && results.length > 0) {
                        const match = results[0];
                        name = formatLocationName(match.name, match.country);
                    }
                }
            } catch (err) {
                console.warn('Reverse geocoding failed:', err.message);
            }
        }

        return { lat: parsedLat, lon: parsedLon, name: name || null };
    }

    if (location && location !== 'Your location') {
        if (!apiKey) {
            return { lat: DEFAULT_LAT, lon: DEFAULT_LON, name: location };
        }
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
        const res = await fetch(geoUrl, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`OpenWeatherMap geocoding request failed: ${res.status} ${res.statusText}`);
        }
        const results = await safeJson(res, 'Geocoding');

        if (!results.length) {
            return { lat: DEFAULT_LAT, lon: DEFAULT_LON, name: location || DEFAULT_LOCATION_NAME };
        }

        const match = results[0];
        const name = formatLocationName(match.name, match.country);
        return { lat: match.lat, lon: match.lon, name };
    }

    // Neither coords nor location were provided — attempt automatic IP geolocation
    const ipDetected = await detectLocationByIp();
    if (ipDetected) {
        return ipDetected;
    }

    return { lat: DEFAULT_LAT, lon: DEFAULT_LON, name: DEFAULT_LOCATION_NAME };
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
 * Accepts either a string location name, or an object:
 *   getWeather('Dhaka')  |  getWeather({ location, lat, lon, day })
 *
 * - "today": temperature_c is the live current reading. high_c/low_c
 *   include the current reading itself (not just remaining forecast
 *   slots), so an already-passed daily peak isn't missed.
 * - "tomorrow": derived entirely from the 3-hour forecast slots that
 *   fall on the location's local "tomorrow" date.
 *
 * Also returns `air_quality` (a current, not forecast, measurement) and
 * `resolved_lat` / `resolved_lon` so callers can feed coords to the
 * earthquake and air-quality fetchers without a second lookup.
 */
export async function getWeather(locationQuery, day = 'today') {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    let location, lat, lon;
    if (locationQuery && typeof locationQuery === 'object') {
        ({ location, lat, lon } = locationQuery);
        if (locationQuery.day) day = locationQuery.day;
    } else {
        location = locationQuery;
    }

    const { lat: rLat, lon: rLon, name } = await resolveLocation({ location, lat, lon }, apiKey);

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${rLat}&lon=${rLon}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${rLat}&lon=${rLon}&units=metric&appid=${apiKey}`;

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

    // Air quality is a "now" reading -- nice to have, but never let it
    // take down the whole weather/briefing request.
    let air_quality = null;
    try {
        air_quality = await getAirQuality(rLat, rLon);
    } catch (err) {
        console.error('Air quality fetch failed (continuing without it):', err);
    }

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

    const finalLocationName = (name && name !== 'Your location')
        ? name
        : (current.name ? formatLocationName(current.name, current.sys?.country) : (name || DEFAULT_LOCATION_NAME));

    if (day === 'tomorrow') {
        return {
            resolved_location: finalLocationName,
            resolved_lat: rLat,
            resolved_lon: rLon,
            country: current.sys?.country,
            timezone_offset: tzOffset,
            day: 'tomorrow',
            // No "current" reading applies to a future day.
            temperature_c: null,
            condition: matchingEntries[0]?.weather?.[0]?.main || 'Unknown',
            high_c: temps.length ? Math.round(Math.max(...temps)) : null,
            low_c: temps.length ? Math.round(Math.min(...temps)) : null,
            rain_probability_percent: pops.length ? Math.round(Math.max(...pops) * 100) : 0,
            air_quality,
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
        resolved_location: finalLocationName,
        resolved_lat: rLat,
        resolved_lon: rLon,
        country: current.sys?.country,
        timezone_offset: tzOffset,
        day: 'today',
        temperature_c: Math.round(current.main.temp),
        feels_like_c: current.main?.feels_like != null ? Math.round(current.main.feels_like) : null,
        humidity_percent: current.main?.humidity ?? null,
        condition: current.weather?.[0]?.main || 'Unknown',
        high_c,
        low_c,
        rain_probability_percent,
        air_quality,
    };
}