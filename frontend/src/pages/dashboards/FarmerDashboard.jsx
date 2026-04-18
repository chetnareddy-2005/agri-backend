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
        
        try {
            const res = await fetch(url, { ...options, headers, credentials: 'include' });
            console.log(`[API Debug] ${url} - Status: ${res.status}`);
            
            if (res.status === 401) {
                console.warn(`[Auth Fallback] 401 Unauthorized detected for ${url}. Redirecting to landing page.`);
                handleUnauthorized();
            }
            return res;
        } catch (err) {
            console.error(`[API Debug] Fetch error for ${url}:`, err);
            throw err;
        }
    };

    const [user, setUser] = useState(null);
    const [myOrders, setMyOrders] = useState([]);
    const [myListings, setMyListings] = useState([]);
    // productBids removed as highestBid is now in product object
    const [stats, setStats] = useState({ listings: 0, totalSales: 0, pendingOrders: 0 });
    const [riskLevel, setRiskLevel] = useState(localStorage.getItem('auth_risk_level') || 'LOW');
    const [wallet, setWallet] = useState({ availableBalance: 0, escrowBalance: 0 });

    const handleUnauthorized = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
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
        const token = localStorage.getItem('auth_token');
        
        if (!storedUser || !token) {
            console.warn("[Auth Guard] Missing user or token in localStorage. Redirecting to login.");
            navigate('/login');
            return;
        }

        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("[Auth Guard] Failed to parse user data", e);
            handleUnauthorized();
            return;
        }

        // fetchStats(); // Removed as stats are now calculated dynamically
        fetchReceivedOrders();
        fetchUserProfile();
        fetchWallet();

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
                console.warn("Unauthorized access to received-orders");
                handleUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched orders:", data.length);
                setMyOrders(data);
            } else {
                const errorText = await res.text();
                console.error(`Failed to fetch orders: ${res.status} - ${errorText}`);
            }
        } catch (error) {
            console.error("Error fetching received orders:", error);
        }
    };

    const fetchMyListings = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/products/my-products`, { credentials: 'include' });
            if (res.status === 401) {
                console.warn("Unauthorized access to my-products");
                handleUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched listings:", data.length);
                setMyListings(data);
            } else {
                const errorText = await res.text();
                console.error(`Failed to fetch listings: ${res.status} - ${errorText}`);
            }
        } catch (error) {
            console.error("Error fetching my listings:", error);
        }
    };

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Help/Complaint State
    const [myComplaints, setMyComplaints] = useState([]);
    const [showHelpModal, setShowHelpModal] = useState(false); // For creating new complaint
    const [newComplaintMsg, setNewComplaintMsg] = useState('');
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [chatReply, setChatReply] = useState('');

    // Feedback State
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
        // Mark as read if not already
        if (!notification.read && !notification.isRead) {
            try {
                await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/notifications/${notification.id}/read`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                // Update local state
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Error marking notification read:", error);
            }
        }

        if ((notification.type === 'complaint_reply' || notification.type === 'info') && notification.relatedEntityId) {
            setActiveTab('Help');
            try {
                // Fetch all my complaints to find the right one (or use specific endpoint if available)
                const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/complaints/my-complaints`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setMyComplaints(data);
                    const targetComplaint = data.find(c => c.id === notification.relatedEntityId);
                    if (targetComplaint) {
                        handleOpenChat(targetComplaint);
                    }
                }
            } catch (error) {
                console.error("Error fetching complaint for notification:", error);
            }
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
                // Handle both 'read' and 'isRead' properties just in case
                setUnreadCount(data.filter(n => !(n.read || n.isRead)).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/notifications/mark-all-read`, {
                method: 'PUT',
                credentials: 'include'
            });
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all read:", error);
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

    const handleCreateComplaint = async () => {
        if (!newComplaintMsg.trim()) return;
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/complaints/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newComplaintMsg }),
                credentials: 'include'
            });
            if (res.ok) {
                alert("Issue reported successfully.");
                setShowHelpModal(false);
                setNewComplaintMsg('');
                fetchMyComplaints();
            } else {
                alert("Failed to report issue");
            }
        } catch (error) {
            console.error("Error creating complaint:", error);
        }
    };

    const handleOpenChat = (complaint) => {
        setSelectedComplaint(complaint);
        setChatReply('');
        setShowChatModal(true);
    };

    const handleSendReply = async () => {
        if (!chatReply.trim() || !selectedComplaint) return;
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/complaints/${selectedComplaint.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: chatReply }),
                credentials: 'include'
            });
            if (res.ok) {
                const newReply = await res.json();
                const updatedComplaint = { ...selectedComplaint };
                if (!updatedComplaint.responses) updatedComplaint.responses = [];
                updatedComplaint.responses.push(newReply);
                setSelectedComplaint(updatedComplaint);
                setChatReply('');
                fetchMyComplaints();
            } else {
                alert("Failed to send reply");
            }
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'Notifications') {
            fetchNotifications();
        }
        // Poll for notifications regardless of tab to update counter
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [activeTab]);

    // Calculate Stats & Charts Data dynamically
    useEffect(() => {
        // 1. KPI Stats
        const listingsCount = myListings.length;
        const totalSalesVal = myOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const pendingCount = myOrders.filter(o => o.status === 'PENDING').length;

        setStats({
            listings: listingsCount,
            totalSales: totalSalesVal.toLocaleString('en-IN'),
            pendingOrders: pendingCount
        });

        // 2. Mix Data (Listings by Category)
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
        // If empty, show placeholder
        setMixData(newMixData.length > 0 ? newMixData : [{ name: 'No Data', value: 1, color: '#E5E7EB' }]);
    }, [myListings, myOrders]); // Re-run when data changes

    useEffect(() => {
        fetchMonthlySales();
    }, []);

    const fetchMonthlySales = async () => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/stats/farmer/monthly-sales`, { credentials: 'include' });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
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

    // Removed manual fetchStats as it is now a reactive effect

    const handleDeleteListing = async (productId) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                alert("Product deleted successfully");
                fetchMyListings();
            } else {
                const msg = await res.text();
                alert(`Failed to delete product: ${msg}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditListing = (product) => {
        setEditingProduct(product);
        setNewPrice(product.price);
        setShowEditPriceModal(true);
    };

    const handleUpdatePrice = async () => {
        if (!editingProduct || !newPrice) return;

        // Construct the full payload with updated price
        const payload = {
            name: editingProduct.name,
            category: editingProduct.category,
            quantity: editingProduct.quantity,
            unit: editingProduct.unit,
            price: parseFloat(newPrice),
            deliveryEstimate: editingProduct.deliveryEstimate,
            location: editingProduct.location,
            description: editingProduct.description,
            biddingStartTime: editingProduct.biddingStartTime, // Assuming these are already in correct format or don't matter for DIRECT
            biddingEndTime: editingProduct.biddingEndTime,
            imageUrls: editingProduct.imageUrls,
            listingType: editingProduct.listingType
        };

        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (res.ok) {
                alert("Price updated successfully!");
                setShowEditPriceModal(false);
                setEditingProduct(null);
                setNewPrice('');
                fetchMyListings(); // Refresh UI
            } else {
                const msg = await res.text();
                alert(`Failed to update price: ${msg}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error updating price");
        }
    };

    useEffect(() => {
        if (activeTab === 'Orders') {
            fetchReceivedOrders();
        } else if (activeTab === 'My Listings') {
            fetchMyListings();
        } else if (activeTab === 'Feedbacks') {
            fetchMyFeedbacks();
        }
    }, [activeTab]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const [showBidsModal, setShowBidsModal] = useState(false);
    const [showRetailerModal, setShowRetailerModal] = useState(false);
    const [selectedProductBids, setSelectedProductBids] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    const [editingProductId, setEditingProductId] = useState(null);

    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    // Pagination State
    const [listingsPage, setListingsPage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    // New state for Price Edit Modal
    const [showEditPriceModal, setShowEditPriceModal] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: '', category: 'Vegetables', quantity: '', unit: 'kg', price: '', deliveryEstimate: '', location: '', description: '',
        biddingStartTime: null, biddingEndTime: null, imageUrls: [], listingType: 'AUCTION'
    });

    const [listingTypeFilter, setListingTypeFilter] = useState('ALL');

    const [showBuyersModal, setShowBuyersModal] = useState(false);
    const [selectedBuyersList, setSelectedBuyersList] = useState([]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            alert("You can only upload up to 3 images.");
            return;
        }
        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        })).then(images => {
            setFormData({ ...formData, imageUrls: images });
        });
    };





    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple validation
        if (formData.listingType === 'AUCTION' && (!formData.biddingStartTime || !formData.biddingEndTime)) {
            alert("Please select both start and end times for bidding.");
            return;
        }

        // Format data for backend
        const toLocalISOString = (date) => {
            if (!date) return null;
            const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 19);
            return localISOTime;
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
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // alert(editingProductId ? "Product updated successfully" : "Product listed successfully");
                setShowSuccessAnimation(true); // Trigger animation instead of alert

                // Delay resetting form slightly so it happens behind the curtain
                setTimeout(() => {
                    setEditingProductId(null);
                    setFormData({
                        name: '', category: 'Vegetables', quantity: '', unit: 'kg', price: '',
                        deliveryEstimate: '', location: '', description: '',
                        biddingStartTime: null, biddingEndTime: null, imageUrls: [], listingType: 'AUCTION'
                    });
                    fetchMyListings(); // Refresh listings
                    // We don't switch tabs immediately - we wait for animation to end
                }, 500);
            } else {
                const errorMsg = await response.text();
                alert(`Failed to list product (Status: ${response.status}): ${errorMsg}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error connecting to server: ${err.name} - ${err.message}`);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            if (res.ok) {
                // Update local state
                setMyOrders(prevOrders => prevOrders.map(o =>
                    o.id === orderId ? { ...o, status: newStatus } : o
                ));
            } else {
                const msg = await res.text();
                alert("Failed to update status: " + msg);
            }
        } catch (e) {
            console.error("Error updating status:", e);
        }
    };

    const handleViewBids = async (product) => {
        setSelectedProduct(product);
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/bids/product/${product.id}`, { credentials: 'include' });
            if (res.ok) {
                const bids = await res.json();
                setSelectedProductBids(bids);
                setShowBidsModal(true);
            } else {
                alert("Failed to fetch bids");
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    };

    const handleAcceptBid = async (bidId) => {
        if (!confirm("Are you sure you want to accept this bid? This will close the auction and notify other bidders.")) return;
        try {
            const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/bids/accept/${bidId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                alert("Bid accepted successfully!");
                setShowBidsModal(false);
                fetchMyListings(); // Refresh listings (product might be removed or marked sold)
            } else {
                const msg = await res.text();
                alert("Failed to accept bid: " + msg);
            }
        } catch (error) {
            console.error(error);
            alert("Error accepting bid");
        }
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
            pdf.save(`Invoice_Order_${selectedInvoiceOrder.id}.pdf`);
        });
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
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)',
                                    backgroundColor: '#EF4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold',
                                    width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>

                    <NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
                    <NavItem icon={<HelpCircle size={20} />} label="Help / Messages" active={activeTab === 'Help'} onClick={() => { setActiveTab('Help'); fetchMyComplaints(); }} />
                </nav>

                <div style={{ padding: '2rem' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem',
                            backgroundColor: '#064e3b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                        }}
                    >
                        <LogOut size={18} /> Log out
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                        © FarmTrade - Tools made calm for farmers
                    </p>
                </div>
            </aside>

            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Welcome, {user?.fullName || 'Farmer'}
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Calm • Modern • Farmer-friendly</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>SECURITY STATUS</span>
                            <SmallRiskGauge risk={riskLevel} />
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                {activeTab === 'Wallet' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ backgroundColor: '#16a34a', color: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Available Balance</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>₹{wallet.availableBalance.toLocaleString()}</div>
                        </div>
                        <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Escrow Balance</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>₹{wallet.escrowBalance.toLocaleString()}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'Feedbacks' && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Customer Feedbacks ({feedbacks.length})</h3>
                        {feedbacks.length === 0 ? (
                            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>No feedbacks received yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {feedbacks.map(feedback => (
                                    <div key={feedback.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={16} fill={i < feedback.rating ? "#FFD700" : "none"} color={i < feedback.rating ? "#FFD700" : "#D1D5DB"} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{feedback.order?.product?.name}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{feedback.comment}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>- Retailer ID: {feedback.order?.retailer?.id}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Dashboard' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                            <KPICard title="Listings" value={stats.listings} subtext="Active items to sell" icon={<List size={24} color="#16a34a" />} />
                            <KPICard title="Total Sales" value={`₹${stats.totalSales}`} subtext="Units / aggregated value" icon={<ShoppingBag size={24} color="#2563eb" />} />
                            <KPICard title="Pending Orders" value={stats.pendingOrders} subtext="Awaiting your action" icon={<Bell size={24} color="#db2777" />} />
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <WeatherIntelligence role="FARMER" location={user?.city || user?.address || "Hyderabad"} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Produce mix</h3>
                                <div style={{ height: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={mixData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {mixData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem' }}>
                                    {mixData.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></span>
                                            {item.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Monthly sales (recent)</h3>
                                <div style={{ height: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Bar dataKey="sales" fill="#E5E7EB" radius={[4, 4, 0, 0]} activeBar={{ fill: '#16a34a' }} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Recent orders</h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>ID</th>
                                        <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Produce</th>
                                        <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Qty</th>
                                        <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Total</th>
                                        <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Status</th>
                                        <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myOrders.slice(0, 5).map((order) => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem 0', color: 'var(--text-primary)', fontWeight: '500' }}>{order.id}</td>
                                            <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{order.product?.name}</td>
                                            <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{order.quantity}</td>
                                            <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>₹{order.totalPrice}</td>
                                            <td style={{ padding: '1rem 0' }}>
                                                {order.status === 'DELIVERED' ? (
                                                    <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Delivered</span>
                                                ) : (
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.75rem' }}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="SHIPPED">Shipped</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 0', color: 'var(--text-tertiary)' }}>
                                                {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    {myOrders.length === 0 && (
                                        <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No recent orders.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'My Listings' && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>My Listings</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="listingFilter"
                                        value="ALL"
                                        checked={listingTypeFilter === 'ALL'}
                                        onChange={(e) => setListingTypeFilter(e.target.value)}
                                        style={{ accentColor: '#16a34a', marginRight: '4px' }}
                                    />
                                    All
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="listingFilter"
                                        value="AUCTION"
                                        checked={listingTypeFilter === 'AUCTION'}
                                        onChange={(e) => setListingTypeFilter(e.target.value)}
                                        style={{ accentColor: '#16a34a', marginRight: '4px' }}
                                    />
                                    Auction
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="listingFilter"
                                        value="DIRECT"
                                        checked={listingTypeFilter === 'DIRECT'}
                                        onChange={(e) => setListingTypeFilter(e.target.value)}
                                        style={{ accentColor: '#16a34a', marginRight: '4px' }}
                                    />
                                    Direct Sale
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {myListings
                                .filter(p => listingTypeFilter === 'ALL' || (p.listingType || 'AUCTION') === listingTypeFilter)
                                .slice((listingsPage - 1) * ITEMS_PER_PAGE, listingsPage * ITEMS_PER_PAGE)
                                .map(product => (
                                    <div key={product.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>

                                        <ProductImage productId={product.id} />

                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{product.name}</h4>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {product.quantity <= 0 ? (
                                                        <span style={{ fontWeight: '700', color: '#EF4444' }}>Out of Stock</span>
                                                    ) : (
                                                        <><span style={{ fontWeight: '600', color: '#16a34a' }}>Avail:</span> {product.quantity} {product.unit}</>
                                                    )}
                                                </div>
                                                {product.buyers && product.buyers.length > 0 && (
                                                    <div style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '600' }}>
                                                        Sold: {product.buyers.reduce((sum, b) => sum + b.quantity, 0)} {product.unit}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress Bar for Stock Utilization */}
                                            {product.buyers && product.buyers.length > 0 && (
                                                <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${(product.buyers.reduce((sum, b) => sum + b.quantity, 0) / (product.quantity + product.buyers.reduce((sum, b) => sum + b.quantity, 0))) * 100}%`,
                                                        height: '100%',
                                                        backgroundColor: '#2563EB',
                                                        transition: 'width 0.5s ease-in-out'
                                                    }}></div>
                                                </div>
                                            )}
                                        </div>

                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{product.category} • {product.location}</p>

                                        <div style={{ fontSize: '0.875rem', color: '#D97706', marginBottom: '0.5rem', fontWeight: '600' }}>
                                            {product.listingType === 'DIRECT' ? (
                                                <span style={{ color: '#16a34a' }}>Fixed Price (No Bidding)</span>
                                            ) : (
                                                <>Ends in: <CountdownTimer endTime={product.biddingEndTime} /></>
                                            )}
                                        </div>

                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>{product.description}</p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', marginBottom: '1rem' }}>
                                            <div>
                                                {product.listingType === 'DIRECT' ? (
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>
                                                        Price: ₹{product.price}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Base Price: ₹{product.price}</span>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>
                                                            Highest Bid: ₹{product.highestBid || 0}
                                                        </div>
                                                    </>
                                                )}
                                                {product.listingType === 'DIRECT' && product.buyers && product.buyers.length > 0 ? (
                                                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ fontSize: '0.9rem', color: '#2563EB', fontWeight: 'bold' }}>
                                                            Product Sold To: {product.buyers.length} Retailer{product.buyers.length > 1 ? 's' : ''}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBuyersList(product.buyers);
                                                                setShowBuyersModal(true);
                                                            }}
                                                            style={{
                                                                backgroundColor: '#E0F2FE', color: '#0369A1', border: 'none',
                                                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                                                                fontWeight: '600', cursor: 'pointer', alignSelf: 'start'
                                                            }}>
                                                            View Details
                                                        </button>
                                                    </div>
                                                ) : (
                                                    (product.winnerName || (product.buyers && product.buyers.length > 0)) && (
                                                        <div style={{
                                                            fontSize: '0.9rem', color: '#2563EB', fontWeight: 'bold',
                                                            marginTop: '4px', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: '4px'
                                                        }}>
                                                            Product Sold To: {product.winnerName || product.buyers[0].retailerName}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            {!product.available && (
                                                <div style={{
                                                    backgroundColor: '#EF4444', color: 'white', padding: '4px 8px',
                                                    borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                                }}>
                                                    SOLD
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {product.listingType !== 'DIRECT' && (
                                                <button
                                                    onClick={() => handleViewBids(product)}
                                                    style={{ flex: 1, backgroundColor: '#166534', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                                    View Bids
                                                </button>
                                            )}

                                            {product.available && product.quantity > 0 && (
                                                <button
                                                    onClick={() => handleDeleteListing(product.id)}
                                                    style={{ flex: 1, backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                                    Delete
                                                </button>
                                            )}
                                            {product.available && product.quantity > 0 && (
                                                <button
                                                    onClick={() => handleEditListing(product)}
                                                    style={{ flex: 1, backgroundColor: '#ca8a04', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {myListings.filter(p => listingTypeFilter === 'ALL' || (p.listingType || 'AUCTION') === listingTypeFilter).length === 0 && <p style={{ color: 'var(--text-tertiary)' }}>You haven't listed any products yet.</p>}
                        </div>
                        <Pagination
                            currentPage={listingsPage}
                            totalPages={Math.ceil(myListings.filter(p => listingTypeFilter === 'ALL' || (p.listingType || 'AUCTION') === listingTypeFilter).length / ITEMS_PER_PAGE)}
                            onPageChange={setListingsPage}
                        />
                    </div>
                )}

                {/* Edit Price Modal */}
                {showEditPriceModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', width: '400px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Update Price</h3>
                            <p style={{ color: 'var(--text-tertiary)' }}>Update price for <strong>{editingProduct?.name}</strong></p>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>New Price (₹)</label>
                                <input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '6px',
                                        border: '1px solid #D1D5DB', fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setShowEditPriceModal(false)}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePrice}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '6px', border: 'none',
                                        backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Notifications' && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        color: '#2563eb', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem'
                                    }}>
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {notifications.length === 0 ? (
                                <p style={{ color: 'var(--text-tertiary)' }}>No notifications.</p>
                            ) : (
                                notifications.map(notification => (
                                    <div key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: '1rem', borderRadius: '8px', border: '1px solid #F3F4F6',
                                            backgroundColor: !(notification.read || notification.isRead) ? '#F0F9FF' : 'white',
                                            display: 'flex', gap: '1rem', alignItems: 'start', cursor: 'pointer', transition: 'background-color 0.2s'
                                        }}>
                                        <div style={{
                                            minWidth: '40px', height: '40px', borderRadius: '50%',
                                            backgroundColor: notification.type === 'alert' ? '#EF4444' : '#0284C7',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                        }}>
                                            <Bell size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <h4 style={{ fontWeight: '600', color: '#111827' }}>{notification.title}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(notification.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>{notification.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Orders' && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Received Orders</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E5E7EB', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem 0' }}>Order ID</th>
                                    <th style={{ padding: '0.75rem 0' }}>Retailer</th>
                                    <th style={{ padding: '0.75rem 0' }}>Retailer Info</th>
                                    <th style={{ padding: '0.75rem 0' }}>Product</th>
                                    <th style={{ padding: '0.75rem 0' }}>Qty</th>
                                    <th style={{ padding: '0.75rem 0' }}>Total</th>
                                    <th style={{ padding: '0.75rem 0' }}>Status</th>
                                    <th style={{ padding: '0.75rem 0' }}>Payment Status</th>
                                    <th style={{ padding: '0.75rem 0' }}>Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myOrders
                                    .slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE)
                                    .map(order => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '1rem 0' }}>{order.id}</td>
                                            <td style={{ padding: '1rem 0' }}>{order.retailer?.fullName}</td>
                                            <td style={{ padding: '1rem 0' }}>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRetailer(order.retailer);
                                                        setShowRetailerModal(true);
                                                    }}
                                                    style={{
                                                        backgroundColor: '#E0F2FE', color: '#0369A1', border: 'none',
                                                        padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem',
                                                        fontWeight: '600', cursor: 'pointer'
                                                    }}>
                                                    View Details
                                                </button>
                                            </td>
                                            <td style={{ padding: '1rem 0' }}>{order.product?.name}</td>
                                            <td style={{ padding: '1rem 0' }}>{order.quantity}</td>
                                            <td style={{ padding: '1rem 0' }}>₹{order.totalPrice}</td>
                                            <td style={{ padding: '1rem 0' }}>
                                                {order.status === 'RECEIVED' ? (
                                                    <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ Received</span>
                                                ) : order.status === 'DELIVERED' ? (
                                                    <span style={{ backgroundColor: '#FEF9C3', color: '#854D0E', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>🚚 Delivered</span>
                                                ) : (
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="SHIPPED">Shipped</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 0' }}>
                                                {(order.status === 'CONFIRMED' || order.status === 'DELIVERED' || order.status === 'SHIPPED') ? (
                                                    <span style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', display: 'inline-block' }}>
                                                        Payment Done
                                                    </span>
                                                ) : (
                                                    <span style={{ backgroundColor: '#FFF7ED', color: '#C2410C', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', display: 'inline-block' }}>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 0' }}>
                                                <button
                                                    onClick={() => handleViewInvoice(order)}
                                                    style={{
                                                        backgroundColor: '#16a34a', color: 'white', border: 'none',
                                                        padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem',
                                                        fontWeight: '600', cursor: 'pointer'
                                                    }}>
                                                    View Invoice
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={ordersPage}
                            totalPages={Math.ceil(myOrders.length / ITEMS_PER_PAGE)}
                            onPageChange={setOrdersPage}
                        />
                    </div>
                )}

                {
                    activeTab === 'Profile' && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', maxWidth: '600px', margin: '0 auto' }}>
                            {/* Profile content remains same */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '100px', height: '100px', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                    {user?.fullName?.charAt(0) || 'F'}
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.fullName}</h2>
                                <p style={{ color: 'var(--text-tertiary)' }}>Farmer Account</p>
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Full Name</label>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>{user?.fullName}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Email Address</label>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>{user?.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Phone Number</label>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>{user?.mobileNumber || 'N/A'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Address</label>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>{user?.address || 'N/A'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Document</label>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ marginRight: '0.5rem' }}>📄</span>
                                            {user?.documentName ? user.documentName : 'No document uploaded'}
                                        </div>
                                        {user?.documentName && (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL}/api/users/${user.id}/document`}
                                                style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none', fontSize: '0.875rem' }}
                                            >
                                                View
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Account Status</label>
                                    <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Verified
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Retailer Details Modal */}
                {
                    showRetailerModal && selectedRetailer && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'var(--card-bg)', width: '400px', maxWidth: '90%', borderRadius: '12px',
                                padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Retailer Details</h3>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '64px', height: '64px', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {selectedRetailer.fullName?.charAt(0) || 'R'}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>{selectedRetailer.fullName}</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{selectedRetailer.businessName || 'Retailer'}</p>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>EMAIL</div>
                                        <div style={{ color: 'var(--text-primary)' }}>{selectedRetailer.email}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>PHONE</div>
                                        <div style={{ color: 'var(--text-primary)' }}>{selectedRetailer.mobileNumber || 'N/A'}</div>
                                    </div>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>ADDRESS</div>
                                        <div style={{ color: 'var(--text-primary)' }}>{selectedRetailer.address || 'N/A'}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowRetailerModal(false)}
                                    style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Add/Edit Listing Page */}
                {
                    activeTab === 'AddProduct' && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{editingProductId ? 'Edit Product' : 'List New Product'}</h3>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Product Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} placeholder="e.g., Fresh Tomatoes" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Category</label>
                                        <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                                            <option value="Vegetables">Vegetables</option>
                                            <option value="Fruits">Fruits</option>
                                            <option value="Grains">Grains</option>
                                            <option value="Pulses">Pulses</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Available Quantity</label>
                                        <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} placeholder="Total available" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Unit</label>
                                        <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} placeholder="e.g. kg, tons" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Base Price / Unit</label>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Delivery Estimate</label>
                                        <input type="text" name="deliveryEstimate" value={formData.deliveryEstimate} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} placeholder="e.g., 2 days" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} placeholder="Farm Location" />
                                </div>

                                <div style={{ paddingBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Listing Type</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div onClick={() => setFormData({ ...formData, listingType: 'AUCTION' })}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', fontWeight: '500',
                                                backgroundColor: formData.listingType === 'AUCTION' ? '#DCFCE7' : 'var(--bg-tertiary)', color: formData.listingType === 'AUCTION' ? '#166534' : 'var(--text-tertiary)', border: formData.listingType === 'AUCTION' ? '1px solid #166534' : '1px solid var(--border-color)'
                                            }}>
                                            Auction (Bidding)
                                        </div>
                                        <div onClick={() => setFormData({ ...formData, listingType: 'DIRECT' })}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', fontWeight: '500',
                                                backgroundColor: formData.listingType === 'DIRECT' ? '#DCFCE7' : 'var(--bg-tertiary)', color: formData.listingType === 'DIRECT' ? '#166534' : 'var(--text-tertiary)', border: formData.listingType === 'DIRECT' ? '1px solid #166534' : '1px solid var(--border-color)'
                                            }}>
                                            Direct Sale (Fixed Price)
                                        </div>
                                    </div>
                                </div>

                                {formData.listingType === 'AUCTION' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Bidding Start</label>
                                            <div style={{ width: '100%' }}>
                                                <DatePicker
                                                    selected={formData.biddingStartTime}
                                                    onChange={(date) => setFormData({ ...formData, biddingStartTime: date })}
                                                    showTimeSelect
                                                    dateFormat="dd/MM/yyyy h:mm aa"
                                                    timeIntervals={15}
                                                    placeholderText="Select start time"
                                                    className="custom-datepicker"
                                                    wrapperClassName="datePicker"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Bidding End</label>
                                            <div style={{ width: '100%' }}>
                                                <DatePicker
                                                    selected={formData.biddingEndTime}
                                                    onChange={(date) => setFormData({ ...formData, biddingEndTime: date })}
                                                    showTimeSelect
                                                    dateFormat="dd/MM/yyyy h:mm aa"
                                                    timeIntervals={15}
                                                    placeholderText="Select end time"
                                                    className="custom-datepicker"
                                                    wrapperClassName="datePicker"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Product Images (Max 3)</label>
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {formData.imageUrls.map((url, idx) => (
                                            <img key={idx} src={url} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}></textarea>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('My Listings')}
                                        style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 2, padding: '0.75rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {editingProductId ? 'Update Product' : 'List Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )
                }



                {/* Help / Messages Tab */}
                {
                    activeTab === 'Help' && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Help & Support</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>Track your complaints and chat with support.</p>
                                </div>
                                <button
                                    onClick={() => setShowHelpModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.75rem 1rem', backgroundColor: '#16a34a', color: 'white',
                                        border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    <Plus size={18} /> Report New Issue
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {myComplaints.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
                                        <HelpCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                        <p>No complaints or messages yet.</p>
                                    </div>
                                ) : (
                                    myComplaints.map(complaint => (
                                        <div key={complaint.id}
                                            onClick={() => handleOpenChat(complaint)}
                                            style={{
                                                backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px',
                                                border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: 'pointer', transition: 'box-shadow 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{new Date(complaint.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: '500', lineHeight: '1.5' }}>
                                                {complaint.message.replace(/^System Message:\s*/, '')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                }

                {/* View Bids Modal */}
                {
                    showBidsModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'white', width: '500px', maxWidth: '90%', borderRadius: '12px',
                                padding: '2rem', maxHeight: '90vh', overflowY: 'auto'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Bids for {selectedProduct?.name}</h3>
                                    <button onClick={() => setShowBidsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
                                </div>

                                {selectedProductBids.length === 0 ? (
                                    <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>No bids placed yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {selectedProductBids.map(bid => (
                                            <div key={bid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#16a34a' }}>₹{bid.amount}</div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>by {bid.retailer?.fullName || 'Retailer'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(bid.bidTime).toLocaleString()}</div>
                                                </div>
                                                {selectedProduct?.available && (
                                                    <button
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                        style={{ backgroundColor: '#166534', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                                        Accept
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Buyers Details Modal */}
                {
                    showBuyersModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'var(--card-bg)', width: '450px', maxWidth: '90%', borderRadius: '12px',
                                padding: '2rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Buyers List</h3>
                                    <button onClick={() => setShowBuyersModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
                                </div>

                                {selectedBuyersList.length === 0 ? (
                                    <p style={{ color: 'var(--text-tertiary)' }}>No buyer info available.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {selectedBuyersList.map((buyer, idx) => (
                                            <div key={idx} style={{
                                                padding: '1rem',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{buyer.retailerName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Retailer</div>
                                                </div>
                                                <div style={{
                                                    backgroundColor: '#DCFCE7', color: '#166534',
                                                    padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem'
                                                }}>
                                                    {buyer.quantity} kg
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowBuyersModal(false)}
                                    style={{
                                        width: '100%', marginTop: '1.5rem', padding: '0.75rem',
                                        backgroundColor: '#2563eb', color: 'white', border: 'none',
                                        borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                                    }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Invoice Modal */}
                {
                    showInvoiceModal && selectedInvoiceOrder && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'var(--card-bg)', width: '850px', maxWidth: '95%', borderRadius: '12px',
                                padding: '1rem', maxHeight: '95vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}>
                                <button onClick={() => setShowInvoiceModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-tertiary)', zIndex: 10 }}>&times;</button>

                                {/* Invoice Content to Print */}
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <InvoiceTemplate id="invoice-content" order={selectedInvoiceOrder} />
                                </div>

                                <button
                                    onClick={downloadInvoicePDF}
                                    style={{
                                        width: '200px', padding: '0.75rem', backgroundColor: '#16a34a', color: 'white',
                                        border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', marginBottom: '1rem'
                                    }}>
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* New Help/Chat Modals */}
                {
                    showHelpModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                        }}>
                            <div style={{
                                backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '450px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.25rem' }}>Report a New Issue</h3>
                                <textarea
                                    value={newComplaintMsg}
                                    onChange={(e) => setNewComplaintMsg(e.target.value)}
                                    rows="4"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}
                                    placeholder="Describe your issue..."
                                ></textarea>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setShowHelpModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={handleCreateComplaint} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Submit</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Logout Modal */}
                <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={confirmLogout} />

                {
                    showChatModal && selectedComplaint && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                            backdropFilter: 'blur(2px)'
                        }}>
                            <div style={{
                                backgroundColor: 'white', width: '600px', maxWidth: '90%', borderRadius: '16px',
                                padding: '2rem', display: 'flex', flexDirection: 'column', maxHeight: '80vh',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Support Chat</h3>
                                    <button onClick={() => setShowChatModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                    {(() => {
                                        const isSystem = selectedComplaint.isAdminInitiated || selectedComplaint.message.startsWith('System Message: ');
                                        const displayMsg = selectedComplaint.message.replace(/^System Message:\s*/, '');

                                        return (
                                            <div style={{
                                                marginBottom: '1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isSystem ? 'flex-start' : 'flex-end'
                                            }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                                    {isSystem ? 'Support' : 'You'} • {new Date(selectedComplaint.timestamp).toLocaleString()}
                                                </div>
                                                <div style={{
                                                    backgroundColor: isSystem ? '#F3F4F6' : '#DBEAFE',
                                                    color: isSystem ? '#1F2937' : '#1E40AF',
                                                    padding: '0.75rem',
                                                    borderRadius: isSystem ? '12px 12px 12px 0' : '12px 12px 0 12px',
                                                    display: 'inline-block',
                                                    maxWidth: '80%'
                                                }}>
                                                    {displayMsg}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {selectedComplaint.responses && selectedComplaint.responses.map(response => (
                                        <div key={response.id} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: response.responder?.role === 'ADMIN' ? 'flex-start' : 'flex-end' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                                {response.responder?.role === 'ADMIN' ? 'Support' : 'You'} • {new Date(response.timestamp).toLocaleString()}
                                            </div>
                                            <div style={{
                                                backgroundColor: response.responder?.role === 'ADMIN' ? '#F3F4F6' : '#DBEAFE',
                                                color: response.responder?.role === 'ADMIN' ? '#1F2937' : '#1E40AF',
                                                padding: '0.75rem',
                                                borderRadius: response.responder?.role === 'ADMIN' ? '12px 12px 12px 0' : '12px 12px 0 12px',
                                                display: 'inline-block',
                                                maxWidth: '80%'
                                            }}>
                                                {response.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <textarea
                                        value={chatReply}
                                        onChange={(e) => setChatReply(e.target.value)}
                                        placeholder="Type your reply..."
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', resize: 'none' }}
                                        rows="1"
                                    ></textarea>
                                    <button
                                        onClick={handleSendReply}
                                        style={{
                                            padding: '0 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a',
                                            color: 'white', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Success Animation Overlay */}
                <SuccessOverlay show={showSuccessAnimation} onAnimationEnd={() => { setShowSuccessAnimation(false); setActiveTab('My Listings'); }} />
            </main >
        </div >
    );
};

// Sub-components for cleaner code

// Sub-components for cleaner code
const NavItem = ({ icon, label, active }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
        marginBottom: '0.5rem', borderRadius: '8px', cursor: 'pointer',
        backgroundColor: active ? '#DCFCE7' : 'transparent',
        color: active ? '#166534' : '#4B5563',
        fontWeight: active ? '600' : '400'
    }}>
        {icon}
        <span>{label}</span>
    </div>
);

const KPICard = ({ title, value, subtext, icon }) => (
    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', fontWeight: '500' }}>{title}</h4>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{subtext}</p>
        </div>
        {icon && <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>{icon}</div>}
    </div>
);

const StatusBadge = ({ status }) => {
    let bg = '#F3F4F6';
    let color = 'var(--text-secondary)';

    if (status === 'Pending') { bg = '#FEF3C7'; color = '#D97706'; }
    if (status === 'Shipped') { bg = '#DBEAFE'; color = '#1D4ED8'; }
    if (status === 'Delivered') { bg = '#DCFCE7'; color = '#15803D'; }

    return (
        <span style={{ backgroundColor: bg, color: color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
            {status}
        </span>
    );
};

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft("EXPIRED");
                clearInterval(interval);
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    return <span style={{ color: '#D97706', fontWeight: 'bold' }}>{timeLeft}</span>;
};

const SuccessOverlay = ({ show, onAnimationEnd }) => {
    const [step, setStep] = useState('IDLE'); // IDLE, ENTERING, SHOW_MESSAGE, EXITING

    useEffect(() => {
        if (show) {
            setStep('ENTERING');

            // 1. Bars enter (approx 500ms + 400ms stagger = 900ms)
            const enterTimer = setTimeout(() => {
                setStep('SHOW_MESSAGE');
            }, 900);

            // 2. Show message for 1s -> Start Exit
            const messageTimer = setTimeout(() => {
                setStep('EXITING');
            }, 2000); // 900ms + 1100ms (slightly > 1s for read)

            // 3. Exit complete (500ms + 400ms stagger = 900ms) -> Callback
            const exitTimer = setTimeout(() => {
                onAnimationEnd();
                setStep('IDLE');
            }, 3000); // Total duration approx 3s

            return () => {
                clearTimeout(enterTimer);
                clearTimeout(messageTimer);
                clearTimeout(exitTimer);
            };
        }
    }, [show, onAnimationEnd]);

    if (!show && step === 'IDLE') return null;

    // Generate 5 bars
    const bars = Array.from({ length: 5 });

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 9999, pointerEvents: 'none', display: 'flex'
        }}>
            {bars.map((_, i) => (
                <div key={i} style={{
                    flex: 1,
                    height: '100%',
                    backgroundColor: '#58b77bff',
                    transform: step === 'IDLE' || step === 'EXITING' ? 'translateY(-100%)' : 'translateY(0)',
                    transition: 'transform 0.5s ease-in-out',
                    transitionDelay: step === 'ENTERING' ? `${i * 0.1}s` : // Stagger in (0.0, 0.1, 0.2...)
                        step === 'EXITING' ? `${(bars.length - 1 - i) * 0.1}s` : '0s' // Stagger out reverse
                }} />
            ))}

            {/* Content Centered - Only visible when bars are full */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                textAlign: 'center', color: 'white', zIndex: 10000,
                opacity: step === 'SHOW_MESSAGE' ? 1 : 0,
                transition: 'opacity 0.3s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{
                    backgroundColor: 'white', borderRadius: '50%', width: '80px', height: '80px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '2.5rem', color: '#16a34a', fontWeight: 'bold' }}>✓</div>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Success!</h2>
                <p style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Product Listed Successfully</p>
            </div>
        </div>
    );
};

export default FarmerDashboard;

