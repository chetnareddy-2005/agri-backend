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

// Haversine formula for distance
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

const RetailerDashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    // Default to 'Dashboard' if no tab param exists
    const activeTab = searchParams.get('tab') || 'Dashboard';

    // Helper to update URL when tab changes
    const setActiveTab = (tabName) => {
        setSearchParams({ tab: tabName });
    };

    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [filters, setFilters] = useState({ category: '', maxPrice: '', location: '', searchMode: 'products', searchQuery: '', selectedFarmer: null });
    const [highestBids, setHighestBids] = useState({});
    const [myBids, setMyBids] = useState({}); // productId -> bidAmount
    const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, deliveredOrders: 0 });
    const [infoModal, setInfoModal] = useState({ show: false, title: '', content: '' });
    const [selectedImageProduct, setSelectedImageProduct] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [riskLevel, setRiskLevel] = useState(localStorage.getItem('auth_risk_level') || 'LOW');
    const [filteredOrderStatus, setFilteredOrderStatus] = useState(null);

    // Pagination State
    const [productsPage, setProductsPage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);
    const ITEMS_PER_PAGE = 8;
    
    // Tracking State
    const [showTracking, setShowTracking] = useState(false);
    const [trackingData, setTrackingData] = useState(null);

    // Help / Chat State
    const [myComplaints, setMyComplaints] = useState([]);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [newComplaintMsg, setNewComplaintMsg] = useState('');
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [chatReply, setChatReply] = useState('');

    const fetchMyComplaints = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/my-complaints`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMyComplaints(data);
            }
        } catch (error) {
            console.error("Error fetching complaints:", error);
        }
    };

    const handleCreateComplaint = async () => {
        if (!newComplaintMsg.trim()) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newComplaintMsg }),
                credentials: 'include'
            });
            if (res.ok) {
                alert("Complaint submitted successfully");
                setNewComplaintMsg('');
                setShowHelpModal(false);
                fetchMyComplaints();
            } else {
                alert("Failed to submit");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenChat = (complaint) => {
        setSelectedComplaint(complaint);
        setShowChatModal(true);
        // Mark as read logic if any (currently handled simply by viewing)
    };

    const handleSendReply = async () => {
        if (!chatReply.trim() || !selectedComplaint) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/${selectedComplaint.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: chatReply }),
                credentials: 'include'
            });
            if (res.ok) {
                setChatReply('');
                // Refresh the specific thread
                const updatedComplaint = await res.json();
                setSelectedComplaint(updatedComplaint);
                fetchMyComplaints(); // Refresh list to show latest timestamp/status if needed
            } else {
                alert("Failed to send reply");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchProducts();
        fetchStats();
        fetchMyOrders();
        fetchMyBids();
        fetchNotifications();
    }, []);

    // Polling for real-time market updates (Inventory, Bids)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchProducts();
            // We could also poll notifications or stats if needed
            fetchNotifications();
        }, 5000); // 5 seconds

        const riskInterval = setInterval(() => {
            setRiskLevel(localStorage.getItem('auth_risk_level') || 'LOW');
        }, 2000);
        return () => {
            clearInterval(interval);
            clearInterval(riskInterval);
        };
    }, []);

    // ... fetchProducts ...

    useEffect(() => {
        if (products.length > 0) {
            products.forEach(p => fetchHighestBid(p.id));
        }
    }, [products]);

    // Payment Verification Effect
    const hasVerifiedPayment = React.useRef(false);
    useEffect(() => {
        // Run only once on mount or when order_id appears
        const orderId = searchParams.get('order_id');
        if (orderId && !hasVerifiedPayment.current) {
            hasVerifiedPayment.current = true;
            console.log("Verifying payment for:", orderId);
            verifyPayment(orderId, true);
        }
    }, [searchParams]);

    const verifyPayment = async (orderId, isAuto = false) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
                credentials: 'include'
            });
            if (res.ok) {
                console.log("Payment Verified Successfully");
                // Don't alert on auto to prevent blocking render
                if (!isAuto) alert("Payment Successful!");
                if (!isAuto) alert("Payment Successful!");
                fetchMyOrders();
                fetchNotifications();
            } else {
                console.warn("Payment verification failed");
                if (!isAuto) alert("Payment Verification Failed. Please contact support if amount was deducted.");
            }
        } catch (error) {
            console.error("Error verifying payment:", error);
        }
    };

    const handlePayment = async (order, type = 'PRODUCT') => {
        if (!window.Cashfree) {
            alert("Payment SDK not loaded yet. Please refresh.");
            return;
        }
        const cashfree = new window.Cashfree({ mode: "sandbox" });

        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};

            const amount = type === 'PRODUCT' ? (order.totalPrice || 0) : (order.transport?.updatedPrice || 0);
            if (amount <= 0) {
                alert("Amount must be greater than zero.");
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    customerId: String(user.id || 'guest'),
                    customerPhone: user.mobileNumber || "9999999999",
                    customerName: user.fullName || "Guest",
                    orderId: `${order.id}_${type}` // e.g. 19_PRODUCT or 19_LOGISTICS
                }),
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                cashfree.checkout({
                    paymentSessionId: data.payment_session_id,
                    returnUrl: `${window.location.origin}${window.location.pathname}#/payment-success?order_id=${data.order_id}`
                });
            } else {
                const msg = await res.text();
                alert("Failed to initiate payment: " + msg);
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Error initiating payment.");
        }
    };

    // ... fetchHighestBid ...

    const fetchMyBids = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/my-bids`, { credentials: 'include' });
            if (res.ok) {
                const bids = await res.json();
                const bidMap = {};
                bids.forEach(b => {
                    // Start with 0 or check if higher? Usually we want the highest bid per product by THIS user.
                    // The list might have multiple bids for same product.
                    // Let's take the max.
                    const pid = b.product.id;
                    if (!bidMap[pid] || b.amount > bidMap[pid]) {
                        bidMap[pid] = b.amount;
                    }
                });
                setMyBids(bidMap);
            }
        } catch (error) {
            console.error("Error fetching my bids:", error);
        }
    };

    // ... fetchStats ...
    // ... fetchMyOrders ...

    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser) return;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/my-notifications`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !(n.read || n.isRead)).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/mark-all-read`, {
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

    // Feedback Logic
    const [pendingFeedbackOrders, setPendingFeedbackOrders] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentFeedbackOrder, setCurrentFeedbackOrder] = useState(null);

    const fetchPendingFeedback = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/pending`, { credentials: 'include' });
            if (res.ok) {
                const orders = await res.json();
                setPendingFeedbackOrders(orders);
                if (orders.length > 0) {
                    setCurrentFeedbackOrder(orders[0]); // Show the first one
                    setShowFeedbackModal(true);
                }
            }
        } catch (error) {
            console.error("Error fetching pending feedback:", error);
        }
    };

    useEffect(() => {
        // Check for pending feedback on mount (or after loading orders essentially)
        // Adding a small delay to not overwhelm initial load
        const timer = setTimeout(() => {
            fetchPendingFeedback();
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleFeedbackSubmit = async (orderId, rating, comment) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, rating, comment }),
                credentials: 'include'
            });

            if (res.ok) {
                alert("Thank you for your feedback!");
                setShowFeedbackModal(false);
                // Remove this order from pending list and show next if any
                const remaining = pendingFeedbackOrders.filter(o => o.id !== orderId);
                setPendingFeedbackOrders(remaining);
                if (remaining.length > 0) {
                    setCurrentFeedbackOrder(remaining[0]);
                    setShowFeedbackModal(true);
                }
            } else {
                alert("Failed to submit feedback.");
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
        }
    };

    const handleFeedbackClose = () => {
        setShowFeedbackModal(false);
        // If user skips, maybe show next? Or just close for now.
        // Let's iterate.
        if (pendingFeedbackOrders.length > 1) {
            const remaining = pendingFeedbackOrders.slice(1);
            setPendingFeedbackOrders(remaining);
            setCurrentFeedbackOrder(remaining[0]);
            setTimeout(() => setShowFeedbackModal(true), 500);
        }
    };

    // ... handlePlaceBid update to refresh myBids ...
    const handleBuyNow = async (product) => {
        const quantityStr = prompt(`Enter quantity to buy (Available: ${product.quantity} ${product.unit}):`, "1");
        if (!quantityStr) return;
        const quantity = parseFloat(quantityStr);
        if (isNaN(quantity) || quantity <= 0) {
            alert("Invalid quantity");
            return;
        }
        if (quantity > product.quantity) {
            alert(`Insufficient quantity. Max available: ${product.quantity}`);
            return;
        }

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) {
            alert("Please login first");
            return;
        }

        try {
            // Direct Order Placement (Pay later within 7 days)
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/place`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity: quantity }),
                credentials: 'include' // Important for session cookie
            });

            if (res.ok) {
                const orderData = await res.json();
                
                // Redirect to intelligent transport selection page
                navigate('/select-transport', { 
                    state: { 
                        orderId: orderData.id, 
                        product: product 
                    } 
                });

                fetchProducts();
                fetchMyOrders();
                fetchStats();
                fetchNotifications();
            } else {
                const msg = await res.text();
                alert("Failed to place order: " + msg);
            }
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Error placing order: " + error.message);
        }
    };

    const handlePlaceBid = async (productId, currentBasePrice) => {
        const currentHighest = highestBids[productId] || currentBasePrice;
        const bidAmountStr = prompt(`Current Highest Bid: ₹${currentHighest}. Enter your bid per unit (must be higher):`);
        if (!bidAmountStr) return;

        const bidAmount = parseFloat(bidAmountStr);
        if (isNaN(bidAmount) || bidAmount <= currentHighest) {
            alert(`Bid must be higher than ₹${currentHighest}`);
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/place`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, amount: bidAmount }),
                credentials: 'include'
            });

            if (res.ok) {
                alert("Bid placed successfully!");
                fetchHighestBid(productId);
                fetchMyBids(); // Refresh my bids
            } else {
                const msg = await res.text();
                alert("Failed to place bid: " + msg);
            }
        } catch (error) {
            console.error("Error placing bid:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/all`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                console.log("Products loaded:", data);
                setProducts(data);
            } else {
                console.error("Failed to fetch products: " + res.status);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    useEffect(() => {
        if (products.length > 0) {
            products.forEach(p => fetchHighestBid(p.id));
        }
    }, [products]);

    const fetchHighestBid = async (productId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bids/highest/${productId}`, { credentials: 'include' });
            if (res.ok) {
                const amount = await res.json();
                setHighestBids(prev => ({ ...prev, [productId]: amount }));
            }
        } catch (e) {
            console.error("Error fetching bid for product " + productId, e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/dashboard`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMyOrders(data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'Orders') {
            fetchMyOrders();
        } else if (activeTab === 'Help') {
            fetchMyComplaints();
        }
    }, [activeTab]);



    const handleModifyOrder = async (orderId, currentQty) => {
        const newQty = prompt("Enter new quantity:", currentQty);
        if (!newQty || newQty === currentQty) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/modify/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ quantity: newQty })
            });
            if (res.ok) {
                alert("Order modified successfully!");
                alert("Order modified successfully!");
                fetchMyOrders(); // Refresh list
                fetchNotifications();
            } else {
                const txt = await res.text();
                alert("Failed: " + txt);
            }
        } catch (err) {
            console.error(err);
            alert("Error modifying order.");
        }
    };

    // Removed old handleFilterChange in favor of inline or integrated logic

    const filteredProducts = products.filter(p => {
        // 1. Farmer Filter (Highest priority if selected)
        if (filters.selectedFarmer && p.farmerName !== filters.selectedFarmer) return false;

        // 2. Category Filter
        if (filters.category && p.category !== filters.category) return false;

        // 3. Search Query (only if in product search mode)
        if (filters.searchMode === 'search_product' && filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        }

        // 4. Max Price & Location (General filters)
        if (filters.maxPrice && parseFloat(filters.maxPrice) && p.price > parseFloat(filters.maxPrice)) return false;
        if (filters.location && !p.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;

        return true;
    });

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
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

    const handleTrackOrder = async (orderId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transport/order/${orderId}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTrackingData(data);
                setShowTracking(true);
            } else {
                alert("No platform transport found for this order.");
            }
        } catch (error) {
            console.error("Tracking Error:", error);
            alert("Error fetching tracking details.");
        }
    };

    // Mock Data
    const ordersOverTime = [
        { name: 'Jul', value: 10 },
        { name: 'Aug', value: 22 },
        { name: 'Sep', value: 12 },
        { name: 'Oct', value: 35 },
        { name: 'Nov', value: 38 },
        { name: 'Dec', value: 10 },
    ];

    const orderStatusData = [
        { name: 'Pending', value: 7, color: '#FCD34D' }, // Yellow
        { name: 'Delivered', value: 95, color: '#10B981' }, // Green
        { name: 'Other', value: 10, color: '#E5E7EB' }, // Grey
    ];

    const recentOrders = [
        { id: 'ORD-1001', from: 'Ramesh (Farmer)', products: '24 items', amount: '₹1,240', status: 'Delivered' },
        { id: 'ORD-1002', from: 'Priya (Farmer)', products: '8 items', amount: '₹420', status: 'Pending' },
        { id: 'ORD-1003', from: 'Vikram Singh', products: '12 items', amount: '₹850', status: 'Delivered' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)' }}>

            {/* Sidebar - Dark Green */}
            <aside style={{ width: '250px', backgroundColor: '#2E7D32', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>F</span>
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Farm2Trade</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginLeft: '62px', fontStyle: 'italic', marginBottom: '4px' }}>easy to connect...</span>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginLeft: '62px', fontWeight: '500' }}>Retailer</div>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <div onClick={() => { setActiveTab('Dashboard'); setFilteredOrderStatus(null); }}><NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} /></div>
                    <div onClick={() => { setActiveTab('Orders'); setFilteredOrderStatus(null); }}><NavItem icon={<ShoppingBag size={20} />} label="Orders" active={activeTab === 'Orders'} /></div>
                    <div onClick={() => setActiveTab('Marketplace')}><NavItem icon={<Package size={20} />} label="Marketplace" active={activeTab === 'Marketplace'} /></div>
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
                    <div onClick={() => setActiveTab('Profile')}><NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'Profile'} /></div>
                    <div onClick={() => setActiveTab('Help')}><NavItem icon={<HelpCircle size={20} />} label="Help" active={activeTab === 'Help'} /></div>
                </nav>

                <div style={{ padding: '2rem' }}>
                    {/* Placeholder for bottom illustration or extra links if needed */}
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <header style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Welcome, <span style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem', fontWeight: 'normal' }}>{user?.fullName || 'Retailer'}</span>
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                             <span style={{ fontWeight: "600", fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Risk Level</span>
                             <SmallRiskGauge risk={riskLevel} />
                        </div>
                        <ThemeToggle />
                        <button onClick={handleLogout} style={{ backgroundColor: '#166534', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Log out</button>
                    </div>
                </header>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Center Column */}
                    <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                        <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={confirmLogout} />
                        {showFeedbackModal && (
                            <FeedbackModal
                                order={currentFeedbackOrder}
                                onClose={handleFeedbackClose}
                                onSubmit={handleFeedbackSubmit}
                            />
                        )}

                        {showTracking && trackingData && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', position: 'relative' }}>
                                    <button onClick={() => setShowTracking(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#166534' }}>🚚 Order Tracking</h3>
                                    
                                    <p><strong>Status:</strong> <span style={{ backgroundColor: '#FEF08A', padding: '2px 8px', borderRadius: '4px' }}>{trackingData.status}</span></p>
                                    <p><strong>Transport Method:</strong> {trackingData.transportMethod}</p>
                                    <p><strong>Distance:</strong> {trackingData.distanceKm} km</p>
                                    
                                    {trackingData.driver ? (
                                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                                            <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Driver Details</h4>
                                            <p><strong>Vehicle:</strong> {trackingData.driver.vehicleType}</p>
                                            <p><strong>Capacity:</strong> {trackingData.driver.vehicleCapacity} kg</p>
                                            
                                            <div style={{ marginTop: '1rem', height: '300px', backgroundColor: '#E5E7EB', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                                                {/* Leaflet Map integration */}
                                                <MapContainer center={[trackingData.driver.currentLat || 13.06, trackingData.driver.currentLng || 80.26]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                                    <TileLayer
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    {/* Driver Marker */}
                                                    <Marker position={[trackingData.driver.currentLat || 13.06, trackingData.driver.currentLng || 80.26]}>
                                                        <Popup>🚚 Driver Tracking Position</Popup>
                                                    </Marker>
                                                    {/* Mock Farmer & Retailer Destination markers for visual context */}
                                                    <Marker position={[13.05, 80.25]}>
                                                        <Popup>📍 Pickup (Farmer)</Popup>
                                                    </Marker>
                                                    <Marker position={[13.10, 80.30]}>
                                                        <Popup>🏪 Destination (You)</Popup>
                                                    </Marker>
                                                </MapContainer>
                                            </div>
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6B7280' }}>* Location updates every 10 seconds via our real-time backend.</p>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: '8px' }}>
                                            Waiting for a transporter to accept this request...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Dashboard' && (
                            <>
                                {/* Status Row */}
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Total Orders</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.totalOrders}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>All orders placed to you</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Pending</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.pendingOrders}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Awaiting delivery</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Delivered</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.deliveredOrders}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Successfully delivered</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <WeatherIntelligence role="ROLE_RETAILER" location={user?.city || user?.address || "Hyderabad"} />
                                </div>

                                {/* Charts Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {/* Line Chart */}
                                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Orders over time</h3>
                                            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Last 6 months</span>
                                        </div>
                                        <div style={{ height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats.ordersOverTime || []}>
                                                    <defs>
                                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                                    <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                        itemStyle={{ color: '#111827', fontWeight: 500 }}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Donut Chart */}
                                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Order status</h3>
                                        <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.orderStatusData || []}
                                                        cx="50%" cy="50%"
                                                        innerRadius={60} outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        startAngle={90}
                                                        endAngle={-270}
                                                    >
                                                        {(stats.orderStatusData || []).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Center Text (Optional, tricky with responsive, skipping for simplicity) */}
                                        </div>

                                    </div>
                                </div>
                            </>
                        )}

                        {/* Marketplace Section */}
                        {activeTab === 'Marketplace' && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {filters.searchMode === 'farmers' ? 'Select a Farmer' :
                                            filters.selectedFarmer ? `Products by ${filters.selectedFarmer}` : 'Marketplace'}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {filters.selectedFarmer && (
                                            <button
                                                onClick={() => setFilters({ ...filters, selectedFarmer: null, searchMode: 'farmers' })}
                                                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span style={{ marginRight: '5px' }}>←</span> Back to Farmers
                                            </button>
                                        )}

                                        <select
                                            name="filterType"
                                            value={filters.searchMode === 'farmers' ? 'search_farmer' : (filters.searchMode === 'search_product' ? 'search_product' : (filters.category || 'all_categories'))}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'search_farmer') {
                                                    setFilters({ ...filters, searchMode: 'farmers', category: '', selectedFarmer: null, searchQuery: '' });
                                                } else if (val === 'search_product') {
                                                    setFilters({ ...filters, searchMode: 'search_product', category: '', selectedFarmer: null, searchQuery: '' });
                                                } else if (val === 'all_categories') {
                                                    setFilters({ ...filters, searchMode: 'products', category: '', selectedFarmer: null });
                                                } else {
                                                    // Category selected
                                                    setFilters({ ...filters, searchMode: 'products', category: val, selectedFarmer: null });
                                                }
                                            }}
                                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                        >
                                            <option value="all_categories">All Categories</option>
                                            <option value="Vegetables">Vegetables</option>
                                            <option value="Fruits">Fruits</option>
                                            <option value="Grains">Grains</option>
                                            <option value="search_product">Search Product</option>
                                            <option value="search_farmer">Search Farmer</option>
                                        </select>

                                        {(filters.searchMode === 'farmers' || filters.searchMode === 'search_product') && (
                                            <input
                                                type="text"
                                                name="searchQuery"
                                                value={filters.searchQuery || ''}
                                                placeholder={filters.searchMode === 'farmers' ? "Search Farmer Name..." : "Search Product Name..."}
                                                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', width: '200px' }}
                                            />
                                        )}

                                        <input
                                            type="number"
                                            name="maxPrice"
                                            placeholder="Max Price"
                                            value={filters.maxPrice || ''}
                                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100px' }}
                                        />
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="Location"
                                            value={filters.location || ''}
                                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                        />
                                    </div>
                                </div>

                                {filters.searchMode === 'farmers' ? (
                                    // Farmer List View
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                        {[...new Set(products.map(p => p.farmerName))]
                                            .filter(name => !filters.searchQuery || name.toLowerCase().includes(filters.searchQuery.toLowerCase()))
                                            .map((farmerName, index) => {
                                                const farmerProductsCount = products.filter(p => p.farmerName === farmerName).length;
                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => setFilters({ ...filters, searchMode: 'products', selectedFarmer: farmerName })}
                                                        style={{
                                                            backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)',
                                                            cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        <div style={{ width: '80px', height: '80px', backgroundColor: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem', color: '#047857' }}>
                                                            {farmerName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{farmerName}</h4>
                                                        <p style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>{farmerProductsCount} Products Listed</p>
                                                        <button style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500' }}>
                                                            View Products
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        {[...new Set(products.map(p => p.farmerName))].filter(name => !filters.searchQuery || name.toLowerCase().includes(filters.searchQuery.toLowerCase())).length === 0 && (
                                            <p style={{ color: 'var(--text-tertiary)', gridColumn: '1/-1', textAlign: 'center' }}>No farmers found matching query.</p>
                                        )}
                                    </div>
                                ) : (
                                    // Product Grid View
                                    products.length === 0 ? (
                                        <p style={{ color: 'var(--text-tertiary)' }}>No products available currently.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                            {filteredProducts.length === 0 ? (
                                                <p style={{ color: 'var(--text-tertiary)', gridColumn: '1/-1', textAlign: 'center' }}>No products match your filters.</p>
                                            ) : (
                                                filteredProducts
                                                    .slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE)
                                                    .map(product => (
                                                        <div key={product.id} className="product-card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                                            {!product.available && (
                                                                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#E74C3C', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                    🔴 Sold Out
                                                                </div>
                                                            )}
                                                            <div onClick={() => setSelectedImageProduct(product.id)} style={{ cursor: 'pointer' }}>
                                                                <ProductImage productId={product.id} />
                                                            </div>
                                                            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '10px 0 5px', color: 'var(--text-secondary)' }}>{product.name}</h4>
                                                            <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '5px' }}>
                                                                Farmer: <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{product.farmerName}</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '5px' }}>
                                                                {product.quantity <= 0 ? (
                                                                    <span style={{ fontWeight: 'bold', color: '#E74C3C' }}>🔴 Sold out</span>
                                                                ) : (
                                                                    <><span style={{ fontWeight: 'bold', color: '#2ECC71' }}>🟢 Available:</span> {product.quantity} {product.unit}</>
                                                                )}
                                                            </div>
                                                            {product.winnerName && (
                                                                <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '5px' }}>
                                                                    🛒 Product Sold To: <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{product.winnerName}</span>
                                                                </div>
                                                            )}
                                                            <p style={{ fontSize: '0.875rem', color: '#555', margin: '5px 0' }}>🌾 {product.category}: {product.location}</p>
                                                            {product.listingType !== 'DIRECT' && (
                                                                <div style={{ fontSize: '0.875rem', color: '#D97706', margin: '5px 0', fontWeight: '600' }}>
                                                                    ⏳ Ends in: <CountdownTimer endTime={product.biddingEndTime} />
                                                                </div>
                                                            )}
                                                            <p style={{ fontSize: '0.875rem', color: '#555', margin: '5px 0 1rem', flex: 1 }}>💬 {product.description}</p>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2ECC71' }}>
                                                                        💰 {product.listingType === 'DIRECT' ? 'Fixed Price / Unit:' : 'Base Price / Unit:'} ₹{product.price}
                                                                    </div>

                                                                    {product.listingType !== 'DIRECT' && (
                                                                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2ECC71' }}>
                                                                            📈 Max Bid: ₹{highestBids[product.id] || product.price}
                                                                        </div>
                                                                    )}
                                                                    {product.listingType === 'DIRECT' && product.available && (
                                                                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2ECC71' }}>
                                                                            ✅ Ready to Buy
                                                                        </div>
                                                                    )}

                                                                    {myBids[product.id] && product.listingType !== 'DIRECT' && (
                                                                        <div style={{ fontSize: '0.85rem', color: '#3498DB', marginTop: '5px', fontWeight: 'bold' }}>
                                                                            🏷️ Your Bid: ₹{myBids[product.id]}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {product.available ? (
                                                                    product.listingType === 'DIRECT' ? (
                                                                        <button
                                                                            onClick={() => handleBuyNow(product)}
                                                                            className="product-card-btn buy-btn"
                                                                            style={{ width: '100%', backgroundColor: '#3498DB', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                                            🛍️ Buy Now
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePlaceBid(product.id, product.price)}
                                                                            className="product-card-btn"
                                                                            style={{ width: '100%', backgroundColor: '#166534', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                                            🔨 Place Bid
                                                                        </button>
                                                                    )
                                                                ) : (
                                                                    <button
                                                                        disabled
                                                                        style={{ width: '100%', backgroundColor: '#BDC3C7', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                                                                        🚫 Sold Out
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    )
                                )}
                                <Pagination
                                    currentPage={productsPage}
                                    totalPages={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                                    onPageChange={setProductsPage}
                                />
                            </div>
                        )}

                        {activeTab === 'Orders' && (
                            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{filteredOrderStatus ? `My Orders - ${filteredOrderStatus.replace('_', ' ')}` : 'My Orders'}</h3>
                                    {filteredOrderStatus && (
                                        <button onClick={() => setFilteredOrderStatus(null)} style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>Clear Filter</button>
                                    )}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '0.75rem 0' }}>Order ID</th>
                                            <th style={{ padding: '0.75rem 0' }}>Farmer</th>
                                            <th style={{ padding: '0.75rem 0' }}>Product</th>
                                            <th style={{ padding: '0.75rem 0' }}>Quantity</th>
                                            <th style={{ padding: '0.75rem 0' }}>Total Price</th>
                                            <th style={{ padding: '0.75rem 0' }}>Status</th>
                                            <th style={{ padding: '0.75rem 0' }}>Invoice</th>
                                            <th style={{ padding: '0.75rem 0' }}>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myOrders.length === 0 ? (
                                            <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center' }}>No orders found.</td></tr>
                                        ) : (
                                            (myOrders || [])
                                                .filter(order => {
                                                    if (!order.status) return false;
                                                    const status = order.status.toUpperCase();
                                                    if (!filteredOrderStatus) return true;
                                                    if (status === filteredOrderStatus) return true;
                                                    if (filteredOrderStatus === 'PENDING_SHIPMENT' && (status === 'SHIPPED' || status === 'PENDING' || status === 'CONFIRMED')) return true;
                                                    return false;
                                                })
                                                .slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE)
                                                .map(order => (
                                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '1rem 0' }}>{order.id}</td>
                                                        <td style={{ padding: '1rem 0', fontWeight: '500', color: '#166534' }}>{order.product?.farmer?.fullName || 'N/A'}</td>
                                                        <td style={{ padding: '1rem 0' }}>{order.product?.name}</td>
                                                        <td style={{ padding: '1rem 0' }}>{order.quantity}</td>
                                                        <td style={{ padding: '1rem 0' }}>₹{(order.totalPrice || 0) + (order.transport?.updatedPrice || 0)}</td>
                                                        <td style={{ padding: '1rem 0' }}>{order.status === 'CONFIRMED' ? 'PENDING' : order.status}</td>
                                                        <td style={{ padding: '1rem 0' }}>
                                                            <button
                                                                onClick={() => handleViewInvoice(order)}
                                                                style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                                                                View
                                                            </button>
                                                            <button 
                                                                onClick={() => handleTrackOrder(order.id)}
                                                                style={{ marginLeft: '10px', backgroundColor: '#F3E8FF', color: '#7E22CE', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                                                                Track
                                                            </button>
                                                        </td>
                                                        <td style={{ padding: '1rem 0' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {/* PRODUCT PAYMENT SECTION */}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '160px' }}>
                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>📦 Product</span>
                                                                    {order.isPaid || order.status === 'CONFIRMED' || order.status === 'DELIVERED' || order.status === 'Delivered' ? (
                                                                        <span style={{ color: '#047857', fontSize: '0.7rem', fontWeight: 'bold' }}>✓ Paid</span>
                                                                    ) : (
                                                                        <button onClick={() => handlePayment(order, 'PRODUCT')} style={{ backgroundColor: '#166534', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600' }}>Pay Now</button>
                                                                    )}
                                                                </div>

                                                                {/* LOGISTICS PAYMENT SECTION */}
                                                                {order.transport ? (
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '160px' }}>
                                                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>🚚 Logistics</span>
                                                                        {order.transport.isPaid ? (
                                                                            <span style={{ color: '#047857', fontSize: '0.7rem', fontWeight: 'bold' }}>✓ Paid</span>
                                                                        ) : (
                                                                             <button onClick={() => handlePayment(order, 'LOGISTICS')} style={{ backgroundColor: '#1D4ED8', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600' }}>Pay Now</button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '0 10px' }}>Waiting for Logistics...</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                                <Pagination
                                    currentPage={ordersPage}
                                    totalPages={Math.ceil((myOrders || []).filter(order => {
                                        if (!order.status) return false;
                                        const status = order.status.toUpperCase();
                                        if (!filteredOrderStatus) return true;
                                        if (status === filteredOrderStatus) return true;
                                        if (filteredOrderStatus === 'PENDING_SHIPMENT' && (status === 'SHIPPED' || status === 'PENDING' || status === 'CONFIRMED')) return true;
                                        return false;
                                    }).length / ITEMS_PER_PAGE)}
                                    onPageChange={setOrdersPage}
                                />
                            </div>
                        )}


                        {activeTab === 'Notifications' && (
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
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
                                            <div key={notification.id} style={{
                                                padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                                backgroundColor: !(notification.read || notification.isRead) ? 'var(--bg-primary)' : 'var(--card-bg)',
                                                display: 'flex', gap: '1rem', alignItems: 'start'
                                            }}>
                                                <div style={{
                                                    minWidth: '40px', height: '40px', borderRadius: '50%',
                                                    backgroundColor: notification.type === 'alert' ? '#EF4444' : notification.type === 'order' ? '#0284C7' : '#16A34A',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                }}>
                                                    <Bell size={20} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{notification.title}</h4>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(notification.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{notification.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Profile' && (
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '600px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div style={{ width: '100px', height: '100px', backgroundColor: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                        {user?.fullName?.charAt(0) || 'R'}
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.fullName}</h2>
                                    <p style={{ color: 'var(--text-tertiary)' }}>Retailer Account</p>
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
                                                    style={{ color: '#047857', fontWeight: '600', textDecoration: 'none', fontSize: '0.875rem' }}
                                                >
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Account Status</label>
                                        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: '#ECFDF5', color: '#047857', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                                            Verified
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Dashboard' && (
                            <>
                                {/* Recent Orders Table */}
                                <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Orders</h3>
                                        <div onClick={() => setActiveTab('Orders')} style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '500', cursor: 'pointer' }}>View all</div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Order ID</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>From</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Products</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Amount</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Status</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: '500' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(myOrders || []).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5).map((order) => (
                                                <tr key={order.id} onClick={() => setActiveTab('Orders')} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '1rem 0', fontWeight: '500', color: 'var(--text-primary)' }}>{order.id}</td>
                                                    <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{order.product?.farmer?.fullName || 'Farmer'}</td>
                                                    <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{order.product?.name} ({order.quantity})</td>
                                                    <td style={{ padding: '1rem 0', color: 'var(--text-primary)', fontWeight: '500' }}>₹{order.totalPrice}</td>
                                                    <td style={{ padding: '1rem 0' }}>
                                                        <span style={{
                                                            backgroundColor: order.status === 'Delivered' ? '#ECFDF5' : '#FFFBEB',
                                                            color: order.status === 'Delivered' ? '#065F46' : '#92400E',
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500'
                                                        }}>{order.status}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem 0' }}>
                                                        <span style={{ color: '#166534', fontWeight: '500', fontSize: '0.85rem' }}>Details</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(myOrders || []).length === 0 && (
                                                <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No recent orders.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {activeTab === 'Help' && (
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '800px', margin: '0 auto' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Help & Support</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                    Have an issue or a suggestion? Submit your complaint or feedback below, and our admin team will get back to you shortly.
                                </p>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const message = e.target.elements.message.value;
                                    if (!message) return;

                                    try {
                                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/create`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ message }),
                                            credentials: 'include'
                                        });
                                        if (res.ok) {
                                            alert("Complaint submitted successfully! Admin has been notified.");
                                            e.target.reset();
                                        } else {
                                            alert("Failed to submit complaint.");
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert("Error submitting complaint.");
                                    }
                                }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Describe your issue</label>
                                        <textarea
                                            name="message"
                                            rows="6"
                                            placeholder="Please provide details about your issue..."
                                            style={{
                                                width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                                backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical'
                                            }}
                                            required
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            backgroundColor: '#DC2626', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px',
                                            border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'
                                        }}>
                                        Submit Complaint
                                    </button>
                                </form>
                            </div>
                        )}
                    </main>

                    {/* Right Sidebar Widget */}
                    {activeTab === 'Dashboard' && (
                        <aside style={{ width: '300px', backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Profile Widget */}
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 'bold' }}>
                                    {user?.fullName?.charAt(0) || 'R'}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{user?.fullName || 'Retailer Name'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
                                </div>
                            </div>



                            {/* Quick Stats */}
                            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Quick stats</h4>

                                {/* Active Bids */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    color: 'white',
                                    marginBottom: '1rem',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>Active Bids</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.activeBids || 0}</div>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                                            <ShoppingBag size={20} color="white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Shipments */}
                                <div
                                    onClick={() => {
                                        setActiveTab('Orders');
                                        setFilteredOrderStatus('PENDING_SHIPMENT');
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        color: 'white',
                                        marginBottom: '1rem',
                                        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>Pending Shipments</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.pendingShipments || 0}</div>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                                            <Package size={20} color="white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Avg Delivery Days */}
                                <div
                                    onClick={() => {
                                        // Calculate dynamic example from actual delivered orders
                                        const deliveredOrders = myOrders.filter(o => (o.status === 'DELIVERED' || o.status === 'Delivered') && o.orderDate && o.deliveredAt);
                                        let exampleContent;

                                        if (deliveredOrders.length > 0) {
                                            // Take up to 2 recent orders
                                            const examples = deliveredOrders.slice(0, 2).map((order, index) => {
                                                const start = new Date(order.orderDate);
                                                const end = new Date(order.deliveredAt);
                                                const diffTime = Math.abs(end - start);
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                // Using ceil to be generous/clear, though stats service logic might differ slightly. 
                                                // Stats service uses ChronoUnit.DAYS which truncates. Let's match roughly.
                                                // Actually ChronoUnit.DAYS counts ordering date boundaries. 
                                                // Let's stick to a simple formatted display.
                                                return { id: order.id, days: diffDays };
                                            });

                                            const avg = examples.reduce((acc, curr) => acc + curr.days, 0) / examples.length;

                                            exampleContent = (
                                                <>
                                                    This shows the average number of days it takes for your orders to go from "Placed" to "Delivered".
                                                    <br /><br />
                                                    <strong>Based on your recent orders:</strong>
                                                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                        {examples.map((ex, i) => (
                                                            <li key={i}>Order #{ex.id}: Took {ex.days} days to arrive.</li>
                                                        ))}
                                                    </ul>
                                                    <div style={{ fontWeight: 'bold' }}>Avg Delivery Days: {avg.toFixed(1)} days.</div>
                                                </>
                                            );
                                        } else {
                                            // Fallback if no data
                                            exampleContent = (
                                                <>
                                                    This shows the average number of days it takes for your orders to go from "Placed" to "Delivered".
                                                    <br /><br />
                                                    <strong>Example (You have no delivered orders yet):</strong>
                                                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <li>Order 1: Took 2 days to arrive.</li>
                                                        <li>Order 2: Took 4 days to arrive.</li>
                                                    </ul>
                                                    <div style={{ fontWeight: 'bold' }}>Avg Delivery Days: 3.0 days.</div>
                                                </>
                                            );
                                        }

                                        setInfoModal({
                                            show: true,
                                            title: 'Average Delivery Days',
                                            content: exampleContent
                                        });
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        color: 'white',
                                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem' }}>Avg Delivery Days</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {(() => {
                                                    const deliveredOrders = (myOrders || []).filter(o => (o.status === 'DELIVERED' || o.status === 'Delivered') && o.orderDate && o.deliveredAt);
                                                    if (deliveredOrders.length === 0) return Number(stats?.avgDeliveryDays || 0).toFixed(1);

                                                    const totalDays = deliveredOrders.reduce((acc, order) => {
                                                        const start = new Date(order.orderDate);
                                                        const end = new Date(order.deliveredAt);
                                                        const diffTime = Math.abs(end - start);
                                                        return acc + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    }, 0);

                                                    return (totalDays / deliveredOrders.length).toFixed(1);
                                                })()}
                                            </div>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
                                            <LayoutDashboard size={20} color="white" />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </aside>
                    )}
                </div>
            </div >

            {/* Info Modal */}
            {
                infoModal.show && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }} onClick={() => setInfoModal({ ...infoModal, show: false })}>
                        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', maxWidth: '500px', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>{infoModal.title}</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{infoModal.content}</div>
                            <button onClick={() => setInfoModal({ ...infoModal, show: false })} style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                )
            }

            {/* Product Image Carousel Modal */}
            {
                selectedImageProduct && (
                    <ImageCarouselModal
                        productId={selectedImageProduct}
                        onClose={() => setSelectedImageProduct(null)}
                    />
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
                            backgroundColor: 'white', width: '850px', maxWidth: '95%', borderRadius: '12px',
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
            {showHelpModal && (
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
            )}

            {showChatModal && selectedComplaint && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        backgroundColor: 'white', width: '600px', maxWidth: '90%', borderRadius: '16px',
                        padding: '2rem', display: 'flex', flexDirection: 'column', maxHeight: '80vh',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' // Elevated shadow
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
                                <div key={response.id} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: response.responder?.role === 'ROLE_ADMIN' ? 'flex-start' : 'flex-end' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                        {response.responder?.role === 'ROLE_ADMIN' ? 'Support' : 'You'} • {new Date(response.timestamp).toLocaleString()}
                                    </div>
                                    <div style={{
                                        backgroundColor: response.responder?.role === 'ROLE_ADMIN' ? '#F3F4F6' : '#DBEAFE',
                                        color: response.responder?.role === 'ROLE_ADMIN' ? '#1F2937' : '#1E40AF',
                                        padding: '0.75rem',
                                        borderRadius: response.responder?.role === 'ROLE_ADMIN' ? '12px 12px 12px 0' : '12px 12px 0 12px',
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
            )}

        </div >
    );
};

const NavItem = ({ icon, label, active }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
        marginBottom: '0.5rem', borderRadius: '8px', cursor: 'pointer',
        backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        opacity: active ? 1 : 0.7
    }}>
        {icon}
        <span>{label}</span>
    </div>
);

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

export default RetailerDashboard;
