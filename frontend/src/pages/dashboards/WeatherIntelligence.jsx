import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, AlertTriangle, ShieldCheck, Zap, Info, TrendingUp, BarChart3, Edit, Save } from 'lucide-react';
import '../../styles/global.css';

const WeatherIntelligence = ({ role, location = "Hyderabad" }) => {
    const [weather, setWeather] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [overrideData, setOverrideData] = useState({});

    useEffect(() => {
        fetchWeatherData();
    }, [location]);

    const fetchWeatherData = async () => {
        try {
            const [wRes, aiRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/weather/${location}`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/weather/${location}/${role === 'ROLE_FARMER' ? 'farmer-ai' : 'retailer-ai'}`, { credentials: 'include' })
            ]);

            if (wRes.ok) {
                const data = await wRes.json();
                setWeather(data);
                setOverrideData(data);
            }
            if (aiRes.ok) setAiInsights(await aiRes.json());
        } catch (err) {
            console.error("Weather Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOverride = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/weather/${weather.id}/override`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(overrideData)
            });
            if (res.ok) {
                setIsEditing(false);
                fetchWeatherData();
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div style={{ padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '15px' }}>Loading Weather Intelligence...</div>;

    const getIcon = (condition) => {
        const c = condition?.toLowerCase();
        if (c?.contains('rain')) return <CloudRain size={40} color="#3B82F6" />;
        if (c?.contains('sun')) return <Sun size={40} color="#F59E0B" />;
        return <Cloud size={40} color="#64748B" />;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Real-time Weather Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>🌦️ {location} Weather Intelligence</h3>
                    {role === 'ROLE_ADMIN' && (
                        <button onClick={() => isEditing ? handleSaveOverride() : setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {isEditing ? <><Save size={16}/> Save</> : <><Edit size={16}/> Override</>}
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #F1F5F9' }}>
                        {getIcon(weather?.condition)}
                        {isEditing ? (
                            <input value={overrideData.temperature} onChange={e => setOverrideData({...overrideData, temperature: e.target.value})} style={{ width: '60px', marginTop: '5px' }} />
                        ) : (
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0F172A' }}>{weather?.temperature?.toFixed(0)}°C</div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 'bold' }}>{weather?.condition}</div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Droplets size={18} color="#3B82F6" />
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 'bold' }}>HUMIDITY</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{weather?.humidity}%</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wind size={18} color="#10B981" />
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 'bold' }}>WIND</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{weather?.windSpeed} km/h</div>
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            {weather?.alerts ? (
                                <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={14} /> ALERT: {weather.alerts}
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldCheck size={14} /> CONDITIONS: Stable for Harvest
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Decision Hub */}
            <div style={{ backgroundColor: '#0F172A', color: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                    <Zap size={20} color="#F59E0B" fill="#F59E0B" />
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>AI LOGISTICS & PLANNING ENGINE</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {role === 'ROLE_FARMER' ? (
                      <>
                        <div style={{ borderLeft: '3px solid #3B82F6', paddingLeft: '15px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 5px' }}>🌾 CROP ADVISORY</h4>
                           <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{aiInsights?.crop}</p>
                        </div>
                        <div style={{ borderLeft: '3px solid #10B981', paddingLeft: '15px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 5px' }}>📅 HARVEST TIMING</h4>
                           <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{aiInsights?.timing}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ borderLeft: '3px solid #F59E0B', paddingLeft: '15px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: '#B45309', margin: '0 0 5px' }}>📈 DEMAND PREDICTION</h4>
                           <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{aiInsights?.demand}</p>
                        </div>
                        <div style={{ borderLeft: '3px solid #EF4444', paddingLeft: '15px' }}>
                           <h4 style={{ fontSize: '0.8rem', color: '#991B1B', margin: '0 0 5px' }}>💰 PRICING INSIGHT</h4>
                           <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{aiInsights?.pricing}</p>
                        </div>
                      </>
                    )}
                </div>
            </div>

            {/* Price Trend Impact Summary */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '18px', padding: '1rem', border: '1px dashed #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.8rem', fontWeight: '800' }}>
                    <BarChart3 size={16} /> LOGISTICS IMPACT SUMMARY
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748B', lineHeight: '1.4' }}>
                   Weather-based surge of <strong>{weather?.condition?.contains('Rain') ? '+25%' : '0%'}</strong> currently applied to local transport routes.
                </p>
            </div>
        </div>
    );
};

export default WeatherIntelligence;
