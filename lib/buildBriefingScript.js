/**
 * Turns raw weather + alert data into the exact spoken script DawnCast
 * should say -- calm and brief on an ordinary day, direct and urgent
 * the moment there's an active flood/cyclone/heatwave alert.
 *
 * This is used by /api/briefing to build the `greeting` text that gets
 * spoken verbatim by AssemblyAI's Voice Agent (voice: "alba"), so the
 * wording itself lives here rather than being left to an LLM to improvise
 * each time -- keeps it consistent and reviewable.
 */
export function buildBriefingScript(weather, alerts) {
    const {
        location,
        temperature_c,
        condition,
        high_c,
        low_c,
        rain_probability_percent,
    } = weather;

    if (alerts && alerts.length > 0) {
        const top = alerts[0];
        const kind = top.type === 'TC' ? 'cyclone' : top.type === 'FL' ? 'flood' : 'weather';
        return (
            `This is an urgent DawnCast alert for ${location}. ` +
            `A ${top.alert_level ? top.alert_level.toLowerCase() + ' level' : 'severe'} ${kind} warning is currently active. ` +
            `${top.name ? top.name + '. ' : ''}` +
            `Please stay alert and follow official guidance. ` +
            `Today's conditions: ${Math.round(temperature_c)} degrees and ${condition.toLowerCase()}, ` +
            `with a high of ${high_c} and a low of ${low_c}.`
        );
    }

    const tips = [];

    if (rain_probability_percent >= 60 || condition.toLowerCase().includes('rain')) {
        tips.push(`There's a high chance of rain today, so definitely keep an umbrella handy.`);
    } else if (rain_probability_percent >= 30) {
        tips.push(`There's a chance of rain later, so you might want to take an umbrella.`);
    }

    if (temperature_c <= 17 || low_c <= 14) {
        tips.push(`It's on the chilly side, so make sure to take a sweater or jacket outside.`);
    } else if (high_c >= 28 || temperature_c >= 28) {
        tips.push(`It's quite hot today, so try to stay in the shade and remember to carry a bottle of water to stay hydrated.`);
    } else if (condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sun')) {
        tips.push(`With bright sunny skies today, consider keeping a bottle of water with you and taking breaks in the shade.`);
    }

    const adviceNote = tips.length > 0 ? ` ${tips.join(' ')}` : ``;

    return (
        `Good morning. This is your DawnCast briefing for ${location}. ` +
        `It's currently ${Math.round(temperature_c)} degrees and ${condition.toLowerCase()}, ` +
        `with a high of ${high_c} and a low of ${low_c} expected today.${adviceNote} ` +
        `No active weather alerts right now. Have a great day.`
    );
}