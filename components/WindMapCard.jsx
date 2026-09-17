'use client';

import React, { useEffect, useRef } from 'react';

export default function WindMapCard({ speed = '12 km/h', direction = 'Northwest' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Particle simulation for wind vortex
        const numParticles = 75;
        const particles = [];
        const width = canvas.width;
        const height = canvas.height;

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 80 + 20,
                angle: Math.random() * Math.PI * 2,
                speed: (Math.random() * 0.015 + 0.008),
                length: Math.random() * 24 + 10,
                opacity: Math.random() * 0.45 + 0.15,
            });
        }

        const render = () => {
            ctx.fillStyle = 'rgba(12, 14, 18, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width * 0.75;
            const centerY = canvas.height * 0.55;

            ctx.lineWidth = 1.2;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.angle += p.speed;

                const curX = centerX + Math.cos(p.angle) * p.radius;
                const curY = centerY + Math.sin(p.angle) * (p.radius * 0.7);

                const prevX = centerX + Math.cos(p.angle - 0.12) * p.radius;
                const prevY = centerY + Math.sin(p.angle - 0.12) * (p.radius * 0.7);

                ctx.strokeStyle = `rgba(180, 200, 230, ${p.opacity})`;
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(curX, curY);
                ctx.stroke();

                // Gentle radius breathing
                p.radius += 0.08;
                if (p.radius > Math.max(canvas.width, canvas.height) * 0.7) {
                    p.radius = 20;
                    p.angle = Math.random() * Math.PI * 2;
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div
            className="glass-panel"
            style={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: '190px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px 28px',
            }}
        >
            {/* Animated Wind Particle Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    opacity: 0.6,
                }}
            />

            {/* Dark Vignette Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 75% 55%, transparent 20%, rgba(12, 14, 18, 0.7) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            {/* Header Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
                <h3
                    style={{
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                    }}
                >
                    Wind Map
                </h3>
                <div style={{ marginTop: '12px' }}>
                    <div
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#ffffff',
                        }}
                    >
                        {speed}
                    </div>
                    <div
                        style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                        }}
                    >
                        {direction}
                    </div>
                </div>
            </div>

            {/* Floating Location Marker Pin */}
            <div
                style={{
                    position: 'absolute',
                    right: '48px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 3,
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
            </div>
        </div>
    );
}
