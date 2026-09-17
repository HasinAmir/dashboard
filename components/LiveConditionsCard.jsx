'use client';

import React from 'react';

export default function LiveConditionsCard({
    trend = '↑ 23.8%',
    severity = 'Dangerous',
    humidity = 78,
    windSpeed = '12 km/h',
    pressure = '1 kPa',
    onViewMore,
}) {
    return (
        <div
            className="glass-panel"
            style={{
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '260px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Header: Title and Arrow */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    cursor: 'pointer',
                }}
                onClick={onViewMore}
            >
                <h3
                    style={{
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                    }}
                >
                    Live Conditions
                </h3>
                <span
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1.1rem',
                        lineHeight: 1,
                        transition: 'transform 0.2s ease',
                    }}
                >
                    ›
                </span>
            </div>

            {/* Sub-Header: Trend and Danger Badge */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                }}
            >
                <span
                    style={{
                        fontSize: '0.88rem',
                        color: 'rgba(255, 255, 255, 0.75)',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    {trend}
                </span>

                <div className="badge-dangerous">
                    <span
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 0 6px #ffffff',
                        }}
                    />
                    {severity}
                </div>
            </div>

            {/* Glowing Spline Wave Curve */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '80px',
                    margin: '6px 0 16px 0',
                }}
            >
                <svg
                    viewBox="0 0 340 80"
                    fill="none"
                    style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                    }}
                >
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Smooth Spline Curve matching the screenshot */}
                    <path
                        d="M 10 52 C 60 52, 90 22, 160 22 C 220 22, 250 48, 290 38 C 310 32, 330 18, 335 15"
                        stroke="url(#waveGradient)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        fill="none"
                        filter="url(#glow)"
                    />

                    {/* Active Glowing Marker Point on curve */}
                    <circle cx="280" cy="40" r="6" fill="#ffffff" filter="url(#glow)" />
                    <circle cx="280" cy="40" r="11" fill="none" stroke="#f97316" strokeWidth="2.5" opacity="0.8">
                        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                </svg>
            </div>

            {/* Bottom 3 Metrics: Humidity, Wind, Pressure */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}
            >
                {/* Humidity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                    <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: '600', color: '#ffffff' }}>{humidity}%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Humidity</div>
                    </div>
                </div>

                {/* Wind */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                    </svg>
                    <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: '600', color: '#ffffff' }}>{windSpeed}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Wind</div>
                    </div>
                </div>

                {/* Pressure */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                    <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: '600', color: '#ffffff' }}>{pressure}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pressure</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
