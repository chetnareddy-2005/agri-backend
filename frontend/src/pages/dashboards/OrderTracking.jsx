import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Truck, CheckCircle, Clock, AlertTriangle, DollarSign, XCircle, RefreshCw, Star, Download, ShieldCheck, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/global.css';

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [transport, setTransport] = useState(location.state?.transport || null);
    const [loading, setLoading] = useState(!location.state?.transport);
    const [negotiationActive, setNegotiationActive] = useState(false);
    const [newPrice, setNewPrice] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    useEffect(() => {
        const interval = setInterval(fetchTransportStatus, 5000);
        return () => clearInterval(interval);
    }, [orderId]);

    const fetchTransportStatus = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/order/${orderId}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTransport(data);
                if (loading) setLoading(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptPrice = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${transport.id}/accept-negotiation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ acceptedBy: 'RETAILER' })
            });
            if (res.ok) fetchTransportStatus();
        } catch (err) {
            console.error(err);
        }
    };

    const handleReNegotiate = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${transport.id}/negotiate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ newPrice, changedBy: 'RETAILER' })
            });
            if (res.ok) {
                setNegotiationActive(false);
                fetchTransportStatus();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const submitRating = async (rating) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${transport.id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating, fromRole: 'RETAILER' })
            });
            if (res.ok) {
                setRatingSubmitted(true);
                setUserRating(rating);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Tracking Data...</div>;

    const getStatusStep = (status) => {
        const steps = ['PENDING', 'SCHEDULED', 'PRICE_UPDATED', 'ACCEPTED', 'ON_THE_WAY', 'DELIVERED'];
        return steps.indexOf(status);
    };

    const currentStep = getStatusStep(transport.status);

    return (
        <div style={{ backgroundColor: '#F0F2F5', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B', marginBottom: '5px' }}>
                          <ChevronRight size={18} />
                          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Logistics Tracker</span>
                        </div>
                        <h1 style={{ color: '#0F172A', fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>Order #{orderId}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                          {transport.status.replace('_', ' ')}
                      </div>
                      <button 
                        onClick={() => window.print()}
                        style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: 'white', color: '#1E293B', fontWeight: 'bold', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <Download size={18} /> Invoice
                      </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {/* Swiggy Style Tracking Map */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '25px', left: '25px', zIndex: 10, backgroundColor: 'white', padding: '12px 20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                              <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{transport.status === 'ON_THE_WAY' ? 'Arriving in 12 mins' : 'Awaiting Pickup'}</span>
                            </div>

                            <div style={{ width: '100%', height: '450px', backgroundColor: '#F1F5F9', borderRadius: '18px', overflow: 'hidden' }}>
                                {transport.driver?.currentLat ? (
                                    <MapContainer center={[transport.driver.currentLat, transport.driver.currentLng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[transport.driver.currentLat, transport.driver.currentLng]} icon={L.divIcon({ className: 'custom-div-icon', html: '<div style="font-size: 30px">🚚</div>', iconSize: [30, 42], iconAnchor: [15, 42] })}>
                                            <Popup>🚚 Driver: {transport.driver.user.fullName}</Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                      <RefreshCw size={48} className="animate-spin" style={{ marginBottom: '15px' }} />
                                      <span style={{ fontWeight: 'bold' }}>Simulating Live Route Logic...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Timeline Section */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '2.5rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Clock size={20} color="#3B82F6" /> Delivery Lifecycle
                            </h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                {/* Horizontal timeline line */}
                                <div style={{ position: 'absolute', top: '15px', left: '0', width: '100%', height: '4px', backgroundColor: '#F1F5F9', zIndex: 1 }}></div>
                                <div style={{ position: 'absolute', top: '15px', left: '0', width: `${(currentStep / 5) * 100}%`, height: '4px', backgroundColor: '#3B82F6', zIndex: 2, transition: '1s ease' }}></div>

                                {[
                                    { label: 'Booked', status: 'PENDING' },
                                    { label: 'Scheduled', status: 'SCHEDULED' },
                                    { label: 'Negotiated', status: 'PRICE_UPDATED' },
                                    { label: 'Assigned', status: 'ACCEPTED' },
                                    { label: 'In Transit', status: 'ON_THE_WAY' },
                                    { label: 'Delivered', status: 'DELIVERED' }
                                ].map((step, idx) => {
                                    const stepIdx = getStatusStep(step.status);
                                    const isDone = currentStep >= stepIdx;
                                    const isCurrent = currentStep === stepIdx;

                                    return (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, width: '60px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isDone ? '#3B82F6' : 'white', border: isDone ? 'none' : '3px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: '0.3s' }}>
                                                {isDone ? <CheckCircle size={18} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#CBD5E1' }}></div>}
                                            </div>
                                            <span style={{ marginTop: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: isDone ? '#1E293B' : '#94A3B8', textAlign: 'center' }}>{step.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Post-Delivery Rating */}
                        {transport.status === 'DELIVERED' && !ratingSubmitted && (
                          <div style={{ backgroundColor: '#1E293B', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', color: 'white', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>Order Delivered! 📦</h2>
                            <p style={{ opacity: 0.8, marginBottom: '25px' }}>How was your delivery experience with {transport.driver.user.fullName}?</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                        key={s} 
                                        size={40} 
                                        fill={userRating >= s ? '#F59E0B' : 'transparent'} 
                                        color={userRating >= s ? '#F59E0B' : '#64748B'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => submitRating(s)}
                                        onMouseEnter={() => setUserRating(s)}
                                    />
                                ))}
                            </div>
                          </div>
                        )}
                        {ratingSubmitted && (
                          <div style={{ backgroundColor: '#10B981', borderRadius: '24px', padding: '1.5rem', textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
                            ✅ Rating submitted! Thank you for the feedback.
                          </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {/* Driver Sidecard */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2rem' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '20px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    👤
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 5px', fontSize: '1.2rem', fontWeight: '800', color: '#0F172A' }}>{transport.driver.user.fullName}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                          {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= 4 ? '#F59E0B' : 'transparent'} color="#F59E0B" />)}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>4.8</span>
                                    </div>
                                    {transport.driver.badge && (
                                      <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: '#F0F9FF', color: '#0EA5E9', padding: '2px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800' }}>
                                        {transport.driver.badge} PARTNER
                                      </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#64748B', fontSize: '0.9rem' }}>Vehicle</span>
                                    <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{transport.driver.vehicleType}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748B', fontSize: '0.9rem' }}>Phone</span>
                                    <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{transport.driver.user.mobileNumber}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Hub */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', border: (transport.status === 'PRICE_UPDATED' && transport.priceChangedBy === 'TRANSPORTER') ? '2px solid #EF4444' : 'none' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DollarSign size={20} color="#10B981" /> Financial Details
                            </h3>

                            <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '18px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Initial AI Price:</span>
                                    <span style={{ fontWeight: 'bold' }}>₹{transport.initialPrice.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '1.1rem' }}>Final Fare:</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10B981' }}>₹{transport.updatedPrice.toFixed(0)}</span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {transport.updatedPrice <= transport.initialPrice * 1.05 ? (
                                        <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <ShieldCheck size={14} /> FAIR PRICE
                                        </div>
                                    ) : (
                                        <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                          SURGE PRICING
                                        </div>
                                    )}
                                </div>
                                {transport.priceReason && (
                                  <p style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                                    {transport.priceReason}
                                  </p>
                                )}
                            </div>

                            {(transport.status === 'PRICE_UPDATED' && transport.priceChangedBy === 'TRANSPORTER') ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', padding: '12px', borderRadius: '12px', color: '#991B1B', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>
                                  🚨 Transporter requested ₹{transport.updatedPrice.toFixed(0)}
                                </div>
                                <button onClick={handleAcceptPrice} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#10B981', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                                    Accept Counter Offer
                                </button>
                                <button onClick={() => setNegotiationActive(true)} style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Re-negotiate
                                </button>
                              </div>
                            ) : (
                              <div style={{ backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                  <ShieldCheck size={18} color="#10B981" />
                                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>Funds held in <strong>Escrow</strong> until delivery.</p>
                              </div>
                            )}

                            {negotiationActive && (
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem' }}>
                                    <input 
                                        type="number" 
                                        value={newPrice} 
                                        onChange={(e) => setNewPrice(e.target.value)} 
                                        placeholder="Your Offer (₹)"
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '10px' }}
                                    />
                                    <button onClick={handleReNegotiate} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                                        Submit Counter
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Meta */}
                        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '24px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '0.9rem', color: '#64748B' }}>DELIVERY PROOFS</h4>
                            {transport.deliveryPhotoUrl ? (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <img src={transport.deliveryPhotoUrl} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} alt="Proof" />
                                <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '10px', flex: 1, fontSize: '0.7rem', color: '#64748B' }}>
                                  Signature Verified ✅
                                </div>
                              </div>
                            ) : (
                              <div style={{ padding: '15px', border: '2px dashed #CBD5E1', borderRadius: '15px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                                Awaiting Delivery Proof
                              </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
