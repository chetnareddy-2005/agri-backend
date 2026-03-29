import React, { useState, useEffect } from 'react';

const ProductImage = ({ productId }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/image`, { credentials: 'include' });
                if (res.ok) {
                    const text = await res.text();
                    if (text && text.length > 50) { // Basic check for valid Base64 length
                        setImageSrc(text);
                    }
                }
            } catch (err) {
                console.error("Error loading image for " + productId, err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchImage();
    }, [productId]);

    if (loading) {
        return <div style={{ height: '120px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Loading...</div>;
    }

    if (!imageSrc) {
        return <div style={{ height: '120px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Image Placeholder</div>;
    }

    return (
        <img
            src={imageSrc}
            alt="Product"
            style={{
                height: '120px',
                width: '100%',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '1rem'
            }}
        />
    );
};

export default ProductImage;
