import React, { useState, useEffect } from 'react';
import { MapPin, Truck, CheckCircle, Clock, DollarSign, RefreshCw, Star, Download, ShieldCheck, ChevronRight, Package, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams } from 'react-router-dom';

const LogisticsTracker = ({ fetchWithAuth }) => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [transport, setTransport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [negotiationActive, setNegotiationActive] = useState(false);
    const [newPrice, setNewPrice] = useState(0);

    const [searchParams] = useSearchParams();
    const urlOrderId = searchParams.get('orderId');

    useEffect(() => {
        fetchTrackableOrders();
    }, []);

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
            interval = setInterval(() => fetchTransportStatus(selectedOrder.id), 5000);
        }
        return () => clearInterval(interval);
    }, [selectedOrder]);

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
                                backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', 
                                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#16a34a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
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
            <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                <Package size={64} color="var(--text-tertiary)" style={{ marginBottom: '1.5rem' }} />
                <h3 style={{ marginBottom: '1rem' }}>No Logistics Data</h3>
                <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem' }}>This order doesn't have a platform-tracked shipment yet.</p>
                <button onClick={() => setSelectedOrder(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Back to List</button>
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
