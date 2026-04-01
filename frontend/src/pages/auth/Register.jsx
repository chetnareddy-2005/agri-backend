import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/global.css';
import farmerBg from '../../assets/farmer_bg.png';
import retailerBg from '../../assets/retailer_bg.png';


const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [role, setRole] = useState('ROLE_FARMER');
    const [step, setStep] = useState(1); // Added pagination state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        businessName: '',
        address: '',
        description: '',
    });

    useEffect(() => {
        const originalBodyBg = document.body.style.backgroundColor;
        const originalHtmlBg = document.documentElement.style.backgroundColor;
        document.body.style.backgroundColor = 'transparent';
        document.documentElement.style.backgroundColor = 'transparent';

        return () => {
            document.body.style.backgroundColor = originalBodyBg;
            document.documentElement.style.backgroundColor = originalHtmlBg;
        };
    }, []);

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam) {
            const lowerRole = roleParam.toLowerCase();
            if (lowerRole === 'retailer') setRole('ROLE_RETAILER');
            else if (lowerRole === 'transporter') setRole('ROLE_TRANSPORTER');
            else setRole('ROLE_FARMER');
        }
    }, [searchParams]);

    const handleTabChange = (newRole) => {
        setRole(newRole);
        setError('');
        setSuccess('');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleNext = () => {
        // Basic validation for Step 1
        if (!formData.fullName || !formData.email || !formData.mobileNumber || !formData.businessName || !formData.address) {
            setError('Please fill in all required fields.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleBack = () => {
        setError('');
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fileName) {
            setError('Please upload a document to continue.');
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        const formDataToSend = new FormData();
        const userPayload = {
            ...formData,
            role: role,
        };

        formDataToSend.append("user", JSON.stringify(userPayload));
        if (fileInputRef.current.files[0]) {
            formDataToSend.append("file", fileInputRef.current.files[0]);
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                body: formDataToSend,
            });

            if (response.ok) {
                setSuccess('Registration successful! Please wait for admin approval.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                const data = await response.text();
                setError(data || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please try again later.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    const isFarmer = role === 'ROLE_FARMER';
    const isTransporter = role === 'ROLE_TRANSPORTER';

    return (
        <div style={{
            minHeight: '100vh',
            padding: '2rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Image with Blur */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${isTransporter ? retailerBg : isFarmer ? farmerBg : retailerBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(5px)',
                zIndex: -1,
                transition: 'background-image 0.8s ease'
            }} />
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    zIndex: 10
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Header Icon */}
            <div style={{
                width: '80px', height: '80px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 1
            }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                </svg>
            </div>

            <h2 style={{ fontSize: '2.8rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>Create Account</h2>
            <p style={{ color: 'white', marginBottom: '2.5rem', fontWeight: '500', opacity: 0.95, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {step === 1 ? 'Step 1: Account Details' : 'Step 2: Document Upload'}
            </p>

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(15px)',
                padding: '3rem',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                width: '90%',
                maxWidth: '700px',
                border: '1px solid rgba(255,255,255,0.4)',
                zIndex: 1
            }}>

                {/* Tabs - Only visible in Step 1 */}
                {step === 1 && (
                    <div style={{ display: 'flex', backgroundColor: '#F1F8E9', borderRadius: '8px', padding: '4px', marginBottom: '2rem', gap: '4px' }}>
                        <button
                            type="button"
                            onClick={() => handleTabChange('ROLE_FARMER')}
                            style={{
                                flex: 1, padding: '0.8rem 0.2rem', borderRadius: '6px', border: 'none',
                                backgroundColor: isFarmer ? '#4CAF50' : 'transparent',
                                color: isFarmer ? 'white' : '#718096', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Farmer
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('ROLE_RETAILER')}
                            style={{
                                flex: 1, padding: '0.8rem 0.2rem', borderRadius: '6px', border: 'none',
                                backgroundColor: role === 'ROLE_RETAILER' ? '#4CAF50' : 'transparent',
                                color: role === 'ROLE_RETAILER' ? 'white' : '#718096', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Retailer
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('ROLE_TRANSPORTER')}
                            style={{
                                flex: 1, padding: '0.8rem 0.2rem', borderRadius: '6px', border: 'none',
                                backgroundColor: isTransporter ? '#4CAF50' : 'transparent',
                                color: isTransporter ? 'white' : '#718096', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Transporter
                        </button>
                    </div>
                )}

                {error && <div style={{ color: '#D32F2F', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#FFEBEE', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
                {success && <div style={{ color: '#2E7D32', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#E8F5E9', borderRadius: '8px', fontSize: '0.9rem' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {step === 1 && (
                        <>
                            {/* Row 1 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4A5568', fontWeight: '500', fontSize: '0.9rem' }}>
                                        👤 Full Name *
                                    </label>
                                    <input
                                        type="text" name="fullName" placeholder="Enter your full name"
                                        value={formData.fullName} onChange={handleChange} required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4A5568', fontWeight: '500', fontSize: '0.9rem' }}>
                                        ✉️ Email *
                                    </label>
                                    <input
                                        type="email" name="email" placeholder="your.email@example.com"
                                        value={formData.email} onChange={handleChange} required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4A5568', fontWeight: '500', fontSize: '0.9rem' }}>
                                        📞 Phone Number *
                                    </label>
                                    <input
                                        type="tel" name="mobileNumber" placeholder="+91 98765 43210"
                                        value={formData.mobileNumber} onChange={handleChange} required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4A5568', fontWeight: '500', fontSize: '0.9rem' }}>
                                        {isFarmer ? '📄 Farm Name' : isTransporter ? '🚚 Vehicle Type (e.g., Truck, Auto)' : '🏪 Business Name'} *
                                    </label>
                                    <input
                                        type="text" name="businessName" placeholder={isFarmer ? "Your farm name" : isTransporter ? "Enter vehicle type" : "Your store name"}
                                        value={formData.businessName} onChange={handleChange} required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4A5568', fontWeight: '500', fontSize: '0.9rem' }}>
                                    📍 {isFarmer ? 'Farm Address' : isTransporter ? 'Base Location Address' : 'Business Address'} *
                                </label>
                                <input
                                    type="text" name="address" placeholder="Enter your complete address"
                                    value={formData.address} onChange={handleChange} required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4A5568', fontWeight: '500', fontSize: '0.9rem' }}>
                                    {isFarmer ? 'Farm Description (Optional)' : isTransporter ? 'Vehicle Capacity & Details' : 'Business Description (Optional)'}
                                </label>
                                <textarea
                                    name="description" placeholder={isFarmer ? "Tell us about your farm" : isTransporter ? "e.g. 5 Ton Capacity, License Plate" : "Tell us about your business"}
                                    value={formData.description} onChange={handleChange} rows="3"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0', resize: 'vertical' }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleNext}
                                style={{
                                    backgroundColor: '#4CAF50', color: 'white', padding: '1rem', borderRadius: '8px', border: 'none',
                                    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '1rem'
                                }}
                            >
                                Next Step →
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Upload Document */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '1.5rem', color: '#4A5568', fontWeight: '600', fontSize: '1.1rem', textAlign: 'center' }}>
                                    Upload Document ({isFarmer ? 'ID Proof/Farm Cert.' : isTransporter ? 'Driving License/ID' : 'ID Proof/Biz License'}) *
                                </label>
                                <div
                                    style={{
                                        border: '2px dashed #4CAF50', borderRadius: '16px', padding: '3rem', textAlign: 'center',
                                        cursor: 'pointer', backgroundColor: '#F9FFF9', transition: 'all 0.3s'
                                    }}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <input
                                        type="file" ref={fileInputRef} style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
                                    {fileName ? (
                                        <div style={{ padding: '10px', backgroundColor: '#E8F5E9', borderRadius: '8px', display: 'inline-block' }}>
                                            <p style={{ color: '#2E7D32', fontWeight: '600', margin: 0 }}>✅ {fileName}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ color: '#4A5568', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Click to upload or drag and drop</p>
                                            <p style={{ color: '#718096', fontSize: '0.9rem' }}>PDF, PNG, JPG (max 5MB)</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    style={{
                                        flex: 1, backgroundColor: '#EDF2F7', color: '#4A5568', padding: '1rem', borderRadius: '8px', border: 'none',
                                        fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2, backgroundColor: '#4CAF50', color: 'white', padding: '1rem', borderRadius: '8px', border: 'none',
                                        fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? 'Submitting...' : 'Complete Registration'}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#718096', fontSize: '0.95rem' }}>
                    Already have an account? <Link to="/login" style={{ color: '#4CAF50', textDecoration: 'none', fontWeight: '600' }}>Login here</Link>
                </div>

                {/* Progress Indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '2rem' }}>
                    <div style={{ width: '40px', height: '4px', backgroundColor: '#4CAF50', borderRadius: '2px' }} />
                    <div style={{ width: '40px', height: '4px', backgroundColor: step === 2 ? '#4CAF50' : '#E2E8F0', borderRadius: '2px' }} />
                </div>
            </div>
        </div>
    );
};

export default Register;
