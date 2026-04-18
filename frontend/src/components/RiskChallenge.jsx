import React, { useState, useEffect, useRef } from 'react';

/**
 * RiskChallenge Component (Tuned Version)
 * Implements "Consistent Bad Behavior" requirement to reduce false alerts.
 */
const RiskChallenge = ({ userId }) => {
    const [challenge, setChallenge] = useState(null); 
    const [otp, setOtp] = useState('');
    const anomalyCount = useRef(0); // Persistent count between renders

    useEffect(() => {
        const checkRisk = async () => {
            try {
                const response = await fetch('http://localhost:5005/api/risk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, behavior: {} })
                });
                const data = await response.json();
                
                // 3. RELAX THRESHOLDS & 4. REQUIRE CONSISTENT BAD BEHAVIOR
                if (data.risk_level === 'MEDIUM' || data.risk_level === 'HIGH') {
                    anomalyCount.current += 1;
                } else {
                    anomalyCount.current = 0; // Reset if behavior normalizes
                }

                // Only show challenge after 3 consecutive anomalous signals
                if (anomalyCount.current >= 3) {
                    if (data.action === 'OTP' && !challenge) {
                        setChallenge('OTP');
                    } else if (data.action === 'BLOCK') {
                        setChallenge('BLOCK');
                    }
                }
            } catch (err) {
                console.error("Risk check failed", err);
            }
        };

        const interval = setInterval(checkRisk, 15000); // 15s interval for risk checks
        return () => clearInterval(interval);
    }, [userId, challenge]);

    if (challenge === 'BLOCK') {
        return (
            <div className="risk-overlay block" style={overlayStyle}>
                <h2>Session Blocked</h2>
                <p>Consistent anomalous activity detected. Contact Support.</p>
                <button onClick={() => window.location.href = '/login'}>Back to Login</button>
            </div>
        );
    }

    if (challenge === 'OTP') {
        return (
            <div className="risk-overlay otp" style={overlayStyle}>
                <h2>Security Verification</h2>
                <p>Verification required due to unusual behavioral patterns.</p>
                <input 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="Enter 6-digit OTP"
                    style={{ padding: '10px', margin: '10px 0' }}
                />
                <button onClick={() => setChallenge(null)}>Verify Identity</button>
            </div>
        );
    }

    return null;
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    textAlign: 'center',
    padding: '20px'
};

export default RiskChallenge;
