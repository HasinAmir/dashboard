'use client';

import React from 'react';

function DayIcon({ icon = 'cloud', size = 26 }) {
    switch (icon) {
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
        case 'cloud-rain':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    <line x1="8" y1="19" x2="8" y2="21" />
                    <line x1="12" y1="19" x2="12" y2="21" />
                    <line x1="16" y1="19" x2="16" y2="21" />
                </svg>
            );
        default:
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
            );
    }
}

export default function WeeklyForecast({ dailyData = [] }) {
    const items = dailyData.length ? dailyData.slice(0, 7) : [
        { day: 'Sun', high: 28, low: 12, icon: 'sun', pop: 0 },
        { day: 'Mon', high: 26, low: 11, icon: 'cloud-sun', pop: 0 },
        { day: 'Tue', high: 27, low: 12, icon: 'cloud', pop: 0 },
        { day: 'Wed', high: 23, low: 13, icon: 'cloud-rain', pop: 60 },
        { day: 'Thu', high: 30, low: 14, icon: 'cloud', pop: 0 },
        { day: 'Fri', high: 23, low: 10, icon: 'cloud-sun', pop: 0 },
        { day: 'Sat', high: 24, low: 9, icon: 'sun', pop: 0 },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '12px',
                width: '100%',
            }}
        >
            {items.map((item, idx) => (
                <div
                    key={idx}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 12px',
                        minHeight: '180px',
                        borderRadius: '24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(16px)',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    {/* Day Name */}
                    <span
                        style={{
                            fontSize: '0.92rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontWeight: '500',
                        }}
                    >
                        {item.day}
                    </span>

                    {/* Day Weather Icon & Rain */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', margin: '12px 0' }}>
                        <DayIcon icon={item.icon} size={28} />
                        {item.pop > 0 && (
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: '#38bdf8',
                                    fontWeight: '700',
                                }}
                            >
                                {item.pop}%
                            </span>
                        )}
                    </div>

                    {/* High & Low Temps */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#ffffff',
                            }}
                        >
                            {item.high}°
                        </span>
                        <span
                            style={{
                                fontSize: '0.92rem',
                                color: 'rgba(255, 255, 255, 0.45)',
                                fontWeight: '400',
                            }}
                        >
                            {item.low}°
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
