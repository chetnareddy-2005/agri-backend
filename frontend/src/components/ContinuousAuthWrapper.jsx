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
    const [currentRisk, setCurrentRisk] = useState('LOW');

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
            let risk = "LOW";
            if (scaledMouse > 4000) risk = "HIGH";
            else if (scaledMouse > 200 || normalizedTyping > 200) risk = "MEDIUM";

            setCurrentRisk(risk);
            localStorage.setItem('auth_risk_level', risk);

            if (risk !== "LOW") {
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

            const authToken = localStorage.getItem('auth_token');

            // 5. REDUCED CALL FREQUENCY allows us to only fire critical telemetry
            fetch(`${import.meta.env.VITE_API_URL}/api/v1/telemetry/evaluate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Auth-Token": authToken || ""
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
            .then(async (res) => {
                if (res.status === 403 || res.status === 401) {
                    const data = await res.json();
                    if (data.otp) setReceivedOtp(data.otp);
                    throw new Error(data.challenge || data.error || "Security Violation");
                }
                
                // If it's a 500 or other error, trigger the LOCAL FALLBACK for the demo
                if (!res.ok) {
                    setReceivedOtp("888888"); // Demo fallback OTP
                    throw new Error("OTP_REQUIRED");
                }

                return res.json();
            })
            .then(data => {
                setAlertMessage(null);
            })
            .catch(err => {
                isTracking.current = false; 
                
                // If the error is high-risk, log out
                if (err.message === "Too many attempts" || err.message === "Session terminated due to high risk behavior.") {
                    localStorage.removeItem('user');
                    localStorage.removeItem('auth_risk_level');
                    window.location.hash = "#/"; 
                    return;
                }

                // Any other error (including our 500 fallback) triggers the OTP screen
                setAlertMessage("OTP_REQUIRED");
                if (!receivedOtp) setReceivedOtp("888888"); 
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
    const [receivedOtp, setReceivedOtp] = useState(null);
    const [geminiInsight, setGeminiInsight] = useState(null);

    const handleVerifyOtp = async () => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            alert("No active session found. Please log in again.");
            window.location.hash = "#/login"; // Use hash for consistency
            return;
        }

        const user = JSON.parse(userString);
        const authToken = localStorage.getItem('auth_token');
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/telemetry/verify-otp`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-Auth-Token": authToken || ""
                },
                credentials: 'include',
                body: JSON.stringify({ userId: user.email, otp: otpInput.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('auth_risk_level', 'LOW');
                setCurrentRisk('LOW');
                setGeminiInsight(data.geminiExplanation || "Verification and activity patterns analysis successful. Session restored.");
                setAlertMessage(null); 
                setReceivedOtp(null); 
                isTracking.current = true; 
            } else {
                const data = await res.json().catch(() => ({ error: "The entered OTP is incorrect or has expired. Please try the code shown on your screen." }));
                alert(data.error || "Verification failed.");
            }
        } catch (e) {
            console.error("Verification Failed:", e);
            alert("Security System Error: Unable to verify against the secure server. Please try again.");
        }
    };

    if (geminiInsight) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.95)', color: 'white', zIndex: 999999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px'
            }}>
                <div style={{ 
                    backgroundColor: '#111827', padding: '3rem', borderRadius: '32px', maxWidth: '600px', 
                    width: '100%', border: '2px solid #10b981', textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)'
                }}>
                    <div style={{ backgroundColor: '#10b981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <span style={{ fontSize: '3rem' }}>✓</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#10b981' }}>Identity Verified</h1>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', textAlign: 'left' }}>
                        <h3 style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>🤖 Gemini AI Security Insight</h3>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#e5e7eb' }}>{geminiInsight}</p>
                    </div>
                    <button onClick={() => window.location.reload()} style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: '700', backgroundColor: '#10b981', color: '#064e3b', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (alertMessage) {
        const isOtp = alertMessage === "OTP_REQUIRED";
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: '#d32f2f', color: 'white', zIndex: 999999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Inter", sans-serif'
            }}>
                <div style={{ 
                    fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: '900', marginBottom: '2.5rem', 
                    display: 'flex', alignItems: 'center', gap: '20px', textTransform: 'uppercase',
                    letterSpacing: '-2px', textShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                    🚨 ACCESS DENIED
                </div>

                <div style={{
                    backgroundColor: 'rgba(40, 0, 0, 0.95)', padding: '3.5rem 3rem', borderRadius: '32px', 
                    width: '90%', maxWidth: '440px', textAlign: 'center', 
                    boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.75rem', color: '#ffcdd2' }}>
                        {isOtp ? "Suspicious Behavior Detected" : "Security Lockout"}
                    </h2>
                    <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '2rem', lineHeight: '1.6', color: '#ffab91' }}>
                        {isOtp ? "A Step-Up Authentication OTP has been sent to your registered email." : alertMessage}
                    </p>

                    {isOtp && (
                        <>
                            {receivedOtp && (
                                <div style={{ 
                                    backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px', 
                                    borderRadius: '10px', fontSize: '0.75rem', color: '#ff8a80',
                                    marginBottom: '1.5rem', border: '1px dashed rgba(255,255,255,0.2)'
                                }}>
                                    DEMO MODE: Valid Code is <strong>{receivedOtp}</strong>
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                                    marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem',
                                    fontWeight: '700', color: '#1a1a1a', letterSpacing: '6px',
                                    backgroundColor: 'white', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />

                            <button
                                onClick={handleVerifyOtp}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
                                    backgroundColor: '#4caf50', color: 'white', fontWeight: '900',
                                    fontSize: '1.2rem', cursor: 'pointer', transition: 'transform 0.1s, background 0.2s',
                                    boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)', textTransform: 'uppercase'
                                }}
                                onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Verify OTP
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.hash = "#/";
                        window.location.reload();
                    }}
                    style={{
                        marginTop: '3.5rem', padding: '12px 32px', borderRadius: '100px',
                        border: '1.5px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent',
                        color: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    Discard Session
                </button>
            </div>
        );
    }

    return <>{children}</>;
};

export default ContinuousAuthWrapper;
