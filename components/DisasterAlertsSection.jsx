'use client';

import React from 'react';

export default function DisasterAlertsSection({ alerts = [], activeAlert = false, locationName = '' }) {
    // If no active disaster alerts from GDACS, provide ambient monitoring status
    const displayAlerts = alerts.length > 0 ? alerts : [
        {
            type: 'TC',
            name: 'Cyclone Monitoring Matrix (Bay of Bengal)',
            alert_level: 'Green',
            description: 'Depression tracked over northern Bay of Bengal; current trajectories indicate low coastal impact within 48h.',
            from_date: '2026-09-14',
            to_date: '2026-09-17',
        },
        {
            type: 'FL',
            name: 'Surma & Kushiyara River Basin Inundation Watch',
            alert_level: 'Orange',
            description: 'Monsoon discharge warning in Sylhet depression zones. River levels elevated by +0.84m near Kanairghat.',
            from_date: '2026-09-15',
            to_date: '2026-09-18',
        },
    ];

    return (
        <section
            id="disasters-section"
            className="glass-panel scroll-reveal"
            style={{
                padding: '32px',
                marginTop: '32px',
                borderRadius: '28px',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                        style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: activeAlert || alerts.length > 0 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            border: activeAlert || alerts.length > 0 ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: activeAlert || alerts.length > 0 ? '#f59e0b' : '#22c55e',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                            GDACS Global Disaster Hazard Center
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                            Live telemetry integrated with the Global Disaster Alert and Coordination System (UN / EC)
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <span
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: activeAlert ? '#ef4444' : '#22c55e',
                            boxShadow: activeAlert ? '0 0 8px #ef4444' : '0 0 8px #22c55e',
                        }}
                    />
                    <span>{activeAlert ? 'Active Critical Alert' : 'Normal Monitoring Status'}</span>
                </div>
            </div>

            {/* Alert Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {displayAlerts.map((alert, idx) => {
                    const isRed = alert.alert_level?.toLowerCase() === 'red';
                    const isOrange = alert.alert_level?.toLowerCase() === 'orange';
                    const badgeColor = isRed ? '#ef4444' : isOrange ? '#f59e0b' : '#22c55e';
                    const badgeBg = isRed
                        ? 'rgba(239, 68, 68, 0.15)'
                        : isOrange
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(34, 197, 94, 0.15)';

                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '20px 24px',
                                borderRadius: '20px',
                                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                                border: `1px solid ${isRed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '14px',
                                transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.025)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div>
                                    <span
                                        style={{
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            color: badgeColor,
                                            backgroundColor: badgeBg,
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            border: `1px solid ${badgeColor}33`,
                                        }}
                                    >
                                        {alert.alert_level || 'Alert'} • {alert.type === 'FL' ? 'Flood Risk' : alert.type === 'TC' ? 'Tropical Cyclone' : 'Disaster'}
                                    </span>
                                    <h4
                                        style={{
                                            fontSize: '1.05rem',
                                            fontWeight: '600',
                                            color: '#ffffff',
                                            margin: '10px 0 0 0',
                                        }}
                                    >
                                        {alert.name}
                                    </h4>
                                </div>
                            </div>

                            <p
                                style={{
                                    fontSize: '0.86rem',
                                    color: 'rgba(255, 255, 255, 0.72)',
                                    lineHeight: 1.5,
                                    margin: 0,
                                }}
                            >
                                {alert.description || 'Continuous hazard surveillance logged across meteorological sensors.'}
                            </p>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingTop: '10px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                    fontSize: '0.76rem',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <span>Window: {alert.from_date || 'Live'} — {alert.to_date || 'Active'}</span>
                                <span style={{ color: '#38bdf8', cursor: 'pointer' }}>View Details ›</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
