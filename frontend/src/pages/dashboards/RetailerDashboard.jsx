import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { LayoutDashboard, ShoppingBag, User, LogOut, Package, HelpCircle, ChevronRight, Plus, Bell } from 'lucide-react';
import ProductImage from '../../components/ProductImage';
import ImageCarouselModal from '../../components/ImageCarouselModal';
import InvoiceTemplate from '../../components/InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../../styles/global.css';
import ThemeToggle from '../../components/ThemeToggle';
import LogoutModal from '../../components/LogoutModal';
import FeedbackModal from '../../components/FeedbackModal';
import Pagination from '../../components/Pagination';
import WeatherIntelligence from './WeatherIntelligence';
import SmallRiskGauge from '../../components/SmallRiskGauge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RetailerDashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'Dashboard';

    const setActiveTab = (tabName) => {
        setSearchParams({ tab: tabName });
    };

    const fetchWithAuth = async (url, options = {}) => {
        const authToken = localStorage.getItem('auth_token');
        const headers = {
            ...options.headers,
            'X-Auth-Token': authToken || ''
        };
        const res = await fetch(url, { ...options, headers, credentials: 'include' });
        if (res.status === 401) {
            localStorage.clear();
            navigate('/');
        }
        return res;
    };

    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [riskLevel, setRiskLevel] = useState(localStorage.getItem('auth_risk_level') || 'LOW');
    const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, deliveredOrders: 0 });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchProducts();
        fetchStats();
        fetchMyOrders();
        fetchNotifications();

        const riskInterval = setInterval(() => {
            setRiskLevel(localStorage.getItem('auth_risk_level') || 'LOW');
        }, 2000);

        return () => clearInterval(riskInterval);
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/products/all`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`);
            if (res.ok) {
                const data = await res.json();
                setMyOrders(data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/stats/dashboard`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/notifications/my-notifications`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !(n.read || n.isRead)).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const NavItem = ({ icon, label, active }) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
            borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem',
            backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: 'white',
            fontWeight: active ? '600' : '500'
        }}>
            {icon} {label}
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)' }}>
            <aside style={{ width: '250px', backgroundColor: '#2E7D32', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>F</span>
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Farm2Trade</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginLeft: '62px', fontStyle: 'italic' }}>Retailer</span>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <div onClick={() => setActiveTab('Dashboard')}><NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} /></div>
                    <div onClick={() => setActiveTab('Orders')}><NavItem icon={<ShoppingBag size={20} />} label="Orders" active={activeTab === 'Orders'} /></div>
                    <div onClick={() => setActiveTab('Marketplace')}><NavItem icon={<Package size={20} />} label="Marketplace" active={activeTab === 'Marketplace'} /></div>
                    <div onClick={() => setActiveTab('Notifications')}>
                        <div style={{ position: 'relative' }}>
                            <NavItem icon={<Bell size={20} />} label="Notifications" active={activeTab === 'Notifications'} />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </div>
                    </div>
                    <div onClick={() => setActiveTab('Help')}><NavItem icon={<HelpCircle size={20} />} label="Help" active={activeTab === 'Help'} /></div>
                </nav>
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <header style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Welcome, {user?.fullName || 'Retailer'}</h1>
                    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: "600", fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>SECURITY STATUS</span>
                            <SmallRiskGauge risk={riskLevel} />
                        </div>
                        <ThemeToggle />
                        <button onClick={handleLogout} className="logout-btn">Log out</button>
                    </div>
                </header>

                <main style={{ padding: '2rem' }}>
                    {activeTab === 'Dashboard' && (
                        <>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <WeatherIntelligence role="ROLE_RETAILER" location={user?.city || "Hyderabad"} />
                            </div>
                            {/* Analytics and Product list... */}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default RetailerDashboard;
