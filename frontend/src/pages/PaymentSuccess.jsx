import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import '../styles/global.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        // Determine where to redirect based on user role (assuming mostly retailer usage here)
        const timer = setTimeout(() => {
            // Pass order_id to verify/highlight the order on dashboard
            navigate(`/retailer/dashboard?tab=Orders&order_id=${orderId || ''}`);
        }, 5000); // 5 seconds animation time

        return () => clearTimeout(timer);
    }, [navigate, orderId]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
            textAlign: 'center', padding: '2rem'
        }}>

            {/* Handshake Image Container with Animation */}
            <div style={{
                position: 'relative',
                width: '300px',
                height: '300px',
                marginBottom: '2rem',
                animation: 'handshakeZoom 1s ease-out forwards'
            }}>
                {/* The Image */}
                <img
                    src={`${import.meta.env.BASE_URL}assets/payment_success_handshake.jpg`}
                    alt="Farmer and Retailer Handshake"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '8px solid #16a34a',
                        animation: 'gentleShake 2s ease-in-out infinite'
                    }}
                />

                {/* Success Icon Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    padding: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <CheckCircle size={40} color="#16a34a" strokeWidth={3} />
                </div>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: '#166534' }}>
                Payment Successful!
            </h1>

            <p style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)', maxWidth: '500px', marginBottom: '2rem' }}>
                The deal is sealed. Connecting you with the farmer alongside a digital handshake.
            </p>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.9rem', color: 'var(--text-tertiary)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
                <span>Redirecting you back to orders...</span>
            </div>

            <style>{`
        @keyframes gentleShake {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes handshakeZoom {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
        </div>
    );
};

export default PaymentSuccess;
