'use client';

import { useState, useEffect } from 'react';
import { enablePushBriefing, disablePushBriefing } from '@/lib/push';

export default function BriefingToggle() {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Reflect actual browser permission state on load, so the switch
        // doesn't lie if the user granted/revoked permission outside the app.
        if (typeof Notification !== 'undefined') {
            setEnabled(Notification.permission === 'granted');
        }
    }, []);

    async function handleToggle() {
        setError(null);
        setLoading(true);

        try {
            if (enabled) {
                await disablePushBriefing();
                setEnabled(false);
            } else {
                await enablePushBriefing();
                setEnabled(true);
            }
        } catch (err) {
            console.error('Failed to toggle briefing notifications:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
                onClick={handleToggle}
                disabled={loading}
                role="switch"
                aria-checked={enabled}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 18px',
                    color: 'white',
                    cursor: loading ? 'default' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    fontSize: '15px',
                    fontWeight: 600,
                }}
            >
                <span
                    style={{
                        width: 40,
                        height: 22,
                        borderRadius: 999,
                        background: enabled ? '#4caf50' : 'rgba(255,255,255,0.3)',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            top: 2,
                            left: enabled ? 20 : 2,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'left 0.2s',
                        }}
                    />
                </span>
                {loading ? 'Setting up…' : enabled ? '🔔 7 AM briefing on' : 'Enable 7 AM briefing'}
            </button>

            {error && (
                <p style={{ color: '#ff9d9d', fontSize: '13px', textAlign: 'center', margin: 0 }}>
                    {error}
                </p>
            )}
        </div>
    );
}