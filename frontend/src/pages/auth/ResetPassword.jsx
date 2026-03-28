import React, { useState } from 'react';
import '../../styles/global.css';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            // Mock API call (In real app, use fetch/axios)
            // await axios.post('http://localhost:8080/api/auth/reset-password', formData);

            console.log("Sending reset password request:", formData);

            // Simulating API success
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);

        } catch (error) {
            setMessage('Failed to reset password. Please try again.');
        }
    };

    return (
        <div className="landing-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card" style={{ width: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>Set a secure password</h2>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>Welcome! For your safety, set a new password now.</p>

                {message && <p style={{ color: message.includes('success') ? 'green' : 'red', marginBottom: '1rem' }}>{message}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Confirm your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.8rem', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="password"
                        name="newPassword"
                        placeholder="New Password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.8rem', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.8rem', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" className="btn btn-primary">Set Password</button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
