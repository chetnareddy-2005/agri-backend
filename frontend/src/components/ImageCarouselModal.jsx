import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ImageCarouselModal = ({ productId, onClose }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchImages = async () => {
            if (!productId) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/images`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setImages(data);
                    } else {
                        // Fallback: try fetching single image if list is empty (unlikely given backend logic but good for safety)
                        const singleRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/image`, { credentials: 'include' });
                        if (singleRes.ok) {
                            const txt = await singleRes.text();
                            if (txt.length > 50) setImages([txt]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching product images:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [productId]);

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!productId) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }} onClick={onClose}>

            <div style={{ position: 'relative', width: '90%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    <X size={32} />
                </button>

                {loading ? (
                    <div style={{ color: 'white' }}>Loading images...</div>
                ) : images.length === 0 ? (
                    <div style={{ color: 'white' }}>No images available.</div>
                ) : (
                    <>
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {images.length > 1 && (
                                <button
                                    onClick={handlePrev}
                                    style={{
                                        position: 'absolute', left: '-50px', background: 'rgba(255,255,255,0.8)',
                                        border: 'none', borderRadius: '50%', width: '48px', height: '48px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#111827', zIndex: 10,
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    <ChevronLeft size={32} />
                                </button>
                            )}

                            <img
                                src={images[currentIndex]}
                                alt={`Product ${currentIndex + 1}`}
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                            />

                            {images.length > 1 && (
                                <button
                                    onClick={handleNext}
                                    style={{
                                        position: 'absolute', right: '-50px', background: 'rgba(255,255,255,0.8)',
                                        border: 'none', borderRadius: '50%', width: '48px', height: '48px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#111827', zIndex: 10,
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    <ChevronRight size={32} />
                                </button>
                            )}
                        </div>

                        {/* Dots */}
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageCarouselModal;
