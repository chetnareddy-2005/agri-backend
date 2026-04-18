import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LayoutDashboard, ShoppingBag, List, User, LogOut, Plus, ChevronRight, Bell, HelpCircle, Star, Wallet } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ProductImage from '../../components/ProductImage';
import InvoiceTemplate from '../../components/InvoiceTemplate';
import '../../styles/global.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ThemeToggle from '../../components/ThemeToggle';
import LogoutModal from '../../components/LogoutModal';
import Pagination from '../../components/Pagination';
import WeatherIntelligence from './WeatherIntelligence';
import SmallRiskGauge from '../../components/SmallRiskGauge';

const FarmerDashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    // Default to 'Dashboard' if no tab param exists
    const activeTab = searchParams.get('tab') || 'Dashboard';

    // Helper to update URL when tab changes
    const setActiveTab = (tabName) => {
        setSearchParams({ tab: tabName });
    };

    const fetchWithAuth = async (url, options = {}) => {
        const authToken = localStorage.getItem('auth_token');
        const headers = {
            ...options.headers,
            'X-Auth-Token': authToken || ''
        };
        return fetch(url, { ...options, headers, credentials: 'include' });
    };

    const [user, setUser] = useState(null);
    const [myOrders, setMyOrders] = useState([]);
    const [myListings, setMyListings] = useState([]);
    const [stats, setStats] = useState({ listings: 0, totalSales: 0, pendingOrders: 0 });
    const [riskLevel, setRiskLevel] = useState(localStorage.getItem('auth_risk_level') || 'LOW');
    const [wallet, setWallet] = useState({ availableBalance: 0, escrowBalance: 0 });

    const handleUnauthorized = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_risk_level');
        navigate('/');
    };

    const fetchUserProfile = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/users/profile`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    };

    const fetchWallet = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/wallet/balance`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (error) {
            console.error("Error fetching wallet:", error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchReceivedOrders();
        fetchUserProfile();
        fetchWallet();

        // Check local storage for risk level (set by RiskChallenge/BehaviorCapture)
        const riskInterval = setInterval(() => {
            setRiskLevel(localStorage.getItem('auth_risk_level') || 'LOW');
        }, 2000);

        return () => clearInterval(riskInterval);
    }, []);

    // Polling for real-time updates
    useEffect(() => {
        fetchMyListings(); // Initial fetch
        fetchUserProfile();
        fetchReceivedOrders();
        fetchWallet();
        
        const intervalId = setInterval(() => {
            fetchMyListings();
            fetchUserProfile();
            fetchReceivedOrders();
            fetchWallet();
        }, 5000); 

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    const fetchReceivedOrders = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/orders/received-orders`, { credentials: 'include' });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setMyOrders(data);
            }
        } catch (error) {
            console.error("Error fetching received orders:", error);
        }
    };

    const fetchMyListings = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/products/my-products`, { credentials: 'include' });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setMyListings(data);
            }
        } catch (error) {
            console.error("Error fetching my listings:", error);
        }
    };

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [myComplaints, setMyComplaints] = useState([]);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [newComplaintMsg, setNewComplaintMsg] = useState('');
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [chatReply, setChatReply] = useState('');
    const [feedbacks, setFeedbacks] = useState([]);

    const fetchMyFeedbacks = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/feedback/received`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data);
            }
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read && !notification.isRead) {
            try {
                await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/notifications/${notification.id}/read`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Error marking notification read:", error);
            }
        }
        if ((notification.type === 'complaint_reply' || notification.type === 'info') && notification.relatedEntityId) {
            setActiveTab('Help');
            fetchMyComplaints();
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/notifications/my-notifications`, { credentials: 'include' });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !(n.read || n.isRead)).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const fetchMyComplaints = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/complaints/my-complaints`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMyComplaints(data);
            }
        } catch (error) {
            console.error("Error fetching my complaints:", error);
        }
    };

    useEffect(() => {
        // KPI Stats
        const listingsCount = myListings.length;
        const totalSalesVal = myOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const pendingCount = myOrders.filter(o => o.status === 'PENDING').length;

        setStats({
            listings: listingsCount,
            totalSales: totalSalesVal.toLocaleString('en-IN'),
            pendingOrders: pendingCount
        });

        // Produce Mix
        const categoryCounts = {};
        myListings.forEach(p => {
            const cat = p.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const newMixData = Object.keys(categoryCounts).map((cat, index) => ({
            name: cat,
            value: categoryCounts[cat],
            color: ['#16a34a', '#ca8a04', '#2563eb', '#9333ea', '#db2777'][index % 5]
        }));
        setMixData(newMixData.length > 0 ? newMixData : [{ name: 'No Data', value: 1, color: '#E5E7EB' }]);
    }, [myListings, myOrders]);

    useEffect(() => {
        fetchMonthlySales();
    }, []);

    const fetchMonthlySales = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/stats/farmer/monthly-sales`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setSalesData(data);
            }
        } catch (error) {
            console.error("Error fetching monthly sales:", error);
        }
    };

    const [mixData, setMixData] = useState([]);
    const [salesData, setSalesData] = useState([]);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [showEditPriceModal, setShowEditPriceModal] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '', category: 'Vegetables', quantity: '', unit: 'kg', price: '', deliveryEstimate: '', location: '', description: '',
        biddingStartTime: null, biddingEndTime: null, imageUrls: [], listingType: 'AUCTION'
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toLocalISOString = (date) => {
            if (!date) return null;
            const offset = date.getTimezoneOffset() * 60000;
            return (new Date(date.getTime() - offset)).toISOString().slice(0, 19);
        };

        const payload = {
            ...formData,
            quantity: parseFloat(formData.quantity),
            price: parseFloat(formData.price),
            biddingStartTime: toLocalISOString(formData.biddingStartTime),
            biddingEndTime: toLocalISOString(formData.biddingEndTime)
        };

        try {
            const url = editingProductId
                ? `${import.meta.env.VITE_API_URL}/api/products/${editingProductId}`
                : `${import.meta.env.VITE_API_URL}/api/products/add`;
            const method = editingProductId ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowSuccessAnimation(true);
                setTimeout(() => {
                    setEditingProductId(null);
                    setFormData({
                        name: '', category: 'Vegetables', quantity: '', unit: 'kg', price: '',
                        deliveryEstimate: '', location: '', description: '',
                        biddingStartTime: null, biddingEndTime: null, imageUrls: [], listingType: 'AUCTION'
                    });
                    fetchMyListings();
                }, 500);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const NavItem = ({ icon, label, active, onClick }) => (
        <div onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
            borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem',
            backgroundColor: active ? '#DCFCE7' : 'transparent',
            color: active ? '#166534' : 'var(--text-secondary)',
            fontWeight: active ? '600' : '500'
        }}>
            {icon} {label}
        </div>
    );

    const KPICard = ({ title, value, subtext, icon }) => (
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '12px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{subtext}</div>
            </div>
        </div>
    );

    return (
        <div className="farmer-dashboard-root" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)' }}>
            <aside style={{ width: '250px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '1.2rem' }}>F</span>
                        Farm2Trade
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#15803d', marginLeft: '38px', fontStyle: 'italic', marginBottom: '4px' }}>easy to connect...</span>
                    <div style={{ fontSize: '0.9rem', color: '#16a34a', marginLeft: '38px', fontWeight: '500' }}>Farmer</div>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
                    <NavItem icon={<List size={20} />} label="My Listings" active={activeTab === 'My Listings'} onClick={() => setActiveTab('My Listings')} />
                    <NavItem icon={<Plus size={20} />} label="Add Listing" active={activeTab === 'AddProduct'} onClick={() => {
                        setEditingProductId(null);
                        setFormData({
                            name: '', category: 'Vegetables', quantity: '', unit: 'kg', price: '',
                            deliveryEstimate: '', location: '', description: '',
                            biddingStartTime: null, biddingEndTime: null, imageUrls: [], listingType: 'AUCTION'
                        });
                        setActiveTab('AddProduct');
                    }} />
                    <NavItem icon={<ShoppingBag size={20} />} label="Received Orders" active={activeTab === 'Orders'} onClick={() => setActiveTab('Orders')} />
                    <NavItem icon={<Wallet size={20} />} label="Wallet" active={activeTab === 'Wallet'} onClick={() => setActiveTab('Wallet')} />
                    <NavItem icon={<Star size={20} />} label="Feedbacks" active={activeTab === 'Feedbacks'} onClick={() => { setActiveTab('Feedbacks'); fetchMyFeedbacks(); }} />
                    <div onClick={() => setActiveTab('Notifications')}>
                        <div style={{ position: 'relative' }}>
                            <NavItem icon={<Bell size={20} />} label="Notifications" active={activeTab === 'Notifications'} />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </div>
                    </div>
                    <NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
                    <NavItem icon={<HelpCircle size={20} />} label="Help / Messages" active={activeTab === 'Help'} onClick={() => { setActiveTab('Help'); fetchMyComplaints(); }} />
                </nav>

                <div style={{ padding: '2rem' }}>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} /> Log out
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>© FarmTrade - 2026</p>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Welcome, {user?.fullName || 'Farmer'}</h1>
                        <p style={{ color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Secure • Modern • Farmer-friendly</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>SECURITY STATUS</span>
                            <SmallRiskGauge risk={riskLevel} />
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                {activeTab === 'Dashboard' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                            <KPICard title="Listings" value={stats.listings} subtext="Active items" icon={<List size={24} color="#16a34a" />} />
                            <KPICard title="Total Sales" value={`₹${stats.totalSales}`} subtext="Units sold" icon={<ShoppingBag size={24} color="#2563eb" />} />
                            <KPICard title="Available" value={`₹${wallet.availableBalance}`} subtext="Can withdraw" icon={<Wallet size={24} color="#ca8a04" />} />
                            <KPICard title="Escrow" value={`₹${wallet.escrowBalance}`} subtext="Locked funds" icon={<Wallet size={24} color="#db2777" />} />
                        </div>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <WeatherIntelligence role="ROLE_FARMER" location={user?.city || "Hyderabad"} />
                        </div>
                        {/* Charts and Tables... */}
                    </>
                )}
            </main>
        </div>
    );
};

export default FarmerDashboard;
