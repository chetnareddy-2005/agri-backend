import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Truck, DollarSign, CheckCircle, Navigation, MapPin, Edit3, XCircle, Trophy, BarChart2, Star, ShieldCheck, Camera, PenTool, Menu, LayoutDashboard, ChevronRight, LogOut, Wallet } from 'lucide-react';
import L from 'leaflet';
import '../../styles/global.css';
import AlertBanner from '../../components/AlertBanner';
import ThemeToggle from '../../components/ThemeToggle';
import SmallRiskGauge from '../../components/SmallRiskGauge';
import InvoiceTemplate from '../../components/InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [currentProofOrder, setCurrentProofOrder] = useState(null);
    const [showProofModal, setShowProofModal] = useState(false);
    const [deliveredDeliveries, setDeliveredDeliveries] = useState([]);
    const [riskLevel, setRiskLevel] = useState(localStorage.getItem('auth_risk_level') || 'LOW');
    const [wallet, setWallet] = useState({ availableBalance: 0, escrowBalance: 0 });
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    
    // Proof Submission State
    const [deliveryPhoto, setDeliveryPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isSubmittingProof, setIsSubmittingProof] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = React.useRef(null);

    const handleUnauthorized = () => {
        console.warn("[Auth] Security breach or session expiry. Redirecting to landing.");
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_risk_level');
        navigate('/');
    };

    const fetchWithAuth = async (url, options = {}) => {
        const authToken = localStorage.getItem('auth_token');
        const headers = {
            ...options.headers,
            'X-Auth-Token': authToken || ''
        };
        
        try {
            const res = await fetch(url, { ...options, headers, credentials: 'include' });
            console.log(`[API Debug] ${url} - Status: ${res.status}`);
            if (res.status === 401) {
                handleUnauthorized();
            }
            return res;
        } catch (err) {
            console.error(`[API Debug] Fetch error for ${url}:`, err);
            throw err;
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'TRANSPORTER') {
            navigate('/login');
            return;
        }
        setUser(parsedUser);
        fetchDashboardData();
        fetchWallet();

        const locInterval = setInterval(updateLocation, 30000); // 30s
        const fetchInterval = setInterval(() => {
            fetchDashboardData();
            fetchWallet();
        }, 10000); // 10s

        const riskInterval = setInterval(() => {
            setRiskLevel(localStorage.getItem('auth_risk_level') || 'LOW');
        }, 2000);

        return () => {
            clearInterval(locInterval);
            clearInterval(fetchInterval);
            clearInterval(riskInterval);
        };
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            const [res, dRes] = await Promise.all([
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/my-deliveries`, { credentials: 'include' }),
                fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/driver-info`, { credentials: 'include' })
            ]);

            if (res.ok) {
                const data = await res.json();
                console.log("Transporter Deliveries loaded:", data.length);
                setAvailableRequests(data.filter(d => d.status === 'PENDING' || d.status === 'PRICE_UPDATED' || d.status === 'SCHEDULED'));
                setActiveDeliveries(data.filter(d => d.status === 'ACCEPTED' || d.status === 'ON_THE_WAY'));
                const delivered = data.filter(d => d.status?.toUpperCase() === 'DELIVERED' || d.status?.toUpperCase() === 'RECEIVED');
                console.log("Delivered items found:", delivered.length);
                setDeliveredDeliveries(delivered);
            }
            if (dRes.ok) {
                const info = await dRes.json();
                console.log("Driver Info loaded:", info);
                setDriverInfo(info);
            }
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWallet = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/wallet/balance`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (err) { console.error(err); }
    };

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLocation({ lat, lng });
                await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/location`, {
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
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/${id}/status`, {
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
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/${id}/negotiate`, {
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
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/transport/${id}/accept-negotiation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ acceptedBy: 'TRANSPORTER' })
            });
            if (res.ok) fetchDashboardData();
        } catch (err) { console.error(err); }
    };

    const submitProof = async () => {
        if (!deliveryPhoto) {
            alert("Please take or upload a parcel photo.");
            return;
        }
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Check if canvas is empty (simple check: if anything was drawn)
        // We'll rely on the user having drawn something, but a better check would be pixel data
        
        setIsSubmittingProof(true);

        try {
            // Convert Canvas to Blob (File)
            const signatureBlob = await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 'image/png');
            });

            if (!signatureBlob || signatureBlob.size < 100) { // Very small blobs are likely empty
                alert("Please provide a digital signature.");
                setIsSubmittingProof(false);
                return;
            }

            const formData = new FormData();
            formData.append('image', deliveryPhoto);
            formData.append('signature', signatureBlob, 'signature.png');
            formData.append('timestamp', new Date().toISOString());
            formData.append('lat', location.lat);
            formData.append('lng', location.lng);

            const authToken = localStorage.getItem('auth_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${currentProofOrder.id}/delivery-proof`, {
                method: 'POST',
                headers: {
                    'X-Auth-Token': authToken || ''
                },
                body: formData,
                credentials: 'include'
            });

            if (res.ok) {
                setShowProofModal(false);
                setDeliveryPhoto(null);
                setPhotoPreview(null);
                fetchDashboardData();
                alert("Delivery confirmed successfully ✅");
            } else {
                const err = await res.text();
                alert("Proof submission failed: " + err);
            }
        } catch (e) {
            console.error(e);
            alert("Network error while submitting proof.");
        } finally {
            setIsSubmittingProof(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDeliveryPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleViewInvoice = (order) => {
        setSelectedInvoiceOrder(order);
        setShowInvoiceModal(true);
    };

    const downloadInvoicePDF = () => {
        const input = document.getElementById('invoice-content');
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Transporter_Invoice_${selectedInvoiceOrder.id}.pdf`);
        });
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
                    <NavItem icon={<PenTool size={20} />} label="Invoices" active={activeTab === 'Invoices'} onClick={() => setActiveTab('Invoices')} />
                    <NavItem icon={<Wallet size={20} />} label="Wallet" active={activeTab === 'Wallet'} onClick={() => setActiveTab('Wallet')} />
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
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                             <span style={{ fontWeight: "600", fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Risk Level</span>
                             <SmallRiskGauge risk={riskLevel} />
                        </div>
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

                            <AlertBanner location={user?.city || user?.address || "Hyderabad"} />

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

                    {activeTab === 'Rewards' && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>My Rewards Hub</h3>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '4px' }}>Track your delivery success and earned incentives.</p>
                                </div>
                                <div style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.75rem 1.5rem', borderRadius: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Trophy size={20} color="#F59E0B" fill="#F59E0B" /> {driverInfo.points} Points
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '1rem' }}>Delivery #</th>
                                            <th style={{ padding: '1rem' }}>Destination</th>
                                            <th style={{ padding: '1rem' }}>Distance</th>
                                            <th style={{ padding: '1rem' }}>Payout</th>
                                            <th style={{ padding: '1rem' }}>Payment Status</th>
                                            <th style={{ padding: '1rem' }}>Reward</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveredDeliveries.length === 0 ? (
                                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No completed deliveries yet. Start your first trip to earn rewards!</td></tr>
                                        ) : (
                                            deliveredDeliveries.map(delivery => (
                                                <tr key={delivery.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                                                    <td style={{ padding: '1.2rem', fontWeight: 'bold' }}>#{delivery.id}</td>
                                                    <td style={{ padding: '1.2rem' }}>{delivery.order?.retailer?.address || 'Retail Cluster'}</td>
                                                    <td style={{ padding: '1.2rem' }}>{delivery.distanceKm.toFixed(1)} km</td>
                                                    <td style={{ padding: '1.2rem', fontWeight: 'bold', color: '#10B981' }}>₹{delivery.updatedPrice.toFixed(0)}</td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        {(delivery.isPaid || delivery.status === 'RECEIVED') ? (
                                                            <span style={{ color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Received</span>
                                                        ) : (
                                                            <span style={{ color: '#D97706', fontWeight: 'bold' }}>Processing...</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7E22CE', fontWeight: '700' }}>
                                                            +{(delivery.distanceKm * 5).toFixed(0)} XP
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Invoices' && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Digital Invoices</h3>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '4px' }}>Download official transport invoices for your records.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {deliveredDeliveries.map(delivery => (
                                    <div key={delivery.id} style={{ border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>INVOICE ID</div>
                                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>#{delivery.order?.id}</div>
                                            </div>
                                            <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>PAID</div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>Date:</span> <span>{new Date(delivery.order?.orderDate || Date.now()).toLocaleDateString()}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total:</span> <span style={{ fontWeight: 'bold' }}>₹{delivery.updatedPrice.toFixed(0)}</span></div>
                                        </div>
                                        <button 
                                            onClick={() => handleViewInvoice(delivery.order)}
                                            style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <PenTool size={16} /> View Invoice
                                        </button>
                                    </div>
                                ))}
                                {deliveredDeliveries.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>No invoices available yet.</div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'Wallet' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                                <div style={{ fontSize: '1rem', opacity: 0.9 }}>Available Balance</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', marginTop: '0.5rem' }}>₹{wallet.availableBalance.toLocaleString()}</div>
                                <p style={{ fontSize: '0.85rem', marginTop: '1rem', opacity: 0.8 }}>Ready for withdrawal</p>
                            </div>
                            <div style={{ backgroundColor: '#6366f1', color: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                                <div style={{ fontSize: '1rem', opacity: 0.9 }}>Escrow Balance</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', marginTop: '0.5rem' }}>₹{wallet.escrowBalance.toLocaleString()}</div>
                                <p style={{ fontSize: '0.85rem', marginTop: '1rem', opacity: 0.8 }}>Waiting for retailer confirmation</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Proof Modal */}
            {showProofModal && (
              <div style={modalOverlayStyle}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', width: '450px', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Confirm Delivery 📦</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Upload proof to complete Order #{currentProofOrder.order?.id}.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    
                    {/* Snap Parcel Section */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>1. Parcel Image</label>
                        {!photoPreview ? (
                            <label style={{ ...uploadPlaceholderStyle, cursor: 'pointer' }}>
                                <Camera size={24} />
                                <span>Snap or Upload Photo</span>
                                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} />
                            </label>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <img src={photoPreview} alt="Proof" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '16px' }} />
                                <button onClick={() => { setPhotoPreview(null); setDeliveryPhoto(null); }} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>
                        )}
                    </div>

                    {/* Signature Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>2. e-Signature</label>
                            <button onClick={clearSignature} style={{ fontSize: '0.7rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Clear</button>
                        </div>
                        <canvas 
                            ref={canvasRef}
                            width={380}
                            height={120}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            style={{ backgroundColor: '#f9fafb', border: '1px solid var(--border-color)', borderRadius: '12px', width: '100%', touchAction: 'none' }}
                        />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        disabled={isSubmittingProof}
                        onClick={() => { setShowProofModal(false); setPhotoPreview(null); setDeliveryPhoto(null); }} 
                        style={{ flex: 1, padding: '14px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '14px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={isSubmittingProof}
                        onClick={submitProof} 
                        style={{ 
                            flex: 1.5, ...successButtonStyle, padding: '14px', borderRadius: '14px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            opacity: isSubmittingProof ? 0.7 : 1 
                        }}
                    >
                        {isSubmittingProof ? 'Processing...' : 'Finish Trip'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && selectedInvoiceOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white', width: '850px', maxWidth: '95%', borderRadius: '24px',
                        padding: '1.5rem', maxHeight: '95vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <button onClick={() => setShowInvoiceModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-tertiary)', zIndex: 10 }}>&times;</button>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                            <InvoiceTemplate id="invoice-content" order={selectedInvoiceOrder} role="TRANSPORTER" />
                        </div>

                        <button
                            onClick={downloadInvoicePDF}
                            style={{
                                width: '220px', padding: '1rem', backgroundColor: '#10b981', color: 'white',
                                border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', marginBottom: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                            Download PDF
                        </button>
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

