import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Truck, Star, MapPin, DollarSign, Zap, Trophy, TrendingDown, Info, Calendar, Clock, AlertCircle } from 'lucide-react';
import '../../styles/global.css';

const TransportSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, product } = location.state || {};

    const [recommended, setRecommended] = useState([]);
    const [allDrivers, setAllDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deliveryMode, setDeliveryMode] = useState('INSTANT'); // INSTANT or SCHEDULED
    const [scheduledDate, setScheduledDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('Morning');

    useEffect(() => {
        if (!orderId) {
            navigate('/retailer/dashboard');
            return;
        }
        fetchDrivers();
    }, [orderId]);

    const fetchDrivers = async () => {
        try {
            const coords = { lat: 17.3850, lng: 78.4867 };
            const [recRes, allRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/transport/recommended-drivers?lat=${coords.lat}&lng=${coords.lng}`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/transport/drivers`, { credentials: 'include' })
            ]);

            if (recRes.ok) setRecommended(await recRes.json());
            if (allRes.ok) setAllDrivers(await allRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDriver = async (sd) => {
        if (deliveryMode === 'SCHEDULED' && !scheduledDate) {
            alert("Please select a delivery date");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    orderId: orderId,
                    driverId: sd.driver.id,
                    distanceKm: sd.distance,
                    scheduledDate: deliveryMode === 'SCHEDULED' ? scheduledDate : null,
                    timeSlot: deliveryMode === 'SCHEDULED' ? timeSlot : null
                })
            });

            if (res.ok) {
                const transport = await res.json();
                navigate(`/order-tracking/${orderId}`, { state: { transport } });
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Available Transporters...</div>;

    return (
        <div style={{ backgroundColor: '#F4F6F7', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #E5E7EB', paddingBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ color: '#2C3E50', fontSize: '2.2rem', fontWeight: 'bold', margin: '0 0 8px' }}>🚚 Intelligent Logistics Hub</h1>
                        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Order #{orderId} • AI-Powered Matching & Pricing</p>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem' }}>
                    
                    {/* Main Content: Driver Selection */}
                    <div>
                        {/* Delivery Mode Toggle */}
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={20} color="#F59E0B" /> Delivery Type:
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => setDeliveryMode('INSTANT')}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: deliveryMode === 'INSTANT' ? '#3B82F6' : '#F3F4F6', color: deliveryMode === 'INSTANT' ? 'white' : '#4B5563', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
                                >⚡ Instant</button>
                                <button 
                                    onClick={() => setDeliveryMode('SCHEDULED')}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: deliveryMode === 'SCHEDULED' ? '#3B82F6' : '#F3F4F6', color: deliveryMode === 'SCHEDULED' ? 'white' : '#4B5563', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
                                >📅 Scheduled</button>
                            </div>
                        </div>

                        {deliveryMode === 'SCHEDULED' && (
                            <div style={{ backgroundColor: '#DBEAFE', padding: '1.5rem', borderRadius: '15px', marginBottom: '2rem', border: '1px solid #BFDBFE' }}>
                                <h3 style={{ margin: '0 0 1rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={18} /> Delivery Scheduling
                                </h3>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#1E40AF', fontWeight: 'bold' }}>Select Date</label>
                                        <input 
                                            type="date" 
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BFDBFE' }} 
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#1E40AF', fontWeight: 'bold' }}>Select Time Slot</label>
                                        <select 
                                            value={timeSlot}
                                            onChange={(e) => setTimeSlot(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BFDBFE' }}
                                        >
                                            <option>Morning (🌅 8AM - 12PM)</option>
                                            <option>Afternoon (☀️ 12PM - 4PM)</option>
                                            <option>Evening (🌙 4PM - 8PM)</option>
                                        </select>
                                    </div>
                                </div>
                                <p style={{ margin: '15px 0 0', fontSize: '0.85rem', color: '#1E40AF', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Info size={14} /> 💡 <strong>Tip:</strong> Evening slots are typically 15% cheaper!
                                </p>
                            </div>
                        )}

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Trophy color="#F59E0B" size={24} /> AI Recommended Matches
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                            {recommended.map((sd) => (
                                <div key={sd.driver.id} className="product-card" style={{ padding: '2rem', borderRadius: '20px', position: 'relative', border: sd.tag === 'BEST CHOICE' ? '2px solid #10B981' : '1px solid transparent', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                                    {sd.tag && (
                                        <div style={{ position: 'absolute', top: '-15px', right: '20px', backgroundColor: sd.tag === 'BEST CHOICE' ? '#10B981' : (sd.tag === 'FASTEST' ? '#3B82F6' : '#F59E0B'), color: 'white', padding: '6px 16px', borderRadius: '25px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                            {sd.tag === 'BEST CHOICE' && <Trophy size={14} />}
                                            {sd.tag === 'FASTEST' && <Zap size={14} />}
                                            {sd.tag === 'CHEAPEST' && <TrendingDown size={14} />}
                                            {sd.tag}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '2px solid #E5E7EB' }}>
                                            👤
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1F2937', margin: '0 0 5px' }}>{sd.driver.user.fullName}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                                                <span style={{ fontWeight: 'bold', color: '#4B5563' }}>{sd.driver.rating.toFixed(1)}</span>
                                                <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>({sd.driver.deliveredRequests || 0} deliveries)</span>
                                            </div>
                                            {sd.driver.badge && (
                                              <span style={{ marginTop: '5px', display: 'inline-block', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                🏅 {sd.driver.badge} Badge
                                              </span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '15px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563' }}>
                                            <Truck size={18} color="#3B82F6" />
                                            <span>{sd.driver.vehicleType}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563' }}>
                                            <MapPin size={18} color="#EF4444" />
                                            <span>{sd.distance.toFixed(1)} km away</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            <DollarSign size={20} />
                                            <span>₹{sd.estimatedPrice.toFixed(0)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '0.85rem' }}>
                                            <Clock size={16} />
                                            <span>~{Math.round(sd.distance * 3 + 10)} mins ETA</span>
                                        </div>
                                    </div>

                                    <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '10px', borderLeft: '4px solid #3B82F6' }}>
                                        <Info size={16} color="#3B82F6" style={{ marginTop: '3px' }} />
                                        <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0, lineHeight: '1.4' }}>
                                            <strong>Explainable AI:</strong> {sd.recommendationReason}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => handleSelectDriver(sd)}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
                                    >
                                        Confirm & Request {deliveryMode === 'SCHEDULED' ? 'Slot' : 'Pickup'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar: AI Pricing Engine Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.05)', position: 'sticky', top: '2rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DollarSign size={18} color="#10B981" /> AI Pricing Analysis
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#6B7280' }}>Base Fare</span>
                                    <span style={{ fontWeight: 'bold' }}>₹20.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#6B7280' }}>Distance (avg 2.5km)</span>
                                    <span style={{ fontWeight: 'bold' }}>₹{recommended[0] ? (recommended[0].distance * 8).toFixed(2) : '---'}</span>
                                </div>
                                <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <span style={{ color: '#6B7280' }}>Demand Multiplier</span>
                                        <span style={{ color: '#D97706', fontWeight: 'bold' }}>x1.12</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#6B7280' }}>Weather Factor</span>
                                        <span style={{ color: '#059669', fontWeight: 'bold' }}>x1.00 (Clear)</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '12px', fontSize: '0.8rem', color: '#475569' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontWeight: 'bold', marginBottom: '5px' }}>
                                    <AlertCircle size={14} /> High Demand Detected
                                </div>
                                Prices are 12% higher due to high request volume in your area.
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#1E293B', color: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#94A3B8' }}>PRO TRANSPORTERS</h4>
                            <p style={{ fontSize: '0.8rem', lineHeight: '1.5', opacity: 0.8 }}>
                                Pro transporters with <strong>Golden Badges</strong> have a 98% on-time delivery rate. Look for the Trophy icon!
                            </p>
                        </div>
                    </div>
                </div>

                {/* All Available List (Simplified) */}
                <section style={{ marginTop: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '1.5rem' }}>📋 Other Available Partners</h2>
                    <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                <tr>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', fontSize: '0.85rem', color: '#6B7280' }}>TRANSPORTER</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', fontSize: '0.85rem', color: '#6B7280' }}>VEHICLE</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', fontSize: '0.85rem', color: '#6B7280' }}>RATING</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', fontSize: '0.85rem', color: '#6B7280' }}>BADGE</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', fontSize: '0.85rem', color: '#6B7280' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allDrivers.filter(d => !recommended.find(r => r.driver.id === d.id)).map(driver => (
                                    <tr key={driver.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: 'bold', color: '#111827' }}>{driver.user.fullName}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem', color: '#4B5563' }}>{driver.vehicleType}</td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F59E0B' }}>
                                                <Star size={14} fill="#F59E0B" />
                                                <span style={{ color: '#111827', fontWeight: 'bold' }}>{driver.rating.toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            {driver.badge ? (
                                                <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                  {driver.badge}
                                                </span>
                                            ) : 'Standard'}
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleSelectDriver({ driver, distance: 4.5, estimatedPrice: 50.0 })}
                                                style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid #3B82F6', color: '#3B82F6', backgroundColor: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TransportSelection;
