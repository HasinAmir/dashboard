'use client';

import React from 'react';

function WeatherIcon({ icon = 'cloud', size = 22 }) {
    switch (icon) {
        case 'cloud-lightning':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                    <polyline points="13 11 9 17 15 17 11 23" />
                </svg>
            );
        case 'cloud-rain':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    <line x1="8" y1="19" x2="8" y2="21" />
                    <line x1="12" y1="19" x2="12" y2="21" />
                    <line x1="16" y1="19" x2="16" y2="21" />
                </svg>
            );
        case 'moon':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
            );
        case 'sun':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            );
        case 'cloud-sun':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" stroke="#f59e0b" />
                    <circle cx="12" cy="12" r="3" stroke="#f59e0b" />
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
            );
        default:
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
            );
    }
}

export default function HourlyForecast({ hourlyData = [] }) {
    const items = hourlyData.length ? hourlyData.slice(0, 8) : [
        { time: 'Now', temp: 18, icon: 'cloud-lightning', pop: 0 },
        { time: '2 PM', temp: 19, icon: 'cloud', pop: 0 },
        { time: '3 PM', temp: 20, icon: 'cloud', pop: 0 },
        { time: '4 PM', temp: 20, icon: 'cloud-rain', pop: 60 },
        { time: '5 PM', temp: 19, icon: 'cloud-rain', pop: 60 },
        { time: '6 PM', temp: 18, icon: 'cloud', pop: 0 },
        { time: '7 PM', temp: 17, icon: 'cloud', pop: 0 },
        { time: '8 PM', temp: 16, icon: 'moon', pop: 0 },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '10px',
                width: '100%',
            }}
        >
            {items.map((item, idx) => {
                const isFirst = idx === 0;
                return (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 8px',
                            minHeight: '130px',
                            borderRadius: '20px',
                            backgroundColor: isFirst ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: isFirst ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(12px)',
                            transition: 'all 0.25s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isFirst ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Time */}
                        <span
                            style={{
                                fontSize: '0.82rem',
                                color: 'rgba(255, 255, 255, 0.75)',
                                fontWeight: '500',
                            }}
                        >
                            {item.time}
                        </span>

                        {/* Weather Icon & Rain % */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', margin: '8px 0' }}>
                            <WeatherIcon icon={item.icon} size={22} />
                            {item.pop > 0 && (
                                <span
                                    style={{
                                        fontSize: '0.68rem',
                                        color: '#38bdf8',
                                        fontWeight: '700',
                                    }}
                                >
                                    {item.pop}%
                                </span>
                            )}
                        </div>

                        {/* Temperature */}
                        <span
                            style={{
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                color: '#ffffff',
                            }}
                        >
                            {item.temp}°
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
