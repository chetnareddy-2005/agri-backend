import React, { useEffect, useRef, useState } from 'react';

const ContinuousAuthWrapper = ({ children }) => {
    const isTracking = useRef(true);
    const metricsRef = useRef({
        keyPresses: 0,
        mouseDistance: 0,
        scrolls: 0,
        startTime: Date.now(),
        lastMousePos: null
    });

    const [alertMessage, setAlertMessage] = useState(null);

    useEffect(() => {
        // Track Typing
        const handleKeyDown = () => {
            if (isTracking.current) metricsRef.current.keyPresses += 1;
        };

        // Track Mouse Movement Speed
        const handleMouseMove = (e) => {
            if (!isTracking.current) return;
            const pos = metricsRef.current.lastMousePos;
            if (pos) {
                const dist = Math.sqrt(
                    Math.pow(e.clientX - pos.x, 2) + Math.pow(e.clientY - pos.y, 2)
                );
                metricsRef.current.mouseDistance += dist;
            }
            metricsRef.current.lastMousePos = { x: e.clientX, y: e.clientY };
        };

        // Track Scrolling
        const handleScroll = () => {
            if (isTracking.current) metricsRef.current.scrolls += 1;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        // Evaluate Telemetry every 5 seconds
        const evaluationInterval = setInterval(() => {
            if (!isTracking.current) return;

            const now = Date.now();
            const timeElapsedMinutes = (now - metricsRef.current.startTime) / 60000 || 0.01;

            // Calculate Metrics
            const typingSpeedWpm = (metricsRef.current.keyPresses / 5) / timeElapsedMinutes;
            const mouseMovementAvgSpeed = metricsRef.current.mouseDistance / timeElapsedMinutes; // Pixels per minute
            const scrollFrequency = metricsRef.current.scrolls;

            // Normalize real-time DOM metrics 
            const demoMouseWiggleRatio = (mouseMovementAvgSpeed > 10000) ? 5000 : 0; // The Hackathon Wiggle Trigger 🚀
            
            const normalizedTyping = (metricsRef.current.keyPresses > 5) ? 400 : 60; // 60 is LOW, 400 is HIGH
            const normalizedMouse = 100 + demoMouseWiggleRatio;
            const normalizedScroll = (scrollFrequency > 5) ? 100 : 3;

            // Optional Output to Console so you can see it working!
            console.log("DOM Speed:", mouseMovementAvgSpeed.toFixed(0), "-> ML Scaled Mouse:", normalizedMouse);

            // Only send if the user is actually active (no need to send idle states)
            if (metricsRef.current.keyPresses > 0 || metricsRef.current.mouseDistance > 0 || metricsRef.current.scrolls > 0) {
                
                // Get local user info
                const user = JSON.parse(localStorage.getItem('user')) || { email: "FARMER_BOB" }; // Ensure fallback has ID

                fetch("http://localhost:8080/api/v1/telemetry/evaluate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: user.email,
                        telemetry: {
                            typingSpeedWpm: normalizedTyping,
                            mouseMovementAvgSpeed: normalizedMouse,
                            scrollFrequency: normalizedScroll
                        }
                    })
                })
                .then(res => {
                    if (res.status === 403 || res.status === 401) {
                        return res.json().then(data => {
                            throw new Error(data.error || data.challenge || "Security Violation");
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    // Risk is LOW
                    setAlertMessage(null);
                })
                .catch(err => {
                    // Risk is HIGH / MEDIUM
                    isTracking.current = false; // Stop tracking once locked
                    setAlertMessage("SECURITY LOCKOUT: Suspicious Behavior Detected (" + err.message + ")");
                });
            }

            // Reset for next window
            metricsRef.current = {
                keyPresses: 0,
                mouseDistance: 0,
                scrolls: 0,
                startTime: Date.now(),
                lastMousePos: null
            };

        }, 5000); // 5000ms = 5 seconds

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            clearInterval(evaluationInterval);
        };
    }, []);

    // Full screen red warning
    if (alertMessage) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(255, 0, 0, 0.9)', color: 'white', zIndex: 999999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>🚨 ACCESS DENIED</h1>
                <p style={{ fontSize: '1.5rem', marginTop: '20px' }}>{alertMessage}</p>
                <button 
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '40px', padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    Refresh Session
                </button>
            </div>
        );
    }

    return <>{children}</>;
};

export default ContinuousAuthWrapper;
