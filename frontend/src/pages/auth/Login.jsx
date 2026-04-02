import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/global.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();

                // Check if password reset is required (First login)
                if (data.mustChangePassword) {
                    navigate('/set-password', { state: { email: formData.email } });
                    return;
                }

                // Store user info in localStorage for simple session management
                localStorage.setItem('user', JSON.stringify(data));

                // Redirect based on role
                if (data.role === 'ROLE_FARMER') {
                    navigate('/farmer/dashboard');
                } else if (data.role === 'ROLE_RETAILER') {
                    navigate('/retailer/dashboard');
                } else if (data.role === 'ROLE_TRANSPORTER') {
                    navigate('/transporter/dashboard');
                } else if (data.role === 'ROLE_ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                const data = await response.text();
                setError(data || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Network error. Please try again later.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    // CSS for animations
    const styles = `
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
        .login-container {
            background: linear-gradient(-45deg, #16a34a, #ca8a04, #15803d, #eab308);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            position: relative;
            overflow: hidden;
        }
        .floating-emoji {
            position: absolute;
            font-size: 3rem;
            animation: float 6s ease-in-out infinite;
            opacity: 0.6;
            z-index: 0;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            z-index: 10;
        }
    `;

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
            <style>{styles}</style>

            {/* Floating Emojis */}
            <div className="floating-emoji" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>🌾</div>
            <div className="floating-emoji" style={{ top: '20%', right: '15%', animationDelay: '2s' }}>🚜</div>
            <div className="floating-emoji" style={{ bottom: '15%', left: '20%', animationDelay: '4s' }}>🌽</div>
            <div className="floating-emoji" style={{ bottom: '10%', right: '10%', animationDelay: '1s' }}>🍎</div>
            <div className="floating-emoji" style={{ top: '50%', left: '5%', animationDelay: '3s' }}>🥦</div>
            <div className="floating-emoji" style={{ top: '15%', left: '50%', animationDelay: '5s' }}>🥕</div>

            <div className="glass-card card" style={{ width: '400px', textAlign: 'center', borderRadius: '16px', padding: '2.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👨‍🌾</div>
                    <h2 style={{ color: '#166534', fontWeight: 'bold' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Log in to Farm2Trade</p>
                </div>

                {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #fca5a5' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                    />
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                paddingRight: '2.5rem',
                                boxSizing: 'border-box',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                            }}
                        >
                            {showPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '1rem',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ color: '#4b5563' }}>Don't have an account? <Link to="/register" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>Register</Link></p>
                    <p style={{ marginTop: '0.5rem' }}><Link to="/" style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textDecoration: 'none' }}>← Back to Home</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
