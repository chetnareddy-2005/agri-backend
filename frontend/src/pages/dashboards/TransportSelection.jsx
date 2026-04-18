import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Truck, Star, MapPin, DollarSign, Zap, Trophy, TrendingDown, Info, Calendar, Clock, AlertCircle, ShieldCheck, Scale } from 'lucide-react';
import '../../styles/global.css';

const TransportSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, product } = location.state || {};

    const [aiAssignments, setAiAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deliveryMode, setDeliveryMode] = useState('INSTANT'); // INSTANT or SCHEDULED
    const [scheduledDate, setScheduledDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('Morning');
    const [weatherRisk, setWeatherRisk] = useState('SAFE');

    useEffect(() => {
        if (!orderId) {
            navigate('/retailer/dashboard');
            return;
        }
        fetchAiInsights();
    }, [orderId]);

    const fetchAiInsights = async () => {
        try {
            const destination = product?.location || "Hyderabad";
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/allocation-insights?destination=${encodeURIComponent(destination)}`, { 
                credentials: 'include' 
            });

            if (res.ok) {
                const data = await res.json();
                setAiAssignments(data);
                if (data.length > 0) setWeatherRisk(data[0].risk);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDriver = async (assignment) => {
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
                    driverId: assignment.driverId,
                    distanceKm: 2.5, // Mock distance for now or from assignment
                    scheduledDate: deliveryMode === 'SCHEDULED' ? scheduledDate : null,
                    timeSlot: deliveryMode === 'SCHEDULED' ? timeSlot : null
                })
            });

            if (res.ok) {
                // Redirect to Dashboard's new Logistics section instead of a separate page
                navigate(`/retailer-dashboard?tab=Logistics&orderId=${orderId}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', backgroundColor: '#F8FAFC' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%' }}></div>
            <p style={{ fontWeight: '600', color: '#64748B' }}>AI Scoring Module: Calculating Fairness & Efficiency...</p>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ color: '#0F172A', fontSize: '2rem', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-0.025em' }}>
                            Smart Allocation Engine <span style={{ color: '#3B82F6' }}>AI</span>
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '1rem' }}>Order #{orderId} • Balancing fairness with marketplace efficiency</p>
                    </div>
                    {weatherRisk !== 'SAFE' && (
                        <div style={{ 
                            backgroundColor: weatherRisk === 'HIGH RISK' ? '#FEF2F2' : '#FFFBEB',
                            border: `1px solid ${weatherRisk === 'HIGH RISK' ? '#FCA5A5' : '#FDE68A'}`,
                            padding: '10px 20px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: weatherRisk === 'HIGH RISK' ? '#991B1B' : '#92400E'
                        }}>
                            <AlertCircle size={20} />
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                                CRITICAL: {weatherRisk} ZONE
                                <div style={{ fontWeight: '400', fontSize: '0.75rem', opacity: 0.8 }}>Restricting unsafe vehicle types.</div>
                            </div>
                        </div>
                    )}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    
                    {/* Main Content */}
                    <div>
                        {/* Delivery Control */}
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    onClick={() => setDeliveryMode('INSTANT')}
                                    style={{ 
                                        padding: '10px 24px', borderRadius: '12px', border: '1px solid #E2E8F0',
                                        backgroundColor: deliveryMode === 'INSTANT' ? '#0F172A' : 'white',
                                        color: deliveryMode === 'INSTANT' ? 'white' : '#64748B',
                                        fontWeight: '600', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >⚡ Instant Delivery</button>
                                <button 
                                    onClick={() => setDeliveryMode('SCHEDULED')}
                                    style={{ 
                                        padding: '10px 24px', borderRadius: '12px', border: '1px solid #E2E8F0',
                                        backgroundColor: deliveryMode === 'SCHEDULED' ? '#0F172A' : 'white',
                                        color: deliveryMode === 'SCHEDULED' ? 'white' : '#64748B',
                                        fontWeight: '600', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >📅 Future Slot</button>
                            </div>
                            
                            {deliveryMode === 'SCHEDULED' && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input 
                                        type="date" 
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} 
                                    />
                                    <select 
                                        value={timeSlot}
                                        onChange={(e) => setTimeSlot(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                                    >
                                        <option>Morning (🌅 8AM - 12PM)</option>
                                        <option>Afternoon (☀️ 12PM - 4PM)</option>
                                        <option>Evening (🌙 4PM - 8PM)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Assignments List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {aiAssignments.length > 0 ? (
                                aiAssignments.map((assignment, idx) => (
                                    <div key={assignment.driverId} style={{ 
                                        backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', display: 'flex', gap: '2rem',
                                        border: idx === 0 ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                                        transition: '0.2s', position: 'relative', overflow: 'hidden'
                                    }}>
                                        {idx === 0 && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#3B82F6', color: 'white', padding: '4px 16px', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0 0 0 12px' }}>
                                                AI TOP RECOMMENDATION
                                            </div>
                                        )}

                                        {/* Driver Avatar & Score */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '120px' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: '3px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                                👤
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: assignment.score > 70 ? '#10B981' : '#3B82F6' }}>{assignment.score}%</div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748B', letterSpacing: '0.05em' }}>ALLOCATION SCORE</div>
                                            </div>
                                        </div>

                                        {/* Driver Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>{assignment.driverName}</h3>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Truck size={14} /> {assignment.vehicle}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: assignment.risk === 'SAFE' ? '#10B981' : '#F59E0B' }}>
                                                        <ShieldCheck size={14} /> {assignment.risk} Status
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                                                        {assignment.badge}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>Efficiency Analysis</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px' }}>
                                                            <div style={{ width: `${assignment.efficiency}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '3px' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{assignment.efficiency}%</span>
                                                    </div>
                                                </div>
                                                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>Fairness Bias Check</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px' }}>
                                                            <div style={{ width: `${assignment.fairness}%`, height: '100%', backgroundColor: '#8B5CF6', borderRadius: '3px' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{assignment.fairness}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ backgroundColor: '#FFFBEB', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #D97706', display: 'flex', gap: '10px' }}>
                                                <Scale size={16} color="#D97706" style={{ marginTop: '2px' }} />
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400E', lineHeight: '1.4' }}>
                                                    <strong>Marketplace Fairness:</strong> {assignment.explanation}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div style={{ width: '180px', borderLeft: '1px solid #E2E8F0', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>₹{(25 + (6 * 1.5)).toFixed(0)}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>ESTIMATED FARE</div>
                                            </div>
                                            <button 
                                                onClick={() => handleSelectDriver(assignment)}
                                                style={{ 
                                                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                                                    backgroundColor: assignment.isRecommended ? '#3B82F6' : '#0F172A',
                                                    color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s',
                                                    boxShadow: assignment.isRecommended ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                                }}
                                            >Confirm Selection</button>
                                            <div style={{ fontSize: '0.65rem', color: '#94A3B8', textAlign: 'center' }}>~15 mins pickup ETA</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ 
                                    backgroundColor: 'white', padding: '4rem', borderRadius: '24px', textAlign: 'center',
                                    border: '1px dashed #E2E8F0'
                                }}>
                                    <Truck size={48} color="#94A3B8" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ color: '#0F172A', fontWeight: '700', marginBottom: '0.5rem' }}>No Available Transporters</h3>
                                    <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                                        The AI Engine couldn't find any drivers currently online and available for this route.
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                        <button onClick={fetchAiInsights} style={{ padding: '10px 20px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Refresh Search</button>
                                        <button onClick={() => navigate('/retailer/dashboard')} style={{ padding: '10px 20px', backgroundColor: '#0F172A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Back to Dashboard</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pricing Sidebar */}
                    <div>
                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: '2rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A' }}>
                                <TrendingDown size={18} color="#10B981" /> AI Pricing Analysis
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#64748B' }}>Base Pickup Fare</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>₹25.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#64748B' }}>Distance Multiplier</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A' }}>₹12.50</span>
                                </div>
                                <div style={{ paddingTop: '1rem', borderTop: '1px dashed #E2E8F0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <span style={{ color: '#D97706', fontWeight: 'bold' }}>Surge Pricing</span>
                                        <span style={{ color: '#D97706', fontWeight: '800' }}>x1.25</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#64748B' }}>Weather Surcharge</span>
                                        <span style={{ color: weatherRisk === 'SAFE' ? '#10B981' : '#EF4444', fontWeight: '800' }}>
                                            {weatherRisk === 'SAFE' ? '₹0.00' : '₹15.00'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', marginBottom: '10px' }}>PRICE CONFIDENCE</div>
                                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '92%', height: '100%', backgroundColor: '#10B981' }}></div>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '8px', margin: '8px 0 0' }}>
                                    AI is 92% confident this is the fairest price for current conditions.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TransportSelection;
