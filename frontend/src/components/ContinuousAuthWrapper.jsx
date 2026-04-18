import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ContinuousAuthWrapper = ({ children, user }) => {
    const navigate = useNavigate();
    const [otpInput, setOtpInput] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [receivedOtp, setReceivedOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [status, setStatus] = useState('');
    const [geminiInsight, setGeminiInsight] = useState('');

    // Auto-detect user if not passed as prop (Crucial for routing consistency)
    const [activeUser, setActiveUser] = useState(user || null);

    useEffect(() => {
        if (!activeUser) {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    setActiveUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Auth sync error", e);
                }
            }
        }
    }, [user, activeUser]);

    const handleDiscardSession = () => {
        console.warn("[Security] Session discarded. Clearing storage and redirecting.");
        localStorage.clear();
        navigate('/');
    };

    const fetchWithAuth = async (url, options = {}) => {
        const token = localStorage.getItem('auth_token');
        const headers = {
            ...options.headers,
            'X-Auth-Token': token || ''
        };
        return fetch(url, { ...options, headers, credentials: 'include' });
    };

    // Telemetry polling
    useEffect(() => {
        if (!activeUser) return;

        const interval = setInterval(async () => {
            try {
                // Mock telemetry for demo
                const telemetry = {
                    typingSpeedWpm: Math.random() * 50,
                    mouseMovementAvgSpeed: localStorage.getItem('force_anomaly') ? 5000 : 50,
                    scrollFrequency: 5
                };

                const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/v1/telemetry/evaluate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: activeUser.email,
                        telemetry
                    })
                });

                if (res.status === 403) {
                    const data = await res.json();
                    setAlertMessage(data.challenge);
                    if (data.otp) setReceivedOtp(data.otp);
                    localStorage.setItem('auth_risk_level', 'MEDIUM'); // Sync for gauge
                } else if (res.status === 401) {
                    console.error("[Security] Telemetry evaluation returned 401 UNAUTHORIZED. Forcing logout.");
                    handleDiscardSession();
                } else if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('auth_risk_level', data.risk || 'LOW'); // Sync for gauge
                }
            } catch (err) {
                console.error("Telemetry error:", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [activeUser]);

    const handleVerifyOtp = async () => {
        setVerifying(true);
        setStatus('');
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/v1/telemetry/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: activeUser.email,
                    otp: otpInput
                })
            });

            if (res.ok) {
                const data = await res.json();
                setGeminiInsight(data.geminiExplanation);
                setAlertMessage('');
            } else {
                const err = await res.json();
                setStatus(err.error || "Invalid Security Code");
            }
        } catch (err) {
            setStatus("Verification system unreachable.");
        } finally {
            setVerifying(false);
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

    if (alertMessage === "OTP_REQUIRED") {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: '#d32f2f', zIndex: 999999, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Inter", sans-serif'
            }}>
                <div style={{ 
                    fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: '900', marginBottom: '2.5rem', 
                    display: 'flex', alignItems: 'center', gap: '20px', color: 'white',
                    textTransform: 'uppercase', letterSpacing: '-2px'
                }}>
                    🚨 ACCESS DENIED
                </div>

                <div style={{
                    backgroundColor: 'rgba(30, 5, 5, 0.98)', 
                    padding: '3rem', borderRadius: '24px', 
                    width: '95%', maxWidth: '440px', textAlign: 'center', 
                    boxShadow: '0 40px 80px rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>
                        Suspicious Behavior Detected
                    </h2>
                    <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '2.5rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
                        A Step-Up Authentication OTP has been sent to your registered email.
                    </p>

                    {receivedOtp && (
                        <div style={{ 
                            backgroundColor: 'rgba(220, 38, 38, 0.2)', padding: '12px', 
                            borderRadius: '12px', fontSize: '0.85rem', color: '#fca5a5',
                            marginBottom: '2rem', border: '1px dashed rgba(255,255,255,0.3)'
                        }}>
                            🔒 DEMO MODE: Security Code is <strong>{receivedOtp}</strong>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            style={{
                                padding: '1rem', borderRadius: '14px', border: 'none',
                                textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold',
                                backgroundColor: 'white', color: '#1a1a1a', outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleVerifyOtp}
                            disabled={verifying}
                            style={{
                                padding: '1rem', borderRadius: '14px', border: 'none',
                                backgroundColor: '#2ecc71', color: 'white',
                                fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(46, 204, 113, 0.3)'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            {verifying ? "Configuring..." : "Verify OTP"}
                        </button>
                    </div>

                    {status && (
                        <p style={{ marginTop: '1.5rem', color: status.includes('Invalid') ? '#ff5252' : '#2ecc71', fontWeight: 'bold' }}>
                            {status}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleDiscardSession}
                    style={{
                        marginTop: '3.5rem', padding: '0.75rem 2.5rem', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent',
                        color: 'white', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = '#d32f2f'; }}
                    onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'white'; }}
                >
                    Discard Session
                </button>
            </div>
        );
    }

    return children;
};

export default ContinuousAuthWrapper;
