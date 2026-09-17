'use client';

import React, { useState } from 'react';

export default function TopBar({
    location,
    dateString,
    onSearchCity,
    isMicActive,
    isListening,
    isSpeaking,
    onToggleMic,
    onOpenVoiceModal,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearchCity(searchQuery.trim());
            setIsSearchOpen(false);
        }
    };

    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 0 24px 0',
                gap: '16px',
                flexWrap: 'wrap',
            }}
        >
            {/* Left: Location & Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                </div>
                <div>
                    <h1
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        {location || 'Brooklyn, New York, USA'}
                    </h1>
                    <p
                        style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            marginTop: '2px',
                        }}
                    >
                        {dateString || 'Friday, January 4'}
                    </p>
                </div>
            </div>

            {/* Right: Search, Live Mic Status, Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search Pill */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search city (e.g. Tokyo, London)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchOpen(true)}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '30px',
                            padding: '10px 18px 10px 42px',
                            color: '#ffffff',
                            fontSize: '0.86rem',
                            outline: 'none',
                            width: isSearchOpen || searchQuery ? '260px' : '180px',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    />
                    <button
                        type="submit"
                        title="Search"
                        style={{
                            position: 'absolute',
                            left: '12px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                        }}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                </form>

                {/* Live Mic Status Indicator */}
                <button
                    onClick={onToggleMic}
                    title={isMicActive ? 'Microphone Active — Click to mute' : 'Microphone Inactive — Click to speak'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '30px',
                        backgroundColor: isMicActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        border: isMicActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isMicActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        transition: 'all 0.25s ease',
                    }}
                >
                    {isMicActive ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '14px' }}>
                                <div className="mic-wave-bar" style={{ height: isSpeaking ? '14px' : '8px' }} />
                                <div className="mic-wave-bar" style={{ height: isSpeaking ? '18px' : '12px' }} />
                                <div className="mic-wave-bar" style={{ height: isSpeaking ? '10px' : '6px' }} />
                            </div>
                            <span>{isSpeaking ? 'DawnCast Speaking' : isListening ? 'Listening...' : 'Mic Live'}</span>
                        </>
                    ) : (
                        <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="1" y1="1" x2="23" y2="23" />
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                            <span>Enable Mic</span>
                        </>
                    )}
                </button>

                {/* Download App / Action Button */}
                <button
                    onClick={onOpenVoiceModal}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        padding: '10px 20px',
                        borderRadius: '30px',
                        fontSize: '0.86rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                >
                    Download App
                </button>
            </div>
        </header>
    );
}
