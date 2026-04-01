import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/global.css';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TransporterDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [availableRequests, setAvailableRequests] = useState([]);
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [location, setLocation] = useState({ lat: 0, lng: 0 });
    const [loading, setLoading] = useState(true);

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
        fetchRequests();

        // Start location tracking
        const locInterval = setInterval(updateLocation, 10000); // every 10 sec
        return () => clearInterval(locInterval);
    }, [navigate]);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/available`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableRequests(data);
            }

            // Also fetch active deliveries
            const activeRes = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/my-deliveries`, {
                credentials: 'include'
            });
            if (activeRes.ok) {
                const activeData = await activeRes.json();
                setActiveDeliveries(activeData);
            }
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
                
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/api/transport/location`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ lat, lng })
                    });
                } catch (e) {
                    console.error("Failed to update location");
                }
            });
        }
    };

    const acceptRequest = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/${id}/accept`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (res.ok) {
                alert('Request Accepted! Tracking started.');
                fetchRequests();
            }
        } catch (e) {
            console.error(e);
            alert("Error accepting request");
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
            if (res.ok) {
                alert(`Status updated to ${newStatus}`);
                setActiveDeliveries(activeDeliveries.map(req => 
                    req.id === id ? { ...req, status: newStatus } : req
                ));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading || !user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>;

    return (
        <div style={{ backgroundColor: '#f0fdf4', minHeight: '100vh' }}>
            {/* Navbar */}
            <nav style={{ backgroundColor: '#166534', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>🚚 Transporter Dashboard</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>{user.fullName} | {user.businessName}</span>
                    <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
                </div>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Left Column: Requests & Deliveries */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ borderBottom: '2px solid #22c55e', paddingBottom: '0.5rem', color: '#166534' }}>📍 Live GPS Tracking</h3>
                        <p><strong>Current Location:</strong> Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Location is automatically shared with accepted deliveries every 10 seconds.</p>
                        
                        <div style={{ width: '100%', height: '300px', backgroundColor: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                            {location.lat !== 0 ? (
                                <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[location.lat, location.lng]}>
                                        <Popup>🚚 Your Current Location</Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                                    Waiting for GPS Signal...
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ color: '#166534' }}>📋 Active Deliveries</h3>
                        {activeDeliveries.length === 0 ? <p>No active deliveries.</p> : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {activeDeliveries.map(req => (
                                    <div key={req.id} style={{ border: '1px solid #d1d5db', padding: '1rem', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                                        <p><strong>Order ID:</strong> #{req.order?.id}</p>
                                        <p><strong>Route Distance:</strong> {req.distanceKm} km | <strong>Earnings:</strong> Rs. {req.price?.toFixed(2)}</p>
                                        <p><strong>Status:</strong> <span style={{ backgroundColor: '#fef08a', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{req.status}</span></p>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                            {req.status === 'ACCEPTED' && <button onClick={() => updateStatus(req.id, 'IN_TRANSIT')} style={{ padding: '0.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark In Transit</button>}
                                            {req.status === 'IN_TRANSIT' && <button onClick={() => updateStatus(req.id, 'DELIVERED')} style={{ padding: '0.5rem', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Delivered</button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Available Requests */}
                <div>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: '#166534' }}>🚚 Available Requests</h3>
                            <button onClick={fetchRequests} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🔄</button>
                        </div>
                        {availableRequests.length === 0 ? <p>No new transporter requests.</p> : (
                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                {availableRequests.map(req => (
                                    <div key={req.id} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '8px' }}>
                                        <p><strong>Distance:</strong> {req.distanceKm} km</p>
                                        <p><strong>Proposed Price:</strong> Rs. {req.price?.toFixed(2)}</p>
                                        <p><strong>Suggested Vehicle:</strong> {req.suggestedVehicle}</p>
                                        <button onClick={() => acceptRequest(req.id)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Accept Request</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransporterDashboard;
