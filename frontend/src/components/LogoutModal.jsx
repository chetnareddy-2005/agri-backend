import React from 'react';
import { LogOut } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '16px',
                width: '400px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#FEE2E2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                    color: '#EF4444'
                }}>
                    <LogOut size={32} />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Confirm Logout</h3>
                <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem' }}>Are you sure you want to log out of your account?</p>

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB',
                            backgroundColor: 'white', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none',
                            backgroundColor: '#EF4444', color: 'white', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
