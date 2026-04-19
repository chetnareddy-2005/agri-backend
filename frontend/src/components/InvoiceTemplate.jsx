
import React from 'react';
import { Leaf } from 'lucide-react';
import logo from '../assets/logo.png'; 

const InvoiceTemplate = ({ order, id, role: propRole }) => {
    // Determine role: use prop if provided, else check localStorage
    const userRole = propRole || JSON.parse(localStorage.getItem('user') || '{}').role || 'RETAILER';

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('en-GB');
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const orderDateStr = order?.orderDate || order?.createdAt;
    const orderDateObj = orderDateStr ? new Date(orderDateStr) : new Date();
    const invoiceDate = formatDate(orderDateObj);

    const dueDateObj = new Date(orderDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + 7);
    const dueDate = formatDate(dueDateObj.toISOString());

    // Role-based logic
    const isFarmer = userRole === 'FARMER';
    const isRetailer = userRole === 'RETAILER';
    const isTransporter = userRole === 'TRANSPORTER';

    // Totals
    const productSubtotal = order?.totalPrice || 0;
    const logisticsCharge = order?.transport?.updatedPrice || 0;
    
    let grandTotal = 0;
    if (isFarmer) grandTotal = productSubtotal;
    else if (isTransporter) grandTotal = logisticsCharge;
    else grandTotal = productSubtotal + logisticsCharge;

    const invoiceTitle = isFarmer ? "Farmer Invoice" : isTransporter ? "Transporter Invoice" : "Retailer Invoice";

    return (
        <div id={id} style={{
            width: '100%',
            maxWidth: '801px', // Slightly adjusted for PDF clarity
            backgroundColor: 'white',
            fontFamily: '"Inter", sans-serif',
            color: 'black',
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: '2rem'
        }}>
            {/* Top Curve Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '70%',
                height: '150px',
                backgroundColor: '#5EEAD4',
                borderBottomRightRadius: '100%',
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '60%',
                height: '120px',
                backgroundColor: '#2DD4BF',
                borderBottomRightRadius: '100%',
                zIndex: 1
            }}></div>

            {/* Header Content */}
            <div style={{ position: 'relative', zIndex: 2, padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#134E4A', margin: 0, letterSpacing: '1px' }}>{invoiceTitle.toUpperCase()}</h1>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#0F766E', fontWeight: 'bold' }}>#{order?.id || 'INV-000'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '0.5rem' }}>
                        <img src={logo} alt="Farm2Trade Logo" style={{ height: '40px', objectFit: 'contain' }} />
                    </div>
                </div>
            </div>

            {/* Invoice Info Grid */}
            <div style={{ padding: '0 3rem', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Left Column */}
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Date:</strong> {invoiceDate}</p>
                        <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Due Date:</strong> {dueDate}</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0F766E', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Bill To:</h3>
                        <p style={{ margin: '2px 0', fontWeight: '600', color: '#111827' }}>{order?.retailer?.fullName || 'Retailer Name'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>{order?.retailer?.address || 'Address Line 1'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>Phone: {order?.retailer?.mobileNumber || 'N/A'}</p>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0F766E', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Sold By:</h3>
                        <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#111827' }}>{order?.product?.farmer?.fullName || 'Farmer Name'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>{order?.product?.farmer?.address || 'Farmer Location'}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ padding: '0 3rem', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#CCFBF1', color: '#0F766E' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>No</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit Price</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Product Detail - Hide for Transporter */}
                        {!isTransporter && (
                            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>01</td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                    {order?.product?.name || 'Product'}
                                    <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>Category: {order?.product?.category}</div>
                                </td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>{formatCurrency(order?.product?.price || 0)}</td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>{order?.quantity || 1} {order?.product?.unit}</td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold' }}>{formatCurrency(productSubtotal)}</td>
                            </tr>
                        )}
                        
                        {/* Transport Detail - Hide for Farmer */}
                        {!isFarmer && order?.transport && (
                            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>{isTransporter ? '01' : '02'}</td>
                                <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', fontWeight: '500' }}>
                                    Logistics & Transport
                                    <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
                                        Driver: {order.transport.driver?.user?.fullName || 'Assigned Driver'}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>-</td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>1 Trip</td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold' }}>{formatCurrency(logisticsCharge)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div style={{ padding: '0 3rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '250px' }}>
                    {!isTransporter && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem', color: '#4B5563' }}>
                            <span>PRODUCT SUBTOTAL</span>
                            <span>{formatCurrency(productSubtotal)}</span>
                        </div>
                    )}

                    {!isFarmer && order?.transport && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem', color: '#4B5563' }}>
                            <span>LOGISTICS CHARGE</span>
                            <span>{formatCurrency(logisticsCharge)}</span>
                        </div>
                    )}

                    <div style={{ 
                        display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', 
                        borderTop: '2px solid #2DD4BF', marginTop: '0.5rem', fontWeight: 'bold', 
                        color: '#0F766E', fontSize: '1.1rem' 
                    }}>
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '2.5rem', padding: '0 3rem', textAlign: 'center' }}>
                <h4 style={{ color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Thank you for your business</h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <h5 style={{ color: '#0F766E', marginBottom: '0.3rem', fontSize: '0.8rem' }}>TERMS & CONDITIONS</h5>
                        <p style={{ fontSize: '0.65rem', color: '#4B5563', maxWidth: '250px' }}>
                            Payment is due within 7 days. This is a computer-generated invoice and does not require a physical signature for verification.
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Cursive', fontSize: '1.25rem', color: '#111827', marginBottom: '2px' }}>Farm2Trade</div>
                        <div style={{ borderTop: '1px solid #111827', width: '150px', paddingTop: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>Authorized Signatory</div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{ backgroundColor: '#CCFBF1', height: '20px', marginTop: '2rem' }}></div>
        </div>
    );
};

export default InvoiceTemplate;
