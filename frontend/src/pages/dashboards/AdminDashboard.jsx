import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LayoutDashboard, FileText, Users, MessageSquare, LogOut, Menu, Bell, ChevronRight } from 'lucide-react';
import '../../styles/global.css';
import LogoutModal from '../../components/LogoutModal';
import ThemeToggle from '../../components/ThemeToggle';
import WeatherIntelligence from './WeatherIntelligence';
import AlertBanner from '../../components/AlertBanner';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, farmers: 0, retailers: 0 });

    const [transactions, setTransactions] = useState([]);
    const [complaints, setComplaints] = useState([]);

    // Tab State
    const [activeTab, setActiveTab] = useState('Overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // List Modal State
    const [showListModal, setShowListModal] = useState(false);
    const [listModalTitle, setListModalTitle] = useState("");
    const [userList, setUserList] = useState([]);

    // Document Modal State
    const [showDocModal, setShowDocModal] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [docName, setDocName] = useState('');

    // Chat Modal State
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [chatReply, setChatReply] = useState('');

    // Send Message Modal State
    const [showSendMsgModal, setShowSendMsgModal] = useState(false);
    const [msgTargetRole, setMsgTargetRole] = useState('farmer'); // 'farmer' or 'retailer'
    const [msgTargetList, setMsgTargetList] = useState([]);
    const [msgSelectedUser, setMsgSelectedUser] = useState('');
    const [msgBody, setMsgBody] = useState('');

    // Crisis Management State
    const [crisisLocation, setCrisisLocation] = useState('Hyderabad');
    const [crisisMsg, setCrisisMsg] = useState('Heavy Road Blockage due to construction');
    const [weatherData, setWeatherData] = useState([]);
    const [loadingWeather, setLoadingWeather] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
        fetchStats();
        fetchTransactions();
        fetchComplaints();
        if (activeTab === 'Logistics') fetchAllWeatherData();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/transactions`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const fetchComplaints = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/all`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setComplaints(data);
            }
        } catch (error) {
            console.error("Error fetching complaints:", error);
        }
    };

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pending-users`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setPendingUsers(data);
            } else {
                console.error("Failed to fetch pending users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchApprovedUsers = async (role) => {
        const endpoint = role === 'farmer' ? 'approved-farmers' : 'approved-retailers';
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${endpoint}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setUserList(data);
                setListModalTitle(role === 'farmer' ? 'Approved Farmers' : 'Approved Retailers');
                setShowListModal(true);
            }
        } catch (error) {
            console.error("Error fetching approved users:", error);
        }
    };

    const handleViewDetails = (user) => {
        setListModalTitle(""); // Optional: Clean up title
        setShowListModal(false); // Close the list modal if open
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleViewDocument = (userId, fileName) => {
        const url = `${import.meta.env.VITE_API_URL}/api/users/${userId}/document`;
        setDocUrl(url);
        setDocName(fileName);
        setShowDocModal(true);
    };

    const handleCloseDocModal = () => {
        setShowDocModal(false);
        setDocUrl('');
        setDocName('');
    };

    const fetchAllWeatherData = async () => {
        setLoadingWeather(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/all-weather`, { credentials: 'include' });
            if (res.ok) setWeatherData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingWeather(false); }
    };

    const triggerRoadBlock = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/trigger-crisis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ location: crisisLocation, message: crisisMsg })
            });
            if (res.ok) {
                alert("🚨 Road Blockage Alert Broadcasted Successfully!");
                setCrisisMsg("");
            }
        } catch (e) { console.error(e); }
    };

    const handleApprove = async () => {
        if (!selectedUser) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/approve/${selectedUser.id}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                alert("User approved successfully!");
                handleCloseModal();
                fetchPendingUsers();
                fetchStats();
            } else {
                alert("Failed to approve user.");
            }
        } catch (error) {
            console.error("Error approving user:", error);
            alert("Error approving user.");
        }
    };

    const handleReject = async () => {
        if (!selectedUser) return;
        if (!window.confirm("Are you sure you want to reject (and delete) this user?")) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reject/${selectedUser.id}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                alert("User rejected successfully.");
                handleCloseModal();
                fetchPendingUsers();
                fetchStats();
            } else {
                alert("Failed to reject user.");
            }
        } catch (error) {
            console.error("Error rejecting user:", error);
            alert("Error rejecting user.");
        }
    };

    const handleDeleteUser = async (user) => {
        if (!user) return;
        if (!window.confirm(`Are you sure you want to delete user ${user.fullName}?`)) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/delete/${user.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                alert("User deleted successfully.");
                // Refresh the list
                if (user.role === 'ROLE_FARMER') {
                    fetchApprovedUsers('farmer');
                } else if (user.role === 'ROLE_RETAILER') {
                    fetchApprovedUsers('retailer');
                }
                fetchStats();
            } else {
                alert("Failed to delete user.");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user.");
        }
    };

    // Chat Handlers
    const handleOpenChat = async (complaint) => {
        setSelectedComplaint(complaint);
        setChatReply('');
        setShowChatModal(true);

        // Mark as read if unread
        if (complaint.hasUnreadMessagesForAdmin) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/${complaint.id}/mark-read-admin`, {
                    method: 'PUT',
                    credentials: 'include'
                });
                // Update local state to remove red dot immediately
                setComplaints(prev => prev.map(c =>
                    c.id === complaint.id ? { ...c, hasUnreadMessagesForAdmin: false } : c
                ));
            } catch (err) {
                console.error("Error marking as read", err);
            }
        }
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
                const newReply = await res.json();
                // Optimistically update UI
                const updatedComplaint = { ...selectedComplaint };
                if (!updatedComplaint.responses) updatedComplaint.responses = [];
                updatedComplaint.responses.push(newReply);
                setSelectedComplaint(updatedComplaint);
                setChatReply('');
                fetchComplaints(); // Refresh list in background
            } else {
                alert("Failed to send reply");
            }
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    // New Message Handlers
    const handleOpenSendMsg = async () => {
        setShowSendMsgModal(true);
        fetchTargetUsers('farmer'); // Default
    };

    const fetchTargetUsers = async (role) => {
        setMsgTargetRole(role);
        setMsgSelectedUser('');
        const endpoint = role === 'farmer' ? 'approved-farmers' : 'approved-retailers';
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${endpoint}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMsgTargetList(data);
            }
        } catch (error) {
            console.error("Error fetching target users:", error);
        }
    };

    const handleSendNewMsg = async () => {
        if (!msgSelectedUser || !msgBody.trim()) {
            alert("Please select a user and enter a message.");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/complaints/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: msgSelectedUser, message: msgBody }),
                credentials: 'include'
            });
            if (res.ok) {
                alert("Message sent successfully!");
                setShowSendMsgModal(false);
                setMsgBody('');
                setMsgSelectedUser('');
                fetchComplaints(); // Should appear in list
            } else {
                alert("Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Data for Pie Chart
    const pieData = [
        { name: 'Farmers', value: stats.farmers },
        { name: 'Retailers', value: stats.retailers }
    ];
    const COLORS = ['#16a34a', '#2563eb']; // Vibrant Green, Vibrant Blue

    const NavItem = ({ icon, label, active, onClick }) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.5rem',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: active ? 'var(--bg-tertiary)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: active ? '600' : '500',
                borderLeft: active ? '4px solid var(--primary-color)' : '4px solid transparent'
            }}
            className="sidebar-item"
        >
            <div style={{ marginRight: '12px' }}>{icon}</div>
            <span style={{ fontSize: '0.95rem' }}>{label}</span>
            {active && <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.8 }} />}
        </div>
    );

    const [transactionData, setTransactionData] = useState([]);

    useEffect(() => {
        if (transactions.length > 0) {
            // Process transactions for the chart
            const statusCounts = { 'SHIPPED': 0, 'DELIVERED': 0, 'PENDING': 0, 'CANCELLED': 0 };
            transactions.forEach(t => {
                const s = t.status ? t.status.toUpperCase() : 'UNKNOWN';
                if (statusCounts[s] !== undefined) statusCounts[s]++;
            });
            const formattedData = Object.keys(statusCounts).map(status => ({
                name: status,
                count: statusCounts[status]
            }));
            setTransactionData(formattedData);
        }
    }, [transactions]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)' }}>

            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '260px' : '0px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                display: 'flex', flexDirection: 'column',
                height: '100vh', position: 'sticky', top: 0,
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={`${import.meta.env.BASE_URL}assets/farm_trade_leaf.png`} alt="Logo" style={{ width: '32px', height: '32px' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Farm2Trade</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', marginLeft: '42px' }}>Admin Panel</span>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Overview"
                        active={activeTab === 'Overview'}
                        onClick={() => setActiveTab('Overview')}
                    />
                    <NavItem
                        icon={<FileText size={20} />}
                        label="Transactions"
                        active={activeTab === 'Transactions'}
                        onClick={() => setActiveTab('Transactions')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="Approvals"
                        active={activeTab === 'Approvals'}
                        onClick={() => setActiveTab('Approvals')}
                    />
                    <NavItem
                        icon={<MessageSquare size={20} />}
                        label="Complaints"
                        active={activeTab === 'Complaints'}
                        onClick={() => setActiveTab('Complaints')}
                    />
                </nav>

                <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem',
                            backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s'
                        }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Header */}
                <header style={{
                    backgroundColor: 'var(--bg-secondary)', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    position: 'sticky', top: 0, zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                            {activeTab}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ position: 'relative', cursor: 'pointer' }}>
                            <Bell size={20} color="var(--text-secondary)" />
                            {/* Notification Badge Placeholder */}
                        </div>
                        <ThemeToggle />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                A
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Administrator</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>Super User</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    <AlertBanner location="Admin HQ" />

                    {/* OVERVIEW TAB */}
                    {activeTab === 'Overview' && (
                        <>
                            {/* Stats Section with Chart */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #16a34a, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.totalUsers}</h3>
                                    <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Total Users</p>
                                </div>
                                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', borderLeft: '5px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} onClick={() => fetchApprovedUsers('farmer')}>
                                    <h3 style={{ color: '#16a34a', fontSize: '2rem', fontWeight: 'bold' }}>{stats.farmers}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Farmers</p>
                                </div>
                                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', borderLeft: '5px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} onClick={() => fetchApprovedUsers('retailer')}>
                                    <h3 style={{ color: '#2563eb', fontSize: '2rem', fontWeight: 'bold' }}>{stats.retailers}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Retailers</p>
                                </div>
                                <div className="card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', borderLeft: '5px solid #db2777', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={() => setActiveTab('Approvals')}>
                                    <h3 style={{ color: '#db2777', fontSize: '2rem', fontWeight: 'bold' }}>{pendingUsers.length}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Pending Verifications</p>
                                    <p style={{ fontSize: '0.75rem', color: '#db2777', marginTop: '0.25rem' }}>Click to review</p>
                                </div>
                            </div>

                            {/* Weather Intelligence Hub */}
                            <div style={{ marginBottom: '3rem' }}>
                                <WeatherIntelligence role="ROLE_ADMIN" location="Hyderabad" />
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '3rem' }}>
                                {/* Pie Chart */}
                                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem', width: '100%' }}>User Distribution</h3>
                                    <div style={{ width: '100%', height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Bar Chart - Transaction Status */}
                                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>Transaction Statuses</h3>
                                    <div style={{ width: '100%', height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={transactionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                                                <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40}>
                                                    {transactionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#16a34a', '#2563eb', '#ca8a04', '#db2777'][index % 4]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TRANSACTIONS TAB */}
                    {activeTab === 'Transactions' && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '3rem', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Transaction History</h3>
                            {transactions.length === 0 ? (
                                <p style={{ color: 'var(--text-tertiary)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>No transactions found.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                                <th style={{ padding: '1rem' }}>Order ID</th>
                                                <th style={{ padding: '1rem' }}>Product</th>
                                                <th style={{ padding: '1rem' }}>Farmer</th>
                                                <th style={{ padding: '1rem' }}>Retailer</th>
                                                <th style={{ padding: '1rem' }}>Price</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                                <th style={{ padding: '1rem' }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.slice(0, 10).map((txn, index) => (
                                                <tr key={txn.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: index % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>#{txn.id}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{txn.productName}</td>
                                                    <td style={{ padding: '1rem', color: '#16A34A', fontWeight: '500' }}>{txn.farmerName}</td>
                                                    <td style={{ padding: '1rem', color: '#2563EB', fontWeight: '500' }}>{txn.retailerName}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{txn.price}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                                            backgroundColor: txn.status === 'DELIVERED' ? '#DCFCE7' : txn.status === 'SHIPPED' ? '#DBEAFE' : '#FEE2E2',
                                                            color: txn.status === 'DELIVERED' ? '#166534' : txn.status === 'SHIPPED' ? '#1E40AF' : '#991B1B'
                                                        }}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{new Date(txn.date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* APPROVALS TAB */}
                    {activeTab === 'Logistics' && (
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            {/* Weather Management Section */}
                            <section>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    🌡️ Weather Node Monitor
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {loadingWeather ? (
                                        <p>Polling Weather Nodes...</p>
                                    ) : weatherData.map(w => (
                                        <div key={w.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '15px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{w.location}</h4>
                                                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Updated: {new Date(w.lastUpdated).toLocaleTimeString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div style={{ fontSize: '2rem' }}>{w.temperature}°C</div>
                                                <div style={{ color: '#4B5563' }}>{w.condition}</div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const temp = prompt("Enter new temperature:", w.temperature);
                                                    if (temp) {
                                                        // Call a hypothetical override API
                                                        alert("Manual Override Saved (Simulated)");
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #3B82F6', color: '#3B82F6', background: 'transparent', cursor: 'pointer' }}
                                            >Manual Override</button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Crisis Response Section */}
                            <section style={{ backgroundColor: '#FEF2F2', padding: '2.5rem', borderRadius: '20px', border: '2px solid #FCA5A5' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991B1B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    🚨 Emergency Crisis Trigger
                                </h3>
                                <p style={{ color: '#B91C1C', marginBottom: '2rem' }}>Immediately broadcast alerts to all farmers and retailers in a specific region.</p>
                                
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#991B1B', fontWeight: 'bold' }}>Target Location</label>
                                        <input 
                                            value={crisisLocation}
                                            onChange={(e) => setCrisisLocation(e.target.value)}
                                            placeholder="e.g. Hyderabad, Warangal..."
                                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5' }}
                                        />
                                    </div>
                                    <div style={{ flex: 2, minWidth: '300px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#991B1B', fontWeight: 'bold' }}>Alert Message</label>
                                        <input 
                                            value={crisisMsg}
                                            onChange={(e) => setCrisisMsg(e.target.value)}
                                            placeholder="Describe the disruption..."
                                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5' }}
                                        />
                                    </div>
                                    <button 
                                        onClick={triggerRoadBlock}
                                        style={{ backgroundColor: '#DC2626', color: 'white', padding: '1rem 2.5rem', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#991B1B'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#DC2626'}
                                    >Broadcast High Risk Alert</button>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* APPROVALS TAB */}
                    {activeTab === 'Approvals' && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Pending Approvals</h3>
                            {isLoading ? (
                                <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                            ) : pendingUsers.length === 0 ? (
                                <p style={{ color: 'var(--text-tertiary)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>No pending approvals.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                            <th style={{ padding: '1rem' }}>Name</th>
                                            <th style={{ padding: '1rem' }}>Email</th>
                                            <th style={{ padding: '1rem' }}>Role</th>
                                            <th style={{ padding: '1rem' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{user.fullName}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        backgroundColor: user.role === 'ROLE_FARMER' ? '#DCFCE7' : '#FFEDD5',
                                                        color: user.role === 'ROLE_FARMER' ? '#166534' : '#9A3412',
                                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600'
                                                    }}>
                                                        {user.role === 'ROLE_FARMER' ? 'Farmer' : 'Retailer'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        className="btn"
                                                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' }}
                                                        onClick={() => handleViewDetails(user)}
                                                    >View Details</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* COMPLAINTS TAB */}
                    {activeTab === 'Complaints' && (
                        <>
                            {/* Send Message Section - Always visible in Complaints tab for easy access */}
                            <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }} onClick={handleOpenSendMsg}>
                                <div style={{ padding: '1rem', backgroundColor: '#DBEAFE', borderRadius: '50%', color: '#1E40AF' }}>
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Send New Message</h3>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Start a conversation with a specific Farmer or Retailer</p>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Complaints & Feedback</h3>
                                {complaints.length === 0 ? (
                                    <p style={{ color: 'var(--text-tertiary)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>No complaints found.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                                <th style={{ padding: '1rem' }}>User</th>
                                                <th style={{ padding: '1rem' }}>Role</th>
                                                <th style={{ padding: '1rem' }}>Date</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                                <th style={{ padding: '1rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {complaints.map(complaint => (
                                                <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{complaint.user?.fullName} ({complaint.user?.email})</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            backgroundColor: complaint.user?.role === 'ROLE_FARMER' ? '#DCFCE7' : '#FFEDD5',
                                                            color: complaint.user?.role === 'ROLE_FARMER' ? '#166534' : '#9A3412',
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                                                        }}>
                                                            {complaint.user?.role === 'ROLE_FARMER' ? 'Farmer' : 'Retailer'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(complaint.timestamp).toLocaleString()}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            backgroundColor: complaint.status === 'OPEN' ? '#FEF3C7' : '#D1FAE5',
                                                            color: complaint.status === 'OPEN' ? '#D97706' : '#059669',
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                                                        }}>
                                                            {complaint.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button
                                                            onClick={() => handleOpenChat(complaint)}
                                                            style={{
                                                                padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                                                                backgroundColor: 'var(--bg-tertiary)', color: '#2563eb', fontWeight: '600', cursor: 'pointer',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            Chat
                                                            {complaint.hasUnreadMessagesForAdmin && (
                                                                <span style={{
                                                                    position: 'absolute', top: '-5px', right: '-5px',
                                                                    width: '12px', height: '12px', backgroundColor: '#EF4444',
                                                                    borderRadius: '50%', border: '2px solid white'
                                                                }}></span>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                </main>
            </div>


            {/* Modal */}
            {showModal && selectedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', width: '500px', maxWidth: '90%', borderRadius: '20px',
                        padding: '2.5rem', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                    }}>
                        <button
                            onClick={handleCloseModal}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        >&times;</button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: selectedUser.role === 'ROLE_FARMER' ? '#DCFCE7' : '#DBEAFE',
                                display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', color: selectedUser.role === 'ROLE_FARMER' ? '#166534' : '#1E40AF', fontWeight: 'bold', marginBottom: '1rem'
                            }}>
                                {selectedUser.fullName.charAt(0).toUpperCase()}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{selectedUser.fullName}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{selectedUser.email}</p>
                            <span style={{
                                marginTop: '1rem', display: 'inline-block',
                                backgroundColor: selectedUser.role === 'ROLE_FARMER' ? '#DCFCE7' : '#FFEDD5',
                                color: selectedUser.role === 'ROLE_FARMER' ? '#166534' : '#9A3412',
                                padding: '4px 12px', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600'
                            }}>
                                {selectedUser.role === 'ROLE_FARMER' ? 'Farmer' : 'Retailer'} Application
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Phone</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedUser.mobileNumber || 'N/A'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Business Name</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedUser.businessName || 'N/A'}</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Address</label>
                                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedUser.address || 'N/A'}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Supporting Document</label>
                            <div style={{
                                padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px dashed var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', gap: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📄</span> {selectedUser.documentName || 'No document uploaded'}
                                </div>
                                {selectedUser.documentName && (
                                    <button
                                        onClick={() => handleViewDocument(selectedUser.id, selectedUser.documentName)}
                                        style={{
                                            color: '#2563eb', fontWeight: '600', background: 'none', border: 'none',
                                            cursor: 'pointer', fontSize: '0.875rem'
                                        }}
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                        </div>


                        {!selectedUser.verified && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={handleApprove}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#16a34a', color: 'white', fontWeight: '600', cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    Approve Application
                                </button>
                                <button
                                    onClick={handleReject}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #EF4444',
                                        backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: '600', cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* List Modal */}
            {showListModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', width: '800px', maxWidth: '90%', borderRadius: '16px',
                        padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                    }}>
                        <button
                            onClick={() => setShowListModal(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        >&times;</button>

                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{listModalTitle}</h3>

                        {userList.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No users found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem' }}>Business</th>
                                        <th style={{ padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{user.fullName}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.businessName || '-'}</td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn"
                                                    style={{ fontSize: '0.9rem', padding: '0.4rem 1rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                    onClick={() => handleViewDetails(user)}
                                                >View</button>
                                                <button
                                                    className="btn"
                                                    style={{ fontSize: '0.9rem', padding: '0.4rem 1rem', border: '1px solid #FECACA', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#991B1B', cursor: 'pointer', fontWeight: '500' }}
                                                    onClick={() => handleDeleteUser(user)}
                                                >Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            {showDocModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
                    backdropFilter: 'blur(4px)', padding: '2rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-color)',
                        maxWidth: '95vw',
                        maxHeight: '90vh',
                        width: 'fit-content', // Shrink to content
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-secondary)',
                            gap: '3rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '8px', color: 'var(--primary-color)' }}>
                                    <FileText size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{docName}</h3>
                            </div>
                            <button
                                onClick={handleCloseDocModal}
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.5rem',
                                    lineHeight: 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ef4444';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >&times;</button>
                        </div>
                        {/* Content */}
                        <div style={{
                            flex: 1,
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'auto',
                            minWidth: '350px'
                        }}>
                            {/* Check if image vs PDF/other */}
                            {(docName && docName.toLowerCase().endsWith('.pdf')) ? (
                                <iframe
                                    src={docUrl}
                                    title="Document Viewer"
                                    style={{ width: '85vw', height: '80vh', border: 'none' }}
                                />
                            ) : (
                                <img
                                    src={docUrl}
                                    alt={docName}
                                    onLoad={(e) => {
                                        // Optional: You could do something when image loads
                                    }}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 'calc(90vh - 80px)', // Adjust for header
                                        display: 'block',
                                        objectFit: 'contain',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                    onError={(e) => {
                                        // Fallback to iframe if it's not a valid preview image
                                        e.target.style.display = 'none';
                                        const parent = e.target.parentElement;
                                        const iframe = document.createElement('iframe');
                                        iframe.src = docUrl;
                                        iframe.style.width = '80vw';
                                        iframe.style.height = '80vh';
                                        iframe.style.border = 'none';
                                        parent.appendChild(iframe);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Logout Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />

            {/* Chat Modal */}
            {
                showChatModal && selectedComplaint && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)', width: '600px', maxWidth: '90%', borderRadius: '16px',
                            padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            display: 'flex', flexDirection: 'column', maxHeight: '80vh', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                        }}>
                            <button
                                onClick={() => setShowChatModal(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                            >&times;</button>

                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                Conversation with {selectedComplaint.user?.fullName}
                            </h3>

                            {/* Chat History */}
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                {/* Original Complaint */}
                                {(() => {
                                    const isSystem = selectedComplaint.isAdminInitiated || selectedComplaint.message.startsWith('System Message: ');
                                    const displayMsg = selectedComplaint.message.replace(/^System Message:\s*/, '');

                                    return (
                                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: isSystem ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                backgroundColor: isSystem ? '#DBEAFE' : 'var(--bg-secondary)',
                                                color: isSystem ? '#1E40AF' : 'var(--text-secondary)',
                                                padding: '0.75rem 1rem', borderRadius: '12px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', maxWidth: '80%', border: isSystem ? 'none' : '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', color: isSystem ? '#1e3a8a' : 'var(--text-tertiary)' }}>
                                                    {isSystem ? 'Admin (You)' : selectedComplaint.user?.fullName}
                                                </div>
                                                {displayMsg}
                                            </div>
                                        </div>
                                    );
                                })()}


                                {selectedComplaint.responses && selectedComplaint.responses.map(res => (
                                    <div key={res.id} style={{ marginBottom: '1rem', display: 'flex', justifyContent: res.responder.role === 'ROLE_ADMIN' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            backgroundColor: res.responder.role === 'ROLE_ADMIN' ? '#DBEAFE' : 'var(--bg-secondary)',
                                            color: res.responder.role === 'ROLE_ADMIN' ? '#1E40AF' : 'var(--text-secondary)',
                                            padding: '0.75rem 1rem', borderRadius: '12px',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', maxWidth: '80%', border: res.responder.role === 'ROLE_ADMIN' ? 'none' : '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', color: res.responder.role === 'ROLE_ADMIN' ? '#1e3a8a' : 'var(--text-tertiary)' }}>
                                                {res.responder.role === 'ROLE_ADMIN' ? 'Admin (You)' : res.responder.fullName}
                                            </div>
                                            {res.message}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Type your reply..."
                                    value={chatReply}
                                    onChange={(e) => setChatReply(e.target.value)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                />
                                <button
                                    onClick={handleSendReply}
                                    style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Send New Message Modal */}
            {
                showSendMsgModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)', width: '500px', maxWidth: '90%', borderRadius: '16px',
                            padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                        }}>
                            <button
                                onClick={() => setShowSendMsgModal(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                            >&times;</button>

                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Send New Message</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Select Role</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <input
                                            type="radio"
                                            name="role"
                                            checked={msgTargetRole === 'farmer'}
                                            onChange={() => fetchTargetUsers('farmer')}
                                        />
                                        Farmer
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <input
                                            type="radio"
                                            name="role"
                                            checked={msgTargetRole === 'retailer'}
                                            onChange={() => fetchTargetUsers('retailer')}
                                        />
                                        Retailer
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Select User</label>
                                <select
                                    value={msgSelectedUser}
                                    onChange={(e) => setMsgSelectedUser(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="" disabled>-- Select a User --</option>
                                    {msgTargetList.map(u => (
                                        <option key={u.id} value={u.id}>{u.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Message</label>
                                <textarea
                                    value={msgBody}
                                    onChange={(e) => setMsgBody(e.target.value)}
                                    rows="4"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                    placeholder="Type your message here..."
                                ></textarea>
                            </div>

                            <button
                                onClick={handleSendNewMsg}
                                style={{
                                    width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white',
                                    border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Send Message
                            </button>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default AdminDashboard;
