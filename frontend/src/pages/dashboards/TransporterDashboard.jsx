import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Truck, DollarSign, CheckCircle, Navigation, MapPin, Edit3, XCircle, Trophy, BarChart2, Star, ShieldCheck, Camera, PenTool } from 'lucide-react';
import L from 'leaflet';
import '../../styles/global.css';
import AlertBanner from '../../components/AlertBanner';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TransporterDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);
    const [availableRequests, setAvailableRequests] = useState([]);
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [location, setLocation] = useState({ lat: 0, lng: 0 });
    const [loading, setLoading] = useState(true);
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [negotiatedPrice, setNegotiatedPrice] = useState(0);
    const [showProofModal, setShowProofModal] = useState(false);
    const [currentProofOrder, setCurrentProofOrder] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'ROLE_TRANSPORTER') {
            navigate('/login');
            return;
        }
        setUser(parsedUser);
        fetchDashboardData();

        const locInterval = setInterval(updateLocation, 10000);
        const fetchInterval = setInterval(fetchDashboardData, 5000);

        return () => {
            clearInterval(locInterval);
            clearInterval(fetchInterval);
        };
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            const [res, dRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/transport/my-deliveries`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/transport/driver-info`, { credentials: 'include' })
            ]);

            if (res.ok) {
                const data = await res.json();
                setAvailableRequests(data.filter(d => d.status === 'PENDING' || d.status === 'PRICE_UPDATED' || d.status === 'SCHEDULED'));
                setActiveDeliveries(data.filter(d => d.status === 'ACCEPTED' || d.status === 'ON_THE_WAY'));
            }
            if (dRes.ok) setDriverInfo(await dRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLocation({ lat, lng });
                await fetch(`${import.meta.env.VITE_API_URL}/api/transport/location`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ lat, lng })
                });
            });
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchDashboardData();
        } catch (e) { console.error(e); }
    };

    const handleNegotiate = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${id}/negotiate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ newPrice: negotiatedPrice, changedBy: 'TRANSPORTER' })
            });
            if (res.ok) { setEditingPriceId(null); fetchDashboardData(); }
        } catch (err) { console.error(err); }
    };

    const handleAcceptPrice = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${id}/accept-negotiation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ acceptedBy: 'TRANSPORTER' })
            });
            if (res.ok) fetchDashboardData();
        } catch (err) { console.error(err); }
    };

    const submitProof = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${currentProofOrder.id}/delivery-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ photoUrl: "https://via.placeholder.com/150", signature: "SIGNED_OK" })
            });
            if (res.ok) { setShowProofModal(false); fetchDashboardData(); }
        } catch (e) { console.error(e); }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading || !user || !driverInfo) return <div style={{ padding: '4rem', textAlign: 'center' }}>🔄 Initializing Premium Logistics Hub...</div>;

    const acceptanceRate = driverInfo.totalRequests > 0 ? ((driverInfo.acceptedRequests / driverInfo.totalRequests) * 100).toFixed(0) : 0;

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <nav style={{ backgroundColor: '#0F172A', color: 'white', padding: '1.2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Truck size={28} color="#3B82F6" />
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>LOGISTICS PRO</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user.fullName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 'bold' }}>{driverInfo.badge || 'STANDARD'} PARTNER</div>
                    </div>
                    <button onClick={handleLogout} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Logout</button>
                </div>
            </nav>

            <AlertBanner location={user?.address || user?.businessName || "Hyderabad"} />

            <div style={{ padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Gamification & Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 'bold', marginBottom: '5px' }}>TOTAL POINTS</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A' }}>{driverInfo.points} XP</div>
                            </div>
                            <div style={{ backgroundColor: '#FEF3C7', padding: '10px', borderRadius: '15px' }}><Trophy size={20} color="#D97706" /></div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 'bold', marginBottom: '5px' }}>ACCEPTANCE RATE</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A' }}>{acceptanceRate}%</div>
                            </div>
                            <div style={{ backgroundColor: '#DCFCE7', padding: '10px', borderRadius: '15px' }}><BarChart2 size={20} color="#166534" /></div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 'bold', marginBottom: '5px' }}>DRIVER RATING</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A' }}>{driverInfo.rating.toFixed(1)} <Star size={20} fill="#F59E0B" color="#F59E0B" style={{ display: 'inline' }} /></div>
                            </div>
                            <div style={{ backgroundColor: '#F0F9FF', padding: '10px', borderRadius: '15px' }}><ShieldCheck size={20} color="#0EA5E9" /></div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 'bold', marginBottom: '5px' }}>DELIVERED</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A' }}>{driverInfo.deliveredRequests} PKG</div>
                            </div>
                            <div style={{ backgroundColor: '#F1F5F9', padding: '10px', borderRadius: '15px' }}><Truck size={20} color="#334155" /></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {/* Interactive Tracking Map */}
                        <div style={{ backgroundColor: 'white', borderRadius: '32px', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ color: '#0F172A', margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Navigation size={22} color="#3B82F6" /> Live Fleet Tracking
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', backgroundColor: '#F1F5F9', padding: '5px 12px', borderRadius: '8px' }}>
                                    {location.lat ? `Coord: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Wait for GPS...'}
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '400px', backgroundColor: '#F8FAFC', borderRadius: '24px', overflow: 'hidden' }}>
                                {location.lat !== 0 && (
                                    <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[location.lat, location.lng]}><Popup>🔥 You - On Duty</Popup></Marker>
                                    </MapContainer>
                                )}
                            </div>
                        </div>

                        {/* Active Operations */}
                        <div style={{ backgroundColor: 'white', borderRadius: '32px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ color: '#0F172A', marginBottom: '2rem', fontSize: '1.4rem', fontWeight: '800' }}>📋 Active Operations</h3>
                            {activeDeliveries.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>No active assignments currently.</div> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {activeDeliveries.map(req => (
                                        <div key={req.id} style={{ border: '1px solid #F1F5F9', padding: '1.5rem', borderRadius: '24px', backgroundColor: '#FDFDFD', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.01)' }}>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', marginBottom: '5px' }}>Order #{req.order?.id}</div>
                                                <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
                                                    <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14} /> {req.distanceKm.toFixed(1)} km</span>
                                                    <span style={{ color: '#10B981', fontWeight: '900' }}>💰 ₹{req.updatedPrice.toFixed(0)}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {req.status === 'ACCEPTED' && (
                                                    <button onClick={() => updateStatus(req.id, 'ON_THE_WAY')} style={{ padding: '12px 25px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        Start Trip
                                                    </button>
                                                )}
                                                {req.status === 'ON_THE_WAY' && (
                                                    <button onClick={() => { setCurrentProofOrder(req); setShowProofModal(true); }} style={{ padding: '12px 25px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <CheckCircle size={18} /> Finish Trip
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Smart Bidding Hub */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '32px', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', border: '1px solid #F59E0B' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ color: '#0F172A', margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>🔔 Bidding Hub</h3>
                                <span style={{ backgroundColor: '#EF4444', color: 'white', borderRadius: '12px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: '900' }}>{availableRequests.length} NEW</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {availableRequests.map(req => (
                                    <div key={req.id} style={{ border: '1px solid #F1F5F9', padding: '1.5rem', borderRadius: '24px', position: 'relative' }}>
                                        {req.status === 'SCHEDULED' && (
                                          <div style={{ position: 'absolute', top: '-10px', left: '20px', backgroundColor: '#3B82F6', color: 'white', padding: '2px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800' }}>
                                            📅 {req.scheduledDate} {req.timeSlot}
                                          </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ fontWeight: '800', color: '#1E293B' }}>Order #{req.order?.id}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 'bold' }}>{req.distanceKm.toFixed(1)} km</span>
                                        </div>

                                        <div style={{ backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '18px', marginBottom: '18px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B' }}>
                                                <span>AI Estimate:</span>
                                                <span>₹{req.initialPrice.toFixed(0)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: '900', fontSize: '1.2rem', color: '#10B981' }}>
                                                <span>Offer:</span>
                                                <span>₹{req.updatedPrice.toFixed(0)}</span>
                                            </div>
                                            {req.priceReason && <div style={{ fontSize: '0.65rem', color: '#D97706', marginTop: '5px', fontWeight: 'bold' }}>{req.priceReason}</div>}
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <button onClick={() => handleAcceptPrice(req.id)} style={{ width: '100%', padding: '14px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', fontSize: '0.9rem' }}>Accept Order</button>
                                            
                                            {editingPriceId === req.id ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input type="number" value={negotiatedPrice} onChange={(e) => setNegotiatedPrice(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #CBD5E1' }} />
                                                    <button onClick={() => handleNegotiate(req.id)} style={{ padding: '10px 15px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '12px' }}>OK</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setEditingPriceId(req.id); setNegotiatedPrice(req.updatedPrice); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Counter Offer</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proof Modal */}
            {showProofModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', width: '450px', position: 'relative' }}>
                  <button onClick={() => setShowProofModal(false)} style={{ position: 'absolute', top: '15px', right: '20px', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: '900' }}>Confirm Delivery 📦</h3>
                  <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Please provide delivery proof to release funds from escrow for Order #{currentProofOrder.order?.id}.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '2rem', border: '2px dashed #E2E8F0', borderRadius: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
                      <Camera size={32} color="#94A3B8" style={{ marginBottom: '10px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748B' }}>Snap Parcel Photo</div>
                    </div>
                    <div style={{ padding: '2rem', border: '2px dashed #E2E8F0', borderRadius: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
                      <PenTool size={32} color="#94A3B8" style={{ marginBottom: '10px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748B' }}>Retailer e-Signature</div>
                    </div>
                  </div>
                  
                  <button onClick={submitProof} style={{ width: '100%', padding: '15px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>Complete Delivery ✅</button>
                </div>
              </div>
            )}
        </div>
    );
};

export default TransporterDashboard;
