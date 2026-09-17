/**
 * Checks GDACS (Global Disaster Alert and Coordination System) for any
 * active flood / tropical cyclone events affecting a given country.
 */
export async function getDisasterAlerts(countryCode) {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 2);

    const format = (d) => d.toISOString().split('T')[0];

    const url =
        `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH` +
        `?eventlist=FL;TC` +
        `&fromdate=${format(fromDate)}` +
        `&todate=${format(today)}` +
        `&alertlevel=orange;red`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`GDACS request failed: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    let data;
    if (!text) {
        // GDACS sometimes returns an empty body when there are zero matching
        // events, rather than a proper empty FeatureCollection -- treat that
        // as "no alerts" instead of throwing.
        return [];
    }
    try {
        data = JSON.parse(text);
    } catch (err) {
        throw new Error(
            `GDACS: response was not valid JSON (status ${res.status}). Body started with: ${text.slice(0, 200)}`
        );
    }

    const features = data?.features || [];

    let countryName;
    try {
        countryName = countryCode
            ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode)
            : undefined;
    } catch {
        countryName = undefined;
    }

    const relevant = countryName
        ? features.filter((f) => {
            const countries = f?.properties?.affectedcountries || [];
            return countries.some((c) =>
                (c.countryname || '').toLowerCase().includes(countryName.toLowerCase())
            );
        })
        : features;

    return relevant.map((f) => ({
        type: f.properties.eventtype,
        name: f.properties.eventname || f.properties.name,
        alert_level: f.properties.alertlevel,
        description: f.properties.htmldescription
            ? f.properties.htmldescription.replace(/<[^>]+>/g, '').trim()
            : undefined,
        from_date: f.properties.fromdate,
        to_date: f.properties.todate,
    }));
}