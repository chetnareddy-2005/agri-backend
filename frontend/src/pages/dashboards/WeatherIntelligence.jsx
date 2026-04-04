import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, AlertTriangle, ShieldCheck, Zap, Info, TrendingUp, BarChart3, Edit, Save, Search, X, MapPin } from 'lucide-react';
import '../../styles/global.css';

const WeatherIntelligence = ({ role, location = "Hyderabad" }) => {
    const [currentLocation, setCurrentLocation] = useState(location);
    const [searchQuery, setSearchQuery] = useState('');
    const [weather, setWeather] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [overrideData, setOverrideData] = useState({});
    const [activeCard, setActiveCard] = useState(null);

    useEffect(() => {
        if (location) {
            setCurrentLocation(location);
        }
    }, [location]);

    useEffect(() => {
        fetchWeatherData();
    }, [currentLocation, role]);

    const fetchWeatherData = async () => {
        setLoading(true);
        try {
            // Smart extraction: if location has commas, take the city part (usually the end)
            let searchTarget = currentLocation;
            if (currentLocation.includes(',')) {
                const parts = currentLocation.split(',');
                searchTarget = parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim();
            }

            const [wRes, aiRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/weather/${encodeURIComponent(searchTarget)}`, { credentials: 'include' }),
                fetch(`${import.meta.env.VITE_API_URL}/api/weather/${encodeURIComponent(searchTarget)}/${role === 'ROLE_FARMER' ? 'farmer-ai' : 'retailer-ai'}`, { credentials: 'include' })
            ]);

            if (wRes.ok) {
                const data = await wRes.json();
                if (!data || !data.temperature) throw new Error("Invalid response");
                setWeather(data);
                setOverrideData(data);
            } else {
                // Fallback to Hyderabad if city not found
                const fallback = await fetch(`${import.meta.env.VITE_API_URL}/api/weather/Hyderabad`, { credentials: 'include' });
                if (fallback.ok) setWeather(await fallback.json());
            }
            
            if (aiRes.ok) setAiInsights(await aiRes.json());
        } catch (err) {
            console.error("Weather Error:", err);
            // Deep fallback to prevent blank screen
            setWeather({ temperature: 25.0, weatherCondition: 'Clear (Auto Fallback)', humidity: 55, windSpeed: 12 });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setCurrentLocation(searchQuery.trim());
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

    const getExtraDetails = (type) => {
        const isRain = weather?.weatherCondition?.toLowerCase().includes('rain');
        const isHot = weather?.temperature > 35;

        const details = {
            crop: {
                title: "🌾 CROP ADVISORY",
                icon: "🌾",
                color: "#2ECC71",
                meaning: isRain ? "High atmospheric moisture & groundwater recharge detected." : isHot ? "Thermal stress & high evaporation detected." : "Weather is clear (no rain, good sunlight ☀️)",
                grow: isRain ? "Rice, Sugarcane, Jute" : isHot ? "Millets, Sorghum, Maize" : "Vegetables, Grains",
                why: isRain ? "These crops flourish in high-moisture soil and saturated conditions." : isHot ? "These crops are drought-resistant and tolerate high temperatures." : "These crops need sunlight ☀️ and less moisture for optimal growth."
            },
            timing: {
                title: "📅 HARVEST TIMING",
                icon: "📅",
                color: "#3498DB",
                meaning: isRain ? "Unstable atmosphere with imminent precipitation." : isHot ? "Optimal dry conditions but high thermal risk for labor." : "Today's weather is Dry with no rain.",
                action: isRain ? "Delay harvesting to prevent post-harvest rot." : isHot ? "Execute harvest in early morning to protect grain quality." : "This is the best time to harvest crops like rice, wheat, etc.",
                why: isRain ? "Moisture trapped in harvested crops leads to fungal growth." : isHot ? "Intense midday heat can cause grains to crack or lose moisture too fast." : "Zero precipitation ensures crops stay dry and easy to store."
            },
            logistics: {
                title: "🚚 LOGISTICS ADVISORY",
                icon: "🚚",
                color: "#F59E0B",
                meaning: isRain ? "Road friction reduced and visibility likely compromised." : isHot ? "High risk of vehicle overheating and perishable spoilage." : "Clear weather ensures stable road conditions.",
                tip: isRain ? "Expect 20-30% slower transit times." : isHot ? "Perishables require active cooling during transit." : "Minimal delays expected; transport routes at 100% efficiency.",
                why: isRain ? "Safety protocols require lower speeds during heavy rain." : isHot ? "Engine strain increases significantly at high ambient temperatures." : "Optimal visibility and dry roads support maximum efficiency."
            },
            risk: {
                title: "⚠️ RISK ASSESSMENT",
                icon: "⚠️",
                color: "#E74C3C",
                meaning: isRain ? "Elevated flood and erosion risk." : isHot ? "Heatwave conditions detected." : "No adverse weather conditions detected.",
                action: isRain ? "Clear drainage channels and secure topsoil." : isHot ? "Prioritize hydration for livestock and staff." : "Operations can proceed safely.",
                why: isRain ? "Localized runoff can wash away young seedlings." : isHot ? "Extreme heat causes biological stress in both plants and animals." : "Atmospheric stability minimize threats to agricultural infrastructure."
            },
            demand: {
                title: "📈 DEMAND PREDICTION",
                icon: "📈",
                color: "#F59E0B",
                meaning: isRain ? "Higher demand for shelf-stable goods as fresh supply slows." : isHot ? "Spike in demand for perishable hydration crops." : "Stable market demand across all produce categories.",
                action: "Adjust inventory levels by 15% to match weather trends.",
                why: "Weather patterns dictate consumer buying power and travel capacity."
            },
            pricing: {
                title: "💰 PRICING INSIGHT",
                icon: "💰",
                color: "#EF4444",
                meaning: isRain ? "Logistics costs rising due to transit delays." : isHot ? "Storage costs increasing for active cooling." : "Standard pricing models remains valid.",
                action: "Suggesting a +5% buffer on perishable pricing.",
                why: "Energy costs for cooling and fuel surcharges are weather-dependent."
            }
        };
        return details[type] || details['crop'];
    };

    if (loading) return <div style={{ padding: '2rem', border: '1px solid #E5E7EB', borderRadius: '15px' }}>Loading Weather Intelligence...</div>;

    const getIcon = (condition) => {
        const c = condition?.toLowerCase() || '';
        if (c.includes('rain')) return <CloudRain size={40} color="#3B82F6" />;
        if (c.includes('sun')) return <Sun size={40} color="#F59E0B" />;
        return <Cloud size={40} color="#64748B" />;
    };

    const renderAICard = (type, content) => {
        const details = getExtraDetails(type);
        return (
            <div 
                onClick={() => setActiveCard(type)}
                style={{ 
                    background: 'rgba(255, 255, 255, 0.04)', 
                    backdropFilter: 'blur(10px)', 
                    borderRadius: '24px', 
                    padding: '1.2rem', 
                    borderLeft: `6px solid ${details.color}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <h4 style={{ fontSize: '0.85rem', color: details.color, margin: '0 0 10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>{details.title}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#F1F5F9', lineHeight: '1.5' }}>{content}</p>
            </div>
        );
    };

    const activeCardDetails = activeCard ? getExtraDetails(activeCard) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                        type="text" 
                        placeholder="Search another location (city, state)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            borderRadius: '15px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: 'white',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '15px', backgroundColor: '#10B981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={18} /> Search
                </button>

                <button 
                    type="button"
                    onClick={() => {
                        setCurrentLocation(location);
                        setSearchQuery('');
                    }}
                    style={{ 
                        padding: '0.8rem 1.2rem', 
                        borderRadius: '15px', 
                        backgroundColor: 'white', 
                        color: '#10B981', 
                        border: '2px solid #10B981', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#10B981';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#10B981';
                    }}
                    title="Reset to default address"
                >
                    <MapPin size={18} /> My Location
                </button>
            </form>

            {/* Weather Overview */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>🌦️ {currentLocation}</h3>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {getIcon(weather?.weatherCondition)}
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0F172A' }}>{weather?.temperature?.toFixed(1)}°C</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 'bold' }}>{weather?.weatherCondition}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>HUMIDITY</div>
                            <div style={{ fontWeight: 'bold' }}>{weather?.humidity}%</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>WIND</div>
                            <div style={{ fontWeight: 'bold' }}>{weather?.windSpeed} km/h</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Decision Hub */}
            <div style={{ backgroundColor: '#0F172A', color: 'white', borderRadius: '32px', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <Zap size={24} color="#F59E0B" fill="#F59E0B" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }}>AI LOGISTICS & PLANNING ENGINE</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                    {role === 'ROLE_FARMER' ? (
                      <>
                        {renderAICard('crop', aiInsights?.crop)}
                        {renderAICard('timing', aiInsights?.timing)}
                        {renderAICard('logistics', aiInsights?.logistics)}
                        {renderAICard('risk', aiInsights?.risk)}
                      </>
                    ) : (
                      <>
                        {renderAICard('logistics', aiInsights?.logistics || "Conditions support smooth transit.")}
                        {renderAICard('demand', aiInsights?.demand || "Market demand stable.")}
                        {renderAICard('pricing', aiInsights?.pricing || "Pricing remains standard.")}
                      </>
                    )}
                </div>
            </div>

            {/* Detail Modal Overlay */}
            {activeCard && activeCardDetails && (
                <div 
                    onClick={() => setActiveCard(null)}
                    style={{ 
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            backgroundColor: '#1E293B', color: 'white', width: '500px', maxWidth: '100%',
                            borderRadius: '32px', padding: '2.5rem', position: 'relative',
                            border: `2px solid ${activeCardDetails.color}`,
                            boxShadow: `0 0 50px ${activeCardDetails.color}33`,
                            animation: 'modalEntrance 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        <button 
                            onClick={() => setActiveCard(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '2rem' }}>{activeCardDetails.icon}</span>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: activeCardDetails.color }}>{activeCardDetails.title}</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <section>
                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: activeCardDetails.color, marginBottom: '8px', letterSpacing: '1px' }}>💡 MEANING</div>
                                <p style={{ margin: 0, fontSize: '1rem', color: '#CBD5E1', lineHeight: '1.6' }}>{activeCardDetails.meaning}</p>
                            </section>

                            {(activeCardDetails.grow || activeCardDetails.action || activeCardDetails.tip) && (
                                <section style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '16px', border: `1px solid ${activeCardDetails.color}33` }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: activeCardDetails.color, marginBottom: '8px', letterSpacing: '1px' }}>🌱 SUGGESTION</div>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#F8FAFC' }}>{activeCardDetails.grow || activeCardDetails.action || activeCardDetails.tip}</p>
                                </section>
                            )}

                            <section>
                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: activeCardDetails.color, marginBottom: '8px', letterSpacing: '1px' }}>👉 WHY?</div>
                                <p style={{ margin: 0, fontSize: '1rem', color: '#94A3B8', lineHeight: '1.6', fontStyle: 'italic' }}>{activeCardDetails.why}</p>
                            </section>
                        </div>

                        <button 
                            onClick={() => setActiveCard(null)}
                            style={{ 
                                width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '16px',
                                backgroundColor: activeCardDetails.color, color: 'white', border: 'none',
                                fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: `0 10px 20px ${activeCardDetails.color}44`
                            }}
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalEntrance {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default WeatherIntelligence;
