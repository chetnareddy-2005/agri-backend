import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'inherit'
            }}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Sun size={24} className="text-yellow-500" style={{ color: '#F59E0B' }} />
            ) : (
                <Moon size={24} className="text-blue-400" style={{ color: '#60A5FA' }} />
            )}
        </button>
    );
};

export default ThemeToggle;
