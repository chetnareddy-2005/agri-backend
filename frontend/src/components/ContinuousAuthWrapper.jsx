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

        const sessionStartTime = Date.now();
        const mouseValues = [];
        let anomalyCount = 0;

        // Evaluate Telemetry every 10 seconds
        const evaluationInterval = setInterval(() => {
            if (!isTracking.current) return;

            // 1. ADD CALMING PERIOD (Ignore first 8 seconds)
            if (Date.now() - sessionStartTime < 8000) {
                return;
            }

            const now = Date.now();
            const timeElapsedMinutes = (now - metricsRef.current.startTime) / 60000 || 0.01;

            // Calculate Metrics
            const currentMouseSpeed = metricsRef.current.mouseDistance / timeElapsedMinutes; 
            const scrollFrequency = metricsRef.current.scrolls;

            // 2. SMOOTH THE VALUES
            mouseValues.push(currentMouseSpeed);
            if (mouseValues.length > 5) {
                mouseValues.shift();
            }
            const avgMouse = mouseValues.reduce((a, b) => a + b, 0) / mouseValues.length;

            // 3. MORE SENSITIVE THRESHOLDS (Easier to trigger for demo)
            let scaledMouse;
            if (avgMouse < 50000) {
                scaledMouse = 100; // normal
            } else if (avgMouse < 120000) {
                scaledMouse = 350; // medium (Now triggers anomaly)
            } else {
                scaledMouse = 5100; // high
            }

            const normalizedTyping = (metricsRef.current.keyPresses > 25) ? 450 : 60;
            const normalizedScroll = (scrollFrequency > 10) ? 150 : 3;

            // 4. REQUIRE CONSISTENT BEHAVIOR (Now triggers for 350 as well)
            if (scaledMouse > 200 || normalizedTyping > 200) {
                anomalyCount++;
            } else {
                anomalyCount = 0;
            }

            console.log("Avg Mouse:", avgMouse.toFixed(0), "-> ML Scaled:", scaledMouse, "| Anomaly Count:", anomalyCount);

            // Reset metrics for the next interval
            metricsRef.current = {
                keyPresses: 0, mouseDistance: 0, scrolls: 0,
                startTime: Date.now(), lastMousePos: metricsRef.current.lastMousePos
            };

            // Wait for 2 bad signals (20 seconds) instead of 3 before bothering the backend
            if (anomalyCount < 2) {
                return; 
            }

            // Get local user info
            const userString = localStorage.getItem('user');
            if (!userString) return; // Completely skip if not logged in!
            
            const user = JSON.parse(userString);

            // 5. REDUCED CALL FREQUENCY allows us to only fire critical telemetry
            fetch("http://localhost:8080/api/v1/telemetry/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId: user.email,
                    telemetry: {
                        typingSpeedWpm: normalizedTyping,
                        mouseMovementAvgSpeed: scaledMouse,
                        scrollFrequency: normalizedScroll
                    }
                })
            })
            .then(res => {
                if (res.status === 403 || res.status === 401) {
                    return res.json().then(data => {
                        throw new Error(data.challenge || data.error || "Security Violation");
                    });
                }
                return res.json();
            })
            .then(data => {
                setAlertMessage(null);
            })
            .catch(err => {
                isTracking.current = false; 
                setAlertMessage(err.message);
            });

        }, 10000); // Changed to 10 seconds

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            clearInterval(evaluationInterval);
        };
    }, []);

    const [otpInput, setOtpInput] = useState('');
    const [geminiInsight, setGeminiInsight] = useState(null);

    const handleVerifyOtp = async () => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            alert("No active session found. Please log in again.");
            window.location.href = '/login';
            return;
        }
        const user = JSON.parse(userString);
        try {
            const res = await fetch("http://localhost:8080/api/v1/telemetry/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ userId: user.email, otp: otpInput.trim() })
            });
            const data = await res.json();
            
            if (res.ok && data.status === "VERIFIED") {
                setGeminiInsight(data.geminiExplanation);
            } else {
                alert(data.error || "Invalid OTP");
            }
        } catch (e) {
            alert("Verification Failed.");
        }
    };

    if (geminiInsight) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.95)', color: 'white', zIndex: 999999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2.5rem', color: '#4ade80', marginBottom: '20px' }}>✅ Security Verified</h1>
                <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '15px', maxWidth: '600px', lineHeight: '1.6' }}>
                    <h3 style={{ color: '#fbbf24', marginBottom: '15px' }}>🤖 Gemini AI Security Insight</h3>
                    <p style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>{geminiInsight}</p>
                </div>
                <button onClick={() => window.location.reload()} style={{ marginTop: '30px', padding: '12px 24px', fontSize: '1.2rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (alertMessage) {
        const isOtp = alertMessage === "OTP_REQUIRED";
        
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(220, 38, 38, 0.95)', color: 'white', zIndex: 999999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>🚨 ACCESS DENIED</h1>
                
                {isOtp ? (
                    <div style={{ marginTop: '20px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '30px', borderRadius: '15px' }}>
                        <h2 style={{ marginBottom: '15px' }}>Suspicious Behavior Detected</h2>
                        <p style={{ marginBottom: '20px' }}>A Step-Up Authentication OTP has been sent to your registered email.</p>
                        <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            style={{ padding: '12px', fontSize: '1.2rem', textAlign: 'center', borderRadius: '8px', border: 'none', marginBottom: '20px', width: '200px', color: 'black' }}
                        />
                        <br />
                        <button onClick={handleVerifyOtp} style={{ padding: '12px 30px', fontSize: '1.2rem', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Verify OTP
                        </button>
                    </div>
                ) : (
                    <p style={{ fontSize: '1.5rem', marginTop: '20px' }}>SECURITY LOCKOUT: {alertMessage}</p>
                )}

                <button 
                    onClick={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }} 
                    style={{ marginTop: '40px', padding: '10px 20px', fontSize: '1.1rem', backgroundColor: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', borderRadius: '5px' }}
                >
                    Discard Session
                </button>
            </div>
        );
    }

    return <>{children}</>;
};

export default ContinuousAuthWrapper;
