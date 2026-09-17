'use client';

import React from 'react';

export default function RecentlySearchedCard({ onSelectCity }) {
    const recentCities = [
        {
            name: 'Liverpool, UK',
            condition: 'Partly Cloudy',
            temp: '16°',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" stroke="#f59e0b" />
                    <circle cx="12" cy="12" r="3" stroke="#f59e0b" />
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
            ),
        },
        {
            name: 'Palermo, Italy',
            condition: 'Rain/Thunder',
            temp: '-2°',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    <polyline points="13 14 11 18 15 18 13 22" stroke="#38bdf8" />
                    <line x1="8" y1="19" x2="8" y2="21" stroke="#38bdf8" />
                </svg>
            ),
        },
        {
            name: 'Tokyo, Japan',
            condition: 'Clear Sky',
            temp: '21°',
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            ),
        },
    ];

    return (
        <div
            className="glass-panel"
            style={{
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h3
                    style={{
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                    }}
                >
                    Recently Searched
                </h3>
                <span
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    See All ›
                </span>
            </div>

            {/* List of Cities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentCities.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => onSelectCity(item.name)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderRadius: '18px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        {/* Icon & Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.96rem', fontWeight: '600', color: '#ffffff' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {item.condition}
                                </div>
                            </div>
                        </div>

                        {/* Temperature */}
                        <div
                            style={{
                                fontSize: '1.45rem',
                                fontWeight: '500',
                                color: '#ffffff',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {item.temp}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
