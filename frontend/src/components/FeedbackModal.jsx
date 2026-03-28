import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const FeedbackModal = ({ order, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);

    if (!order) return null;

    const handleSubmit = () => {
        if (rating === 0) {
            alert("Please provide a rating");
            return;
        }
        onSubmit(order.id, rating, comment);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px',
                position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} color="var(--text-tertiary)" />
                </button>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>Rate your Experience</h3>
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                    How was your order for <strong>{order.product?.name}</strong> from <strong>{order.product?.farmer?.fullName}</strong>?
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <Star
                                size={32}
                                fill={(hoveredRating || rating) >= star ? "#F59E0B" : "transparent"}
                                color={(hoveredRating || rating) >= star ? "#F59E0B" : "#D1D5DB"}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    placeholder="Provide additional feedback (optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{
                        width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '8px',
                        border: '1px solid #D1D5DB', marginBottom: '1.5rem', resize: 'vertical'
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}>
                        Skip
                    </button>
                    <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: '#166534', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Submit Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
