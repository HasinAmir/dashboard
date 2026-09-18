// OpenWeatherMap Air Pollution API (free tier, same key as weather).
//
// Returns a small, human-ready summary plus the raw component readings.
// AQI index is 1-5: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor.

const AQI_TABLE = {
    1: { label: 'Good', advice: 'Air quality is good — enjoy the outdoors.' },
    2: { label: 'Fair', advice: 'Air quality is fair — a normal day for most people.' },
    3: {
        label: 'Moderate',
        advice: 'Air quality is moderate — sensitive groups should limit heavy outdoor exertion.',
    },
    4: {
        label: 'Poor',
        advice: 'Air quality is poor — avoid heavy outdoor exertion and keep windows closed where possible.',
    },
    5: {
        label: 'Very Poor',
        advice: 'Air quality is very poor — stay indoors and keep windows closed if you can.',
    },
};

function dominantPollutant(components) {
    const entries = Object.entries(components).filter(([, v]) => v != null);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    const [key] = entries[0];
    const names = {
        pm2_5: 'fine particulate matter',
        pm10: 'coarse particulate matter',
        no2: 'nitrogen dioxide',
        so2: 'sulfur dioxide',
        o3: 'ozone',
        co: 'carbon monoxide',
    };
    return names[key] || key;
}

export async function getAirQuality(lat, lon) {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) throw new Error('OPENWEATHERMAP_API_KEY is not set');
    if (lat == null || lon == null) return null;

    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`Air pollution request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const entry = data?.list?.[0];
    if (!entry) return null;

    const components = entry.components || {};
    const aqi = entry.main?.aqi;

    return {
        aqi,
        label: AQI_TABLE[aqi]?.label || 'Unknown',
        advice: AQI_TABLE[aqi]?.advice || '',
        dominant_pollutant: dominantPollutant(components),
        components,
    };
}