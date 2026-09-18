// USGS Earthquake FDSN query — free, no API key.
//
// Fetches recent earthquakes within a radius of a given point and returns
// them sorted by time (most recent first), with a human "time_ago" string
// and the computed distance in km.
//
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/

// Default fallback: Sylhet, Bangladesh (matches lib/openweather.js)
const DEFAULT_LAT = 24.8949;
const DEFAULT_LON = 91.8687;

const DEFAULT_OUTPUT = {
    radiusKm: 350,
    minMagnitude: 3.5,
    lookbackDays: 30,
};

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function humanizeAgo(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * @param {object} [opts]
 * @param {number} [opts.lat]       Center latitude (defaults to Sylhet)
 * @param {number} [opts.lon]       Center longitude (defaults to Sylhet)
 * @param {number} [opts.radiusKm]  Search radius in km
 * @param {number} [opts.minMagnitude]
 * @param {number} [opts.lookbackDays]
 * @returns {Promise<Array>} earthquakes sorted by time desc
 */
export async function getRecentEarthquakes({
    lat,
    lon,
    radiusKm = DEFAULT_OUTPUT.radiusKm,
    minMagnitude = DEFAULT_OUTPUT.minMagnitude,
    lookbackDays = DEFAULT_OUTPUT.lookbackDays,
} = {}) {
    const centerLat = lat == null ? DEFAULT_LAT : Number(lat);
    const centerLon = lon == null ? DEFAULT_LON : Number(lon);

    const start = new Date();
    start.setDate(start.getDate() - lookbackDays);

    const params = new URLSearchParams({
        format: 'geojson',
        eventtype: 'earthquake',
        minmagnitude: minMagnitude,
        maxradiuskm: radiusKm,
        latitude: centerLat,
        longitude: centerLon,
        starttime: start.toISOString(),
        orderby: 'time',
    });

    const res = await fetch(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`,
        { cache: 'no-store' }
    );
    if (!res.ok) {
        throw new Error(`USGS earthquake request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    const now = Date.now();
    return (data?.features || [])
        .map((feature) => {
            const props = feature.properties || {};
            const [elon, elat] = feature.geometry?.coordinates || [centerLon, centerLat];
            const timeMs = props.time || 0;
            return {
                mag: props.mag,
                place: props.place,
                time_ms: timeMs,
                time_ago: timeMs ? humanizeAgo(now - timeMs) : null,
                distance_km: Math.round(haversineKm(centerLat, centerLon, elat, elon)),
                felt: props.felt || null,
                tsunami: props.tsunami || 0,
                url: props.url,
            };
        })
        .filter((e) => e.mag != null && e.mag >= minMagnitude)
        .sort((a, b) => b.time_ms - a.time_ms);
}