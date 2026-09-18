/**
 * Turns raw weather + alert data into the exact spoken script DawnCast
 * should say -- calm and brief on an ordinary day, direct and urgent
 * the moment there's an active flood/cyclone alert or a notable quake.
 *
 * This is used by /api/briefing to build the `greeting` text that gets
 * spoken verbatim by AssemblyAI's Voice Agent (voice: "alba"), so the
 * wording itself lives here rather than being left to an LLM to improvise
 * each time -- keeps it consistent and reviewable.
 */
export function buildBriefingScript(weather, alerts, earthquakes = []) {
    const {
        location,
        temperature_c,
        feels_like_c,
        condition,
        high_c,
        low_c,
        rain_probability_percent,
        air_quality,
        timezone_offset = 0,
    } = weather;

    const localMs = Date.now() + timezone_offset * 1000;
    const localHour = new Date(localMs).getUTCHours();
    const isNight = localHour >= 19 || localHour < 5;

    let greeting = 'Good morning';
    if (localHour >= 12 && localHour < 17) greeting = 'Good afternoon';
    else if (localHour >= 17 && localHour < 22) greeting = 'Good evening';
    else if (localHour >= 22 || localHour < 5) greeting = 'Hello';

    const roundedTemp = Math.round(temperature_c);
    const condLower = (condition || '').toLowerCase();
    const feelsPhrase = (feels_like_c != null && Math.abs(feels_like_c - roundedTemp) >= 2)
        ? `, feeling like ${feels_like_c},`
        : '';

    if (alerts && alerts.length > 0) {
        const top = alerts[0];
        const kind = top.type === 'TC' ? 'cyclone' : top.type === 'FL' ? 'flood' : 'weather';
        return (
            `This is an urgent DawnCast alert for ${location}. ` +
            `A ${top.alert_level ? top.alert_level.toLowerCase() + ' level' : 'severe'} ${kind} warning is currently active. ` +
            `${top.name ? top.name + '. ' : ''}` +
            `Please stay alert and follow official guidance. ` +
            `Current conditions: ${roundedTemp} degrees and ${condLower}, ` +
            `with a high of ${high_c} and a low of ${low_c}.`
        );
    }

    const tips = [];

    if (rain_probability_percent >= 60 || condLower.includes('rain')) {
        tips.push(isNight ? `There's a chance of rain tonight, so keep an umbrella handy.` : `There's a high chance of rain today, so definitely keep an umbrella handy.`);
    } else if (roundedTemp >= 28 || (high_c && high_c >= 30)) {
        tips.push(isNight ? `It's quite warm tonight, so remember to stay hydrated.` : `It's quite hot today, so try to stay in the shade and keep hydrated.`);
    } else if (roundedTemp <= 17 || (low_c && low_c <= 14)) {
        tips.push(isNight ? `It's chilly tonight, so you might want a jacket.` : `It's on the chilly side, so make sure to take a sweater or jacket.`);
    } else if (!isNight && (condLower.includes('clear') || condLower.includes('sun'))) {
        tips.push(`With bright sunny skies today, stay hydrated if you're outside.`);
    }

    const adviceNote = tips.length > 0 ? ` ${tips[0]}` : ``;

    let aqNote = '';
    if (air_quality?.aqi >= 4) {
        aqNote = ` Air quality is ${air_quality.label.toLowerCase()}, so limit outdoor activity where possible.`;
    } else if (air_quality?.aqi === 3) {
        aqNote = ` Air quality is moderate.`;
    }

    let quakeNote = '';
    if (earthquakes.length > 0) {
        const q = earthquakes[0];
        const tsunamiNote = q.tsunami
            ? ` A tsunami warning may be in effect.`
            : '';
        quakeNote =
            ` A magnitude ${q.mag} earthquake was recorded about ${q.distance_km} kilometers away, ` +
            `${q.time_ago}.${tsunamiNote}`;
    }

    const closing = isNight ? 'Have a pleasant evening.' : 'Have a great day.';

    return (
        `${greeting}. This is your DawnCast briefing for ${location}. ` +
        `It's currently ${roundedTemp} degrees${feelsPhrase} and ${condLower}, ` +
        `with a high of ${high_c} and a low of ${low_c} expected today.${adviceNote}${aqNote}${quakeNote} ` +
        `No active flood or cyclone alerts right now. ${closing}`
    );
}