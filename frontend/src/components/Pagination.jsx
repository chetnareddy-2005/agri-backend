import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    // Simple logic for now: show all pages if <= 7. 
    // If more, we might want ellipsis, but let's start simple or use a focused window.
    // For robust but simple UI: Show First, Last, and window around current.

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.5rem', borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
            >
                <ChevronLeft size={20} />
            </button>

            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        1
                    </button>
                    {startPage > 2 && <span style={{ color: 'var(--text-tertiary)' }}>...</span>}
                </>
            )}

            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: '6px',
                        border: page === currentPage ? 'none' : '1px solid var(--border-color)',
                        backgroundColor: page === currentPage ? '#16a34a' : 'var(--bg-secondary)', // Primary Green
                        color: page === currentPage ? 'white' : 'var(--text-primary)',
                        fontWeight: page === currentPage ? 'bold' : 'normal',
                        cursor: 'pointer'
                    }}
                >
                    {page}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span style={{ color: 'var(--text-tertiary)' }}>...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.5rem', borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default Pagination;
