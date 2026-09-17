'use client';

import React from 'react';

// Hazard abbreviation decoder
const HAZARD_ABBREVIATIONS = {
    TC: 'Tropical Cyclone',
    FL: 'Flash / River Flood',
    EQ: 'Earthquake Hazard',
    DR: 'Drought / Arid',
    VO: 'Volcano Eruption',
    TS: 'Tsunami Watch',
    WF: 'Wildfire Threat',
    'EXT-HEAT': 'Extreme Heat Wave',
    'EXT-COLD': 'Severe Frost & Freeze',
};

export default function HeroWeatherCard({
    temperature = 18,
    condition = 'Stormy',
    subtitle = 'with partly cloudy',
    high = 29,
    low = 12,
    rainProbability = 60,
    activeAlert = false,
    alertType = null,
    isSpeaking = false,
    isListening = false,
}) {
    const condLower = (condition || '').toLowerCase();
    const isFreezing = temperature <= 3 || condLower.includes('snow') || condLower.includes('ice');
    const isSunny = !isFreezing && (condLower.includes('clear') || condLower.includes('sun'));
    const isRainy = !isFreezing && (condLower.includes('rain') || condLower.includes('drizzle'));
    const isStormy = condLower.includes('thunder') || condLower.includes('storm');

    // Dynamic Weather Background Theme Selection
    let bgImage = '/images/storm_clouds.jpg';
    let themeGlow = 'rgba(56, 189, 248, 0.25)';
    let vignetteColor = 'radial-gradient(circle at 20% 40%, rgba(12, 14, 18, 0.4) 0%, rgba(12, 14, 18, 0.85) 100%)';

    if (isFreezing) {
        bgImage = '/images/winter_bg.jpg';
        themeGlow = 'rgba(147, 197, 253, 0.35)';
        vignetteColor = 'radial-gradient(circle at 20% 40%, rgba(10, 18, 30, 0.35) 0%, rgba(8, 12, 20, 0.88) 100%)';
    } else if (isSunny) {
        bgImage = '/images/sunny_bg.jpg';
        themeGlow = 'rgba(245, 158, 11, 0.35)';
        vignetteColor = 'radial-gradient(circle at 20% 40%, rgba(20, 15, 10, 0.3) 0%, rgba(12, 14, 18, 0.88) 100%)';
    } else if (isRainy) {
        bgImage = '/images/rainy_bg.jpg';
        themeGlow = 'rgba(6, 182, 212, 0.35)';
        vignetteColor = 'radial-gradient(circle at 20% 40%, rgba(8, 16, 24, 0.35) 0%, rgba(10, 14, 20, 0.88) 100%)';
    } else if (isStormy) {
        bgImage = '/images/storm_clouds.jpg';
        themeGlow = 'rgba(168, 85, 247, 0.35)';
        vignetteColor = 'radial-gradient(circle at 20% 40%, rgba(12, 14, 18, 0.4) 0%, rgba(12, 14, 18, 0.9) 100%)';
    }

    // Weather Temperature Evaluation: Too hot vs Too cold
    let tempAdvice = { text: 'Pleasant & Comfortable', icon: '✨', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
    if (temperature >= 32) {
        tempAdvice = { text: `Too Hot (${temperature}°C) — Stay Hydrated`, icon: '🔥', bg: 'rgba(239, 68, 68, 0.18)', border: 'rgba(239, 68, 68, 0.4)' };
    } else if (temperature <= 5) {
        tempAdvice = { text: `Too Cold (${temperature}°C) — Heavy Coat Needed`, icon: '❄️', bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.4)' };
    } else if (temperature <= 14) {
        tempAdvice = { text: `Chilly (${temperature}°C) — Wear Jacket`, icon: '🧥', bg: 'rgba(147, 197, 253, 0.15)', border: 'rgba(147, 197, 253, 0.3)' };
    }

    // Rain & Umbrella Advice
    const needsUmbrella = rainProbability >= 35 || isRainy || isStormy;
    const umbrellaAdvice = needsUmbrella
        ? { text: `Take Umbrella (${rainProbability}% rain)`, icon: '☔', bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.4)' }
        : { text: `No Umbrella Needed (${rainProbability}% rain)`, icon: '☀️', bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.12)' };

    // Hazard Abbreviation Logic
    let hazardCode = alertType;
    if (!hazardCode && activeAlert) hazardCode = 'FL';
    if (!hazardCode && temperature >= 35) hazardCode = 'EXT-HEAT';
    if (!hazardCode && temperature <= -2) hazardCode = 'EXT-COLD';

    const hazardName = hazardCode ? (HAZARD_ABBREVIATIONS[hazardCode] || 'Weather Advisory') : null;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                minHeight: '300px',
                borderRadius: '28px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                padding: '34px 36px 30px 36px',
                transition: 'border-color 0.4s ease',
            }}
        >
            {/* Dynamic Weather Background Theme Image */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.78) contrast(1.1)',
                    transform: isSpeaking ? 'scale(1.02)' : 'scale(1)',
                    transition: 'background-image 0.8s ease, transform 2s ease',
                    zIndex: 0,
                }}
            />

            {/* Vignette & Frosted Gradient Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: vignetteColor,
                    zIndex: 1,
                    transition: 'background 0.8s ease',
                }}
            />

            {/* Speaking / Audio Wave Glow */}
            {isSpeaking && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        boxShadow: `inset 0 0 60px ${themeGlow}`,
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Left Content: Temperature, Condition, High/Low, Smart Advice Badges */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    maxWidth: '65%',
                }}
            >
                {/* Temperature */}
                <div
                    style={{
                        fontSize: '5.4rem',
                        fontWeight: '300',
                        lineHeight: 1,
                        color: '#ffffff',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.04em',
                    }}
                >
                    {temperature}°
                </div>

                {/* Condition and Badges */}
                <div style={{ marginTop: '12px' }}>
                    <h2
                        style={{
                            fontSize: '2rem',
                            fontWeight: '600',
                            color: '#ffffff',
                            lineHeight: 1.1,
                            margin: 0,
                        }}
                    >
                        {condition}
                    </h2>
                    <p
                        style={{
                            fontSize: '0.98rem',
                            color: 'rgba(255, 255, 255, 0.75)',
                            margin: '4px 0 14px 0',
                            fontWeight: '400',
                        }}
                    >
                        {subtitle}
                    </p>

                    {/* High/Low Pills */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <span
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                padding: '5px 12px',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                fontWeight: '500',
                            }}
                        >
                            H {high}°
                        </span>
                        <span
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                padding: '5px 12px',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                fontWeight: '500',
                            }}
                        >
                            L {low}°
                        </span>
                    </div>

                    {/* Smart Weather Advice Pills (Too Hot / Too Cold, Umbrella, Hazard Abbreviation) */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Temp comfort */}
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                backgroundColor: tempAdvice.bg,
                                border: `1px solid ${tempAdvice.border}`,
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                            }}
                        >
                            <span>{tempAdvice.icon}</span>
                            <span>{tempAdvice.text}</span>
                        </div>

                        {/* Umbrella advice */}
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                backgroundColor: umbrellaAdvice.bg,
                                border: `1px solid ${umbrellaAdvice.border}`,
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                            }}
                        >
                            <span>{umbrellaAdvice.icon}</span>
                            <span>{umbrellaAdvice.text}</span>
                        </div>

                        {/* Hazard Abbreviation Pill */}
                        {hazardCode ? (
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                    border: '1px solid rgba(245, 158, 11, 0.45)',
                                    color: '#f59e0b',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                }}
                                title={`Disaster Abbreviation: ${hazardCode} = ${hazardName}`}
                            >
                                <span>⚠️</span>
                                <span>[{hazardCode}] {hazardName}</span>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 10px',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.25)',
                                    color: '#22c55e',
                                    fontSize: '0.74rem',
                                    fontWeight: '600',
                                }}
                            >
                                <span>🛡️</span>
                                <span>[TC/FL/EQ: Safe]</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Content: Floating Glass Quote & Weather Theme Indicator */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    maxWidth: '250px',
                    marginLeft: '20px',
                }}
            >
                {/* Weather Theme Tag */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                    }}
                >
                    <span
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isSunny ? '#f59e0b' : isFreezing ? '#93c5fd' : isRainy ? '#06b6d4' : '#a855f7',
                            boxShadow: `0 0 8px ${themeGlow}`,
                        }}
                    />
                    <span>{isSunny ? 'Sunny Horizon Theme' : isFreezing ? 'Frosty Winter Theme' : isRainy ? 'Rain Reflection Theme' : 'Storm Dynamic Theme'}</span>
                </div>

                {/* Floating Glass Panel */}
                <div
                    style={{
                        background: 'rgba(20, 23, 30, 0.65)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        padding: '18px 20px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                    }}
                >
                    <p
                        style={{
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            color: 'rgba(255, 255, 255, 0.85)',
                            margin: 0,
                            fontWeight: '400',
                        }}
                    >
                        With real time data and advanced technology, we provide reliable forecasts for any location around the world.
                    </p>
                </div>
            </div>
        </div>
    );
}
