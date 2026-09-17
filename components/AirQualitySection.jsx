'use client';

import React from 'react';

export default function AirQualitySection({ locationName = 'Brooklyn, New York, USA' }) {
    const metrics = [
        { label: 'Air Quality (AQI)', value: '38', status: 'Good', color: '#22c55e', desc: 'Minimal risk; clean air flow' },
        { label: 'UV Index', value: '4.2', status: 'Moderate', color: '#f59e0b', desc: 'SPF 30+ recommended midday' },
        { label: 'Visibility', value: '14 km', status: 'Optimal', color: '#38bdf8', desc: 'Clear panoramic horizon' },
        { label: 'Dew Point', value: '11°C', status: 'Comfortable', color: '#a855f7', desc: 'Low moisture mugginess' },
    ];

    const pollutants = [
        { name: 'PM2.5', val: '8.4 µg/m³', bar: 24, safe: 'Safe' },
        { name: 'PM10', val: '16.2 µg/m³', bar: 32, safe: 'Safe' },
        { name: 'Ozone (O₃)', val: '42.1 µg/m³', bar: 45, safe: 'Moderate' },
        { name: 'NO₂', val: '12.0 µg/m³', bar: 20, safe: 'Safe' },
    ];

    return (
        <section
            id="analytics-section"
            className="glass-panel scroll-reveal"
            style={{
                padding: '32px',
                marginTop: '32px',
                borderRadius: '28px',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-blue)',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                            <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                            Atmospheric Analytics & Air Composition
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            Precision aerosol concentrations and UV radiation profile
                        </p>
                    </div>
                </div>

                {/* Sun Cycle */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '8px 18px',
                        borderRadius: '24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '0.82rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#f59e0b' }}>☀️ Sunrise:</span>
                        <span style={{ color: '#ffffff', fontWeight: '600' }}>06:14 AM</span>
                    </div>
                    <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#a855f7' }}>🌙 Sunset:</span>
                        <span style={{ color: '#ffffff', fontWeight: '600' }}>07:42 PM</span>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {metrics.map((m, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: '20px 22px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.025)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{m.label}</span>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    color: m.color,
                                    backgroundColor: `${m.color}22`,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                }}
                            >
                                {m.status}
                            </span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 4px 0' }}>
                            {m.value}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {m.desc}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pollutant Bar Distribution */}
            <div
                style={{
                    backgroundColor: 'rgba(12, 14, 18, 0.5)',
                    borderRadius: '20px',
                    padding: '20px 24px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
            >
                <h4 style={{ fontSize: '0.92rem', fontWeight: '600', color: '#ffffff', marginBottom: '14px' }}>
                    Particulate Matter & Greenhouse Trace Gases
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {pollutants.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>{p.name}</span>
                                <span style={{ color: '#38bdf8', fontWeight: '600' }}>{p.val}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${p.bar}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #38bdf8, #06b6d4)',
                                        borderRadius: '3px',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
