import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ShieldAlert, Zap } from 'lucide-react';

const AlertBanner = ({ location }) => {
    const [crises, setCrises] = useState([]);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!location) return;
        
        const fetchCrises = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/crisis?location=${encodeURIComponent(location)}`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setCrises(data);
                    if (data.length > 0) setVisible(true);
                }
            } catch (err) {
                console.error("Crisis fetch error:", err);
            }
        };

        fetchCrises();
        const interval = setInterval(fetchCrises, 60000); // 1 min refresh
        return () => clearInterval(interval);
    }, [location]);

    if (!visible || crises.length === 0) return null;

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '0.75rem 2rem',
            backgroundColor: crises[0].severity === 'HIGH' ? '#FEF2F2' : '#FFFBEB',
            borderBottom: `1px solid ${crises[0].severity === 'HIGH' ? '#FECACA' : '#FEF3C7'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'slideDown 0.4s ease-out'
        }}>
            <style>
                {`
                    @keyframes slideDown {
                        from { transform: translateY(-100%); }
                        to { transform: translateY(0); }
                    }
                `}
            </style>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    padding: '8px',
                    backgroundColor: crises[0].severity === 'HIGH' ? '#EF4444' : '#F59E0B',
                    borderRadius: '50%',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    {crises[0].type === 'WEATHER' ? <AlertCircle size={18} /> : <ShieldAlert size={18} />}
                </div>
                
                <div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        color: crises[0].severity === 'HIGH' ? '#991B1B' : '#92400E',
                        fontWeight: '700',
                        fontSize: '0.9rem'
                    }}>
                        {crises[0].type} ALERT: {crises[0].location}
                        <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '2px 8px', 
                            borderRadius: '9999px',
                            backgroundColor: crises[0].severity === 'HIGH' ? '#FEE2E2' : '#FEF3C7',
                            border: `1px solid ${crises[0].severity === 'HIGH' ? '#FCA5A5' : '#FCD34D'}`
                        }}>
                            {crises[0].severity} RISK
                        </span>
                    </div>
                    <p style={{ 
                        margin: 0, 
                        fontSize: '0.85rem', 
                        color: crises[0].severity === 'HIGH' ? '#B91C1C' : '#D97706'
                    }}>
                        {crises[0].message} • AI suggests potential delays or rerouting.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button 
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Zap size={14} /> View Reroutes
                </button>
                <button 
                    onClick={() => setVisible(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default AlertBanner;
