
import React from 'react';
import { Leaf } from 'lucide-react';
import logo from '../assets/logo.png'; // Assuming logo is placed here

const InvoiceTemplate = ({ order, id }) => {
    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('en-GB');
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    // Use order created date or fallback to now
    // Backend entity 'Order' field is 'orderDate'
    const orderDateStr = order?.orderDate || order?.createdAt;
    const orderDateObj = orderDateStr ? new Date(orderDateStr) : new Date();
    const invoiceDate = formatDate(orderDateObj);

    // Due Date = Order Date + 7 days
    const dueDateObj = new Date(orderDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + 7);
    const dueDate = formatDate(dueDateObj.toISOString());

    return (
        <div id={id} style={{
            width: '100%',
            maxWidth: '800px',
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
                backgroundColor: '#5EEAD4', // Teal-300
                borderBottomRightRadius: '100%',
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '60%',
                height: '120px',
                backgroundColor: '#2DD4BF', // Teal-400
                borderBottomRightRadius: '100%',
                zIndex: 1
            }}></div>

            {/* Header Content */}
            <div style={{ position: 'relative', zIndex: 2, padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#134E4A', margin: 0, letterSpacing: '2px' }}>INVOICE</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {/* Logo Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '0.5rem' }}>
                        <img src={logo} alt="Farm2Trade Logo" style={{ height: '40px', objectFit: 'contain' }} />
                    </div>
                </div>
            </div>

            {/* Invoice Info Grid */}
            <div style={{ padding: '0 3rem', marginTop: '2rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>

                {/* Left Column */}
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Date:</strong> {invoiceDate}</p>
                        <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Due Date:</strong> {dueDate}</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0F766E', marginBottom: '0.5rem' }}>Bill To:</h3>
                        <p style={{ margin: '2px 0', fontWeight: '600', color: '#111827' }}>{order?.retailer?.fullName || 'Retailer Name'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>{order?.retailer?.address || 'Address Line 1'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>Phone: {order?.retailer?.mobileNumber || '1234567890'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>Email: {order?.retailer?.email || 'email@example.com'}</p>
                    </div>
                </div>

                {/* Right Column: Company & Payment Info */}
                <div>
                    <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0F766E', marginBottom: '0.5rem' }}>Sold By:</h3>
                        <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#111827' }}>{order?.product?.farmer?.fullName || 'Farmer Name'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>{order?.product?.farmer?.address || 'Farmer Location'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>Phone: {order?.product?.farmer?.mobileNumber || 'N/A'}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>Email: {order?.product?.farmer?.email || 'N/A'}</p>
                    </div>


                </div>
            </div>

            {/* Items Table */}
            <div style={{ padding: '0 3rem', marginTop: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#CCFBF1', color: '#0F766E' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase' }}>No</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase' }}>Product Description</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', textTransform: 'uppercase' }}>Unit Price</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', textTransform: 'uppercase' }}>Qty</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem' }}>01</td>
                            <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', fontWeight: '500' }}>
                                {order?.product?.name || 'Product Name'}
                                <div style={{ fontSize: '0.75rem', color: 'black', marginTop: '4px' }}>Category: {order?.product?.category || 'General'}</div>
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>{formatCurrency(order?.product?.price || 0)}</td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>{order?.quantity || 1} {order?.product?.unit || 'Units'}</td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold' }}>{formatCurrency(order?.totalPrice || 0)}</td>
                        </tr>
                        {/* Empty rows to fill space if needed, or just let it adjust */}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div style={{ padding: '0 3rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', color: '#4B5563' }}>
                        <span>SUB TOTAL</span>
                        <span>{formatCurrency(order?.totalPrice || 0)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '2px solid #2DD4BF', marginTop: '0.5rem', fontWeight: 'bold', color: '#0F766E', fontSize: '1.1rem' }}>
                        <span>Grand Total</span>
                        <span>{formatCurrency(order?.totalPrice || 0)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '3rem', padding: '0 3rem', textAlign: 'center' }}>
                <h4 style={{ color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Thank you for your business</h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <h5 style={{ color: '#0F766E', marginBottom: '0.5rem' }}>TERMS & CONDITIONS</h5>
                        <p style={{ fontSize: '0.7rem', color: 'black', maxWidth: '300px' }}>
                            Payment is due within 7 days. Please include the invoice number on your check or money order.
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        {/* Mock Signature */}
                        <div style={{ fontFamily: 'Cursive', fontSize: '1.5rem', color: '#111827', marginBottom: '4px' }}>Farm2Trade</div>
                        <div style={{ borderTop: '1px solid #111827', width: '150px', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Authorized Signatory</div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{ backgroundColor: '#CCFBF1', height: '30px', marginTop: '2rem' }}></div>
        </div>
    );
};

export default InvoiceTemplate;
