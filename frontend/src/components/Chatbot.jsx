import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, ChevronRight, ChevronLeft, Home, User, ShoppingCart, Tractor, ShieldCheck } from 'lucide-react';

const faqData = {
    // Default / Landing Page
    main: [
        { id: 'start', label: 'Getting Started', icon: '🚀' },
        { id: 'farmer', label: 'For Farmers', icon: '👨‍🌾' },
        { id: 'retailer', label: 'For Retailers', icon: '🛒' },
    ],
    // Farmer Dashboard Specific
    'farmer-dashboard': [
        { id: 'list', label: 'How to list a product?', answer: "Go to 'Add Listing'. Fill in details. Choose 'Auction' for bidding or 'Direct Sale' for fixed price." },
        { id: 'payment', label: 'Payment tracking', answer: "Check 'Total Revenue' on your dashboard. Payments are processed after the retailer confirms delivery." },
        { id: 'bid_status', label: 'Managing Bids', answer: "Active bids can be seen in the 'Active Auctions' section. You can accept the highest bid once time expires." },
        { id: 'orders', label: 'Order Statuses', answer: "Mark orders as 'Shipped' when sent and 'Delivered' when they reach the retailer." }
    ],
    // Retailer Dashboard Specific
    'retailer-dashboard': [
        { id: 'marketplace', label: 'Finding Products', answer: "Browse the 'Marketplace' to see all fresh produce listed by farmers." },
        { id: 'bidding', label: 'How to Bid?', answer: "Select an item in auction, enter your amount higher than the current bid, and click 'Place Bid'." },
        { id: 'feedback', label: 'Leaving Feedback', answer: "After delivery, go to 'My Orders' and click 'Rate Farmer' to share your experience." },
        { id: 'complaints', label: 'Help & Complaints', answer: "Use the 'Help' tab to send messages directly to the Admin for any issues." }
    ],
    // Admin Dashboard Specific
    'admin-dashboard': [
        { id: 'approvals', label: 'User Approvals', answer: "Go to 'Approvals' to review documents and approve/reject new Farmer and Retailer applications." },
        { id: 'stats', label: 'Platform Stats', answer: "The 'Overview' tab shows total users, revenue distribution, and transaction health." },
        { id: 'chats', label: 'Handling Complaints', answer: "Click 'Complaints' to view and reply to messages from farmers and retailers." },
        { id: 'deleting', label: 'User Management', answer: "You can delete users from the 'Overview' stats by clicking on 'Farmers' or 'Retailers' count." }
    ],
    start: [
        { id: 'register', label: 'How do I register?', answer: "Click 'Sign Up' on the home page. Choose 'Farmer' to sell or 'Retailer' to buy. You'll need to upload a document for verification." },
        { id: 'login', label: 'Login issues', answer: "Make sure your account is approved by the admin. If you forgot your password, use the 'Forgot Password' link on the login page." },
        { id: 'docs', label: 'What documents?', answer: "A valid ID or business license is required to ensure a trusted marketplace." }
    ],
    farmer: [
        { id: 'list', label: 'How to list products?', answer: "Go to your Dashboard > 'Add Listing'. Fill in the details. Choose 'Auction' for bidding or 'Direct Sale' for fixed price." },
        { id: 'payment', label: 'Getting paid', answer: "Payment is processed after you mark the order as 'Delivered' and the Retailer confirms receipt." }
    ],
    retailer: [
        { id: 'buy', label: 'How to buy?', answer: "Browse the 'Marketplace'. Use 'Buy Now' for instant purchase or 'Place Bid' for auction items." },
        { id: 'feedback', label: 'Leaving feedback', answer: "After an order is 'Delivered', go to 'My Orders' and click 'Rate' to leave feedback for the farmer." }
    ]
};

const Chatbot = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState(['main']);
    const [currentView, setCurrentView] = useState('main');
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const messagesEndRef = useRef(null);

    // Context Awareness Logic
    useEffect(() => {
        let view = 'main';
        if (location.pathname.includes('/farmer/dashboard')) view = 'farmer-dashboard';
        else if (location.pathname.includes('/retailer/dashboard')) view = 'retailer-dashboard';
        else if (location.pathname.includes('/admin/dashboard')) view = 'admin-dashboard';

        setCurrentView(view);
        setHistory([view]);
        setSelectedAnswer(null);
    }, [location.pathname]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentView, selectedAnswer, isOpen]);

    const handleOptionClick = (id) => {
        if (faqData[id]) {
            setHistory([...history, id]);
            setCurrentView(id);
            setSelectedAnswer(null);
        }
    };

    const handleQuestionClick = (item) => {
        setSelectedAnswer(item);
    };

    const handleBack = () => {
        if (selectedAnswer) {
            setSelectedAnswer(null);
            return;
        }
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop();
            setHistory(newHistory);
            setCurrentView(newHistory[newHistory.length - 1]);
        }
    };

    const handleReset = () => {
        let view = 'main';
        if (location.pathname.includes('/farmer/dashboard')) view = 'farmer-dashboard';
        else if (location.pathname.includes('/retailer/dashboard')) view = 'retailer-dashboard';
        else if (location.pathname.includes('/admin/dashboard')) view = 'admin-dashboard';

        setHistory([view]);
        setCurrentView(view);
        setSelectedAnswer(null);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: '"Inter", sans-serif' }}>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '50%',
                        width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)', cursor: 'pointer', transition: 'all 0.3s ease'
                    }}
                >
                    <MessageCircle size={30} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '350px', height: '500px', backgroundColor: 'white', borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', border: '1px solid #E5E7EB', animation: 'fadeIn 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        backgroundColor: '#16a34a', padding: '1rem', color: 'white', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ backgroundColor: 'white', padding: '6px', borderRadius: '50%' }}>
                                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>FarmBot</h3>
                                <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.9 }}>Here to help!</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(!['main', 'farmer-dashboard', 'retailer-dashboard', 'admin-dashboard'].includes(currentView) || selectedAnswer) && (
                                <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="Main Menu">
                                    <Home size={18} />
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Greeting */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
                            <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0 12px 12px 12px', border: '1px solid #E5E7EB', maxWidth: '80%', color: 'black', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                {(() => {
                                    if (selectedAnswer) return "Hope this answer helps! Anything else?";
                                    if (currentView === 'farmer-dashboard') return "Hi Farmer! How can I help you manage your listings and orders today?";
                                    if (currentView === 'retailer-dashboard') return "Welcome back! Looking for something specific in the marketplace or need help with a bid?";
                                    if (currentView === 'admin-dashboard') return "Logged in as Admin. Need help navigating system stats or managing user requests?";
                                    if (currentView === 'main') return "Hi there! I'm your assistant. How can I help you explore the platform today?";
                                    return "How can I help you with these specific questions?";
                                })()}
                            </div>
                        </div>

                        {/* Options / Questions */}
                        {!selectedAnswer ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '40px' }}>
                                {faqData[currentView]?.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => item.answer ? handleQuestionClick(item) : handleOptionClick(item.id)}
                                        style={{
                                            padding: '0.75rem', backgroundColor: 'white', border: '1px solid #16a34a',
                                            borderRadius: '8px', color: '#16a34a', fontWeight: '500', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#16a34a';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.color = '#16a34a';
                                        }}
                                    >
                                        <span>{item.icon} {item.label}</span>
                                        {!item.answer && <ChevronRight size={16} />}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* User Question Bubble */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ backgroundColor: '#16a34a', padding: '0.75rem', borderRadius: '12px 0 12px 12px', color: 'white', maxWidth: '80%', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        {selectedAnswer.label}
                                    </div>
                                </div>

                                {/* Bot Answer Bubble */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
                                    <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0 12px 12px 12px', border: '1px solid #E5E7EB', maxWidth: '80%', color: 'black', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        {selectedAnswer.answer}
                                    </div>
                                </div>
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Back Button */}
                    {(!['main', 'farmer-dashboard', 'retailer-dashboard', 'admin-dashboard'].includes(currentView) || selectedAnswer) && (
                        <div style={{ padding: '0.75rem', borderTop: '1px solid #E5E7EB', backgroundColor: 'white' }}>
                            <button
                                onClick={handleBack}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none',
                                    color: '#6B7280', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'
                                }}
                            >
                                <ChevronLeft size={18} /> Back
                            </button>
                        </div>
                    )}
                </div>
            )}
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
};

export default Chatbot;
