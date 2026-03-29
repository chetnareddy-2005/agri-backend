import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/global.css';

const SetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (pass) => {
        if (pass.length < 8) return false;
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!validatePassword(password)) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-initial-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, newPassword: password }),
            });

            if (response.ok) {
                setSuccess("Password set successfully! Redirecting...");
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                const text = await response.text();
                setError(text || "Failed to set password.");
            }
        } catch (err) {
            setError("Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: '#F3F4F6',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: "'Inter', sans-serif",
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '480px',
                transition: 'all 0.3s ease',
                border: '1px solid #E5E7EB'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '1rem'
                    }}>
                        <img src={`${import.meta.env.BASE_URL}assets/farm_trade_leaf.png`} alt="Logo" style={{ width: '32px', height: '32px' }} />
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#166534',
                            margin: 0
                        }}>Farm2Trade</h1>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>Set your password</h2>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
                        Secure your account to continue
                    </p>
                    {email && <p style={{ color: '#166534', fontSize: '0.9rem', fontWeight: '500', marginTop: '0.25rem' }}>{email}</p>}
                </div>

                {error && <div style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #FECACA' }}>{error}</div>}
                {success && <div style={{ backgroundColor: '#F0FDF4', color: '#15803D', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #BBF7D0' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>New password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    paddingRight: '3rem',
                                    borderRadius: '12px',
                                    border: '1px solid #D1D5DB',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    backgroundColor: '#F9FAFB'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#166534'}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9CA3AF',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Confirm password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    paddingRight: '3rem',
                                    borderRadius: '12px',
                                    border: '1px solid #D1D5DB',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    backgroundColor: '#F9FAFB'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#166534'}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9CA3AF',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: '#166534',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(22, 101, 52, 0.2)',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? 'Setting Password...' : 'Set Password'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                        © 2025 Farm2Trade. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;
