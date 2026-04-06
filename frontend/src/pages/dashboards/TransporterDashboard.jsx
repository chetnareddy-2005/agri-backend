import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Truck, DollarSign, CheckCircle, Navigation, MapPin, Edit3, XCircle, Trophy, BarChart2, Star, ShieldCheck, Camera, PenTool, Menu, LayoutDashboard, ChevronRight, LogOut } from 'lucide-react';
import L from 'leaflet';
import '../../styles/global.css';
import AlertBanner from '../../components/AlertBanner';
import ThemeToggle from '../../components/ThemeToggle';

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
    const [activeTab, setActiveTab] = useState('Overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

        const locInterval = setInterval(updateLocation, 30000); // 30s
        const fetchInterval = setInterval(fetchDashboardData, 10000); // 10s

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

    const NavItem = ({ icon, label, active, onClick }) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.5rem',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: active ? 'var(--bg-tertiary)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: active ? '600' : '500',
                borderLeft: active ? '4px solid #3b82f6' : '4px solid transparent'
            }}
            className="sidebar-item"
        >
            <div style={{ marginRight: '12px' }}>{icon}</div>
            <span style={{ fontSize: '0.95rem' }}>{label}</span>
            {active && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.8 }} />}
        </div>
    );

    if (loading || !user || !driverInfo) return (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', height: '100vh', color: 'var(--text-primary)' }}>
            <Truck size={48} className="animate-bounce" style={{ margin: '0 auto 1.5rem', color: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Initializing Premium Logistics Hub...</h2>
            <p style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>Connecting to secure fleet nodes</p>
        </div>
    );

    const acceptanceRate = driverInfo.totalRequests > 0 ? ((driverInfo.acceptedRequests / driverInfo.totalRequests) * 100).toFixed(0) : 0;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontFamily: '"Inter", sans-serif' }}>
            
            {/* Consistent Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '260px' : '0px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column',
                height: '100vh', position: 'sticky', top: 0,
                transition: 'width 0.3s ease', overflow: 'hidden', flexShrink: 0
            }}>
                <div style={{ padding: '2rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Truck size={32} color="#3b82f6" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Logistics Pro</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', marginLeft: '42px', fontWeight: '600' }}>FLEET MANAGEMENT</p>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <NavItem icon={<LayoutDashboard size={20} />} label="Fleet Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                    <NavItem icon={<Navigation size={20} />} label="Live Tracking" active={activeTab === 'Tracking'} onClick={() => setActiveTab('Tracking')} />
                    <NavItem icon={<DollarSign size={20} />} label="Bidding Hub" active={activeTab === 'Bidding'} onClick={() => setActiveTab('Bidding')} />
                    <NavItem icon={<ShieldCheck size={20} />} label="My Rewards" active={activeTab === 'Rewards'} onClick={() => setActiveTab('Rewards')} />
                </nav>

                <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.8rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Consistent Sticky Header */}
                <header style={{
                    backgroundColor: 'var(--bg-secondary)', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Menu size={24} /></button>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{activeTab}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <ThemeToggle />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{user.fullName}</p>
                                <p style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '800', margin: 0 }}>{driverInfo.badge || 'STANDARD'} PARTNER</p>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {user.fullName[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'Overview' && (
                        <>
                            {/* Performance Metrics Card Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                                <MetricCard title="Points Earned" value={`${driverInfo.points} XP`} icon={<Trophy size={20} color="#D97706" />} bgColor="#FEF3C7" />
                                <MetricCard title="Success Rate" value={`${acceptanceRate}%`} icon={<BarChart2 size={20} color="#166534" />} bgColor="#DCFCE7" />
                                <MetricCard title="Driver Rating" value={driverInfo.rating.toFixed(1)} icon={<Star size={20} color="#F59E0B" fill="#F59E0B" />} bgColor="#FFFBEB" />
                                <MetricCard title="Delivered" value={`${driverInfo.deliveredRequests} pkgs`} icon={<CheckCircle size={20} color="#0EA5E9" />} bgColor="#F0F9FF" />
                            </div>

                            <AlertBanner location={user?.address || "Hyderabad"} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
                                <section>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>📋 Active Deliveries</h3>
                                    {activeDeliveries.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)' }}>No active assignments currently.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {activeDeliveries.map(req => (
                                                <div key={req.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Order #{req.order?.id}</div>
                                                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', marginTop: '4px' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14} /> {req.distanceKm.toFixed(1)} km</span>
                                                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>Payout: ₹{req.updatedPrice.toFixed(0)}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        {req.status === 'ACCEPTED' && <button onClick={() => updateStatus(req.id, 'ON_THE_WAY')} style={primaryButtonStyle}>Start Trip</button>}
                                                        {req.status === 'ON_THE_WAY' && <button onClick={() => { setCurrentProofOrder(req); setShowProofModal(true); }} style={successButtonStyle}>Finish Trip</button>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <aside>
                                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', height: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>🔔 Quick Bids</h3>
                                            <span style={{ backgroundColor: '#EF4444', color: 'white', borderRadius: '8px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>{availableRequests.length} NEW</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {availableRequests.slice(0, 3).map(req => (
                                                <div key={req.id} style={{ border: '1px solid var(--border-color)', padding: '1.2rem', borderRadius: '16px', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>Order #{req.order?.id}</span>
                                                        <span style={{ color: '#3b82f6' }}>{req.distanceKm.toFixed(1)}km</span>
                                                    </div>
                                                    <div style={{ fontWeight: '800', color: '#10B981', fontSize: '1.1rem' }}>₹{req.updatedPrice.toFixed(0)}</div>
                                                    <button onClick={() => setActiveTab('Bidding')} style={{ width: '100%', marginTop: '10px', padding: '8px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>View Hub</button>
                                                </div>
                                            ))}
                                            {availableRequests.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>No new delivery requests.</p>}
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </>
                    )}

                    {activeTab === 'Tracking' && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border-color)', minHeight: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                               <h3 style={{ margin: 0 }}>Fleet Tracking</h3>
                               <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{location.lat ? `Live GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting Location...'}</div>
                            </div>
                            <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden' }}>
                                {location.lat !== 0 ? (
                                    <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[location.lat, location.lng]}><Popup>🔥 You - On duty</Popup></Marker>
                                    </MapContainer>
                                ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'var(--bg-tertiary)' }}>Please enable GPS for tracking</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Bidding' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                             {availableRequests.map(req => (
                                <div key={req.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '24px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span style={{ fontWeight: 'bold' }}>Order #{req.order?.id}</span>
                                        <span style={{ color: '#3b82f6' }}>{req.distanceKm.toFixed(1)} km</span>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '15px', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}><span>AI Estimate:</span><span>₹{req.initialPrice.toFixed(0)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontWeight: 'bold', fontSize: '1.2rem', color: '#10B981' }}><span>Current Offer:</span><span>₹{req.updatedPrice.toFixed(0)}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button onClick={() => handleAcceptPrice(req.id)} style={successButtonStyle}>Accept Order</button>
                                        {editingPriceId === req.id ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <input type="number" value={negotiatedPrice} onChange={(e) => setNegotiatedPrice(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                                <button onClick={() => handleNegotiate(req.id)} style={primaryButtonStyle}>OK</button>
                                            </div>
                                        ) : <button onClick={() => { setEditingPriceId(req.id); setNegotiatedPrice(req.updatedPrice); }} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>Counter Offer</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Proof Modal */}
            {showProofModal && (
              <div style={modalOverlayStyle}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', width: '400px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontWeight: 'bold' }}>Confirm Delivery 📦</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Upload proof to complete Order #{currentProofOrder.order?.id}.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={uploadPlaceholderStyle}><Camera size={24} /> Snap Parcel</div>
                    <div style={uploadPlaceholderStyle}><PenTool size={24} /> e-Signature</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowProofModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={submitProof} style={{ flex: 1.5, ...successButtonStyle }}>Finish Trip</button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

// Reusable Sub-Components & Styles
const MetricCard = ({ title, value, icon, bgColor }) => (
    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
        <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: '600', marginBottom: '5px' }}>{title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</div>
        </div>
        <div style={{ backgroundColor: bgColor, padding: '10px', borderRadius: '12px', height: 'fit-content' }}>{icon}</div>
    </div>
);

const primaryButtonStyle = { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const successButtonStyle = { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const uploadPlaceholderStyle = { padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-tertiary)', cursor: 'pointer' };

export default TransporterDashboard;
