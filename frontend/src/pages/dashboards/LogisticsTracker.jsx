import React, { useState, useEffect } from 'react';
import { MapPin, Truck, CheckCircle, Clock, DollarSign, RefreshCw, Star, Download, ShieldCheck, ChevronRight, Package, Search, Zap, Trophy, TrendingDown, Info, Calendar, AlertCircle, Scale } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams } from 'react-router-dom';

const LogisticsTracker = ({ fetchWithAuth, orders: propOrders, refreshOrders }) => {
    const [orders, setOrders] = useState(propOrders || []);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [transport, setTransport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [negotiationActive, setNegotiationActive] = useState(false);
    const [newPrice, setNewPrice] = useState(0);
    
    // AI Selection State
    const [aiAssignments, setAiAssignments] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState('INSTANT');
    const [scheduledDate, setScheduledDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('Morning');
    const [weatherRisk, setWeatherRisk] = useState('SAFE');

    const [searchParams] = useSearchParams();
    const urlOrderId = searchParams.get('orderId');

    useEffect(() => {
        if (propOrders) setOrders(propOrders);
    }, [propOrders]);

    useEffect(() => {
        if (urlOrderId && orders.length > 0) {
            const found = orders.find(o => String(o.id) === String(urlOrderId));
            if (found) setSelectedOrder(found);
        }
    }, [urlOrderId, orders]);

    useEffect(() => {
        let interval;
        if (selectedOrder) {
            fetchTransportStatus(selectedOrder.id);
            interval = setInterval(() => fetchTransportStatus(selectedOrder.id), 15000);
            
            // If no transport, fetch AI insights
            if (!transport) {
                fetchAiInsights(selectedOrder);
            }
        }
        return () => clearInterval(interval);
    }, [selectedOrder, transport === null]);

    const fetchTrackableOrders = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`);
            if (res.ok) {
                const data = await res.json();
                // Show all orders, we'll check if they have transport later
                setOrders(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTransportStatus = async (orderId) => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/order/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setTransport(data);
            } else {
                setTransport(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAiInsights = async (order) => {
        setAiLoading(true);
        try {
            const destination = order.product?.location || "Hyderabad";
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/allocation-insights?destination=${encodeURIComponent(destination)}`);
            if (res.ok) {
                const data = await res.json();
                setAiAssignments(data);
                if (data.length > 0) setWeatherRisk(data[0].risk);
            }
        } catch (err) { console.error(err); }
        finally { setAiLoading(false); }
    };

    const handleSelectDriver = async (assignment) => {
        if (deliveryMode === 'SCHEDULED' && !scheduledDate) {
            alert("Please select a delivery date");
            return;
        }
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    driverId: assignment.driverId,
                    distanceKm: 2.5,
                    scheduledDate: deliveryMode === 'SCHEDULED' ? scheduledDate : null,
                    timeSlot: deliveryMode === 'SCHEDULED' ? timeSlot : null
                })
            });
            if (res.ok) {
                fetchTransportStatus(selectedOrder.id);
            } else {
                const errorText = await res.text();
                alert("Selection failed: " + errorText);
            }
        } catch (err) { console.error(err); }
    };

    const handleAcceptPrice = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/${transport.id}/accept-negotiation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acceptedBy: 'RETAILER' })
            });
            if (res.ok) fetchTransportStatus(selectedOrder.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReNegotiate = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/${transport.id}/negotiate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPrice, changedBy: 'RETAILER' })
            });
            if (res.ok) {
                setNegotiationActive(false);
                fetchTransportStatus(selectedOrder.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusStep = (status) => {
        const steps = ['PENDING', 'SCHEDULED', 'PRICE_UPDATED', 'ACCEPTED', 'ON_THE_WAY', 'DELIVERED'];
        return steps.indexOf(status);
    };

    if (!selectedOrder) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Logistics Hub</h2>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
                        <input 
                            placeholder="Search Order ID..." 
                            style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '250px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {orders.filter(o => o.status !== 'CANCELLED').map(order => (
                        <div 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            style={{ 
                                backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', 
                                border: urlOrderId === String(order.id) ? '3px solid #3B82F6' : '1px solid var(--border-color)', 
                                cursor: 'pointer', transition: 'all 0.2s', 
                                boxShadow: urlOrderId === String(order.id) ? '0 10px 15px -3px rgba(59, 130, 246, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; if (urlOrderId !== String(order.id)) e.currentTarget.style.borderColor = '#16a34a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; if (urlOrderId !== String(order.id)) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                            {urlOrderId === String(order.id) && (
                                <div style={{ position: 'absolute', top: '-10px', left: '20px', backgroundColor: '#3B82F6', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 10 }}>
                                    RECENT ORDER
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    Order #{order.id}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{new Date(order.orderDate).toLocaleDateString()}</span>
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{order.product?.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                <Truck size={14} /> 
                                <span>{order.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <span style={{ fontWeight: 'bold', color: '#16a34a' }}>₹{order.totalPrice}</span>
                                <ChevronRight size={18} color="var(--text-tertiary)" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!transport) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} /></button>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Smart Allocation Engine AI</h2>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Order #{selectedOrder.id} • Selecting best logistics match</p>
                    </div>
                </div>

                {aiLoading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <RefreshCw size={48} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#3B82F6' }} />
                        <p style={{ fontWeight: '600' }}>AI Scoring Module: Calculating Fairness & Efficiency...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Mode Switcher */}
                            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setDeliveryMode('INSTANT')} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', backgroundColor: deliveryMode === 'INSTANT' ? '#0F172A' : 'transparent', color: deliveryMode === 'INSTANT' ? 'white' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>⚡ Instant</button>
                                    <button onClick={() => setDeliveryMode('SCHEDULED')} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', backgroundColor: deliveryMode === 'SCHEDULED' ? '#0F172A' : 'transparent', color: deliveryMode === 'SCHEDULED' ? 'white' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>📅 Scheduled</button>
                                </div>
                                {deliveryMode === 'SCHEDULED' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                )}
                            </div>

                            {aiAssignments.map((assignment, idx) => (
                                <div key={assignment.driverId} style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', display: 'flex', gap: '1.5rem', border: idx === 0 ? '2px solid #3B82F6' : '1px solid var(--border-color)', position: 'relative' }}>
                                    {idx === 0 && <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#3B82F6', color: 'white', padding: '4px 12px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '0 0 0 12px' }}>AI TOP PICK</div>}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '10px' }}>👤</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#3B82F6' }}>{assignment.score}%</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>{assignment.driverName}</h4>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={14} /> {assignment.vehicle}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3B82F6' }}>{assignment.badge}</span>
                                        </div>
                                        <div style={{ backgroundColor: '#FFFBEB', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #D97706', fontSize: '0.8rem', color: '#92400E' }}>
                                            <strong>AI Insights:</strong> {assignment.explanation}
                                        </div>
                                    </div>
                                    <div style={{ width: '150px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>₹{(25 + (6 * 1.5)).toFixed(0)}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>EST. FARE</div>
                                        </div>
                                        <button onClick={() => handleSelectDriver(assignment)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Select</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                             <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingDown size={18} color="#10B981" /> Pricing Analysis</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base Fare</span><span>₹25.00</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Distance</span><span>₹12.50</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 'bold' }}><span>Surge x1.25</span><span>+₹9.40</span></div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const currentStep = getStatusStep(transport.status);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} /></button>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Tracking Order #{selectedOrder.id}</h2>
                </div>
                <div style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold' }}>
                    {transport.status.replace('_', ' ')}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Map Area */}
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '1rem', border: '1px solid var(--border-color)', height: '400px', overflow: 'hidden' }}>
                        {transport.driver?.currentLat ? (
                            <MapContainer center={[transport.driver.currentLat, transport.driver.currentLng]} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '18px' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[transport.driver.currentLat, transport.driver.currentLng]} icon={L.divIcon({ className: 'custom-div-icon', html: '<div style="font-size: 30px">🚚</div>', iconSize: [30, 42], iconAnchor: [15, 42] })}>
                                    <Popup>Driver: {transport.driver.user.fullName}</Popup>
                                </Marker>
                            </MapContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', backgroundColor: '#f8fafc' }}>
                                <RefreshCw size={48} className="animate-spin" style={{ marginBottom: '15px' }} />
                                <span style={{ fontWeight: 'bold' }}>Awaiting Live GPS Signal...</span>
                            </div>
                        )}
                    </div>

                    {/* Timeline Area */}
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 20px' }}>
                            <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '4px', backgroundColor: 'var(--border-color)', zIndex: 1 }}></div>
                            <div style={{ position: 'absolute', top: '15px', left: '40px', width: `${Math.max(0, (currentStep / 5) * 85)}%`, height: '4px', backgroundColor: '#3B82F6', zIndex: 2, transition: '1s ease' }}></div>

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
                                return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, width: '60px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isDone ? '#3B82F6' : 'var(--bg-secondary)', border: isDone ? 'none' : '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            {isDone ? <CheckCircle size={16} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-tertiary)' }}></div>}
                                        </div>
                                        <span style={{ marginTop: '10px', fontSize: '0.7rem', fontWeight: 'bold', color: isDone ? 'var(--text-primary)' : 'var(--text-tertiary)', textAlign: 'center' }}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Info Card */}
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '15px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{transport.driver.user.fullName}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#F59E0B', display: 'flex', gap: '2px' }}>
                                    <Star size={12} fill="#F59E0B" /> <Star size={12} fill="#F59E0B" /> <Star size={12} fill="#F59E0B" /> <Star size={12} fill="#F59E0B" /> <Star size={12} />
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Vehicle:</span><span style={{ fontWeight: 'bold' }}>{transport.driver.vehicleType}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Plate:</span><span style={{ fontWeight: 'bold' }}>{transport.driver.licensePlate || 'N/A'}</span></div>
                        </div>
                    </div>

                    {/* Financials Card */}
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><DollarSign size={16} color="#10B981" /> Payment Status</h4>
                        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '15px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}><span>Delivery Fee:</span><span style={{ fontWeight: 'bold' }}>₹{transport.updatedPrice}</span></div>
                        </div>
                        {transport.status === 'PRICE_UPDATED' && transport.priceChangedBy === 'TRANSPORTER' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={handleAcceptPrice} style={{ width: '100%', padding: '10px', borderRadius: '10px', backgroundColor: '#10B981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Accept Price</button>
                                <button onClick={() => setNegotiationActive(!negotiationActive)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #EF4444', color: '#EF4444', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Negotiate</button>
                                {negotiationActive && (
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                        <button onClick={handleReNegotiate} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: 'white' }}>Send</button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <ShieldCheck size={14} color="#10B981" />
                            <span>Payment secured via Escrow</span>
                        </div>
                    </div>

                    {/* Proof Card */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                         <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>Delivery Proof</h4>
                         {transport.deliveryPhotoUrl ? (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <img src={`${import.meta.env.VITE_API_URL}${transport.deliveryPhotoUrl}`} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} alt="Proof" />
                                 <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 'bold' }}>Delivered ✅</span>
                             </div>
                         ) : (
                             <div style={{ border: '2px dashed var(--border-color)', borderRadius: '15px', padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                 Awaiting Proof
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsTracker;
