import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, TrendingUp, ShieldCheck, Users, Truck, DollarSign } from 'lucide-react';
import '../styles/global.css';
import ThemeToggle from '../components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introGreeting, setIntroGreeting] = useState(false);

  const handleFarmerClick = () => {
    setIntroGreeting(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 1000);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (showIntro) {
    return (
      <div style={{
        height: '100vh', width: '100vw', backgroundColor: '#F0FDF4',
        position: 'relative', overflow: 'hidden', fontFamily: '"Inter", sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* Header Text */}
        <div style={{ marginTop: '10vh', textAlign: 'center', animation: 'fadeIn 1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ padding: '8px', backgroundColor: 'transparent', borderRadius: '8px' }}>
              <img src={`${import.meta.env.BASE_URL}assets/farm_trade_leaf.png`} alt="FarmTrade Leaf" style={{ width: '40px', height: '40px' }} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#166534', margin: 0 }}>Welcome to Farm2Trade 🚜</h1>
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#15803d', fontWeight: '500' }}>Happy farmer .. happy India...</h2>
        </div>

        {/* The Ground */}
        <div style={{
          position: 'absolute', bottom: 0, width: '100%', height: '30vh',
          backgroundColor: '#8B4513', // Brown earth
          borderTop: '10px solid #4ade80' // Grass top
        }}>
          {/* Simple Grass Decorations */}
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: '-15px', left: `${i * 5 + Math.random() * 5}%`,
              width: '10px', height: '20px', backgroundColor: '#4ade80',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: `rotate(${Math.random() * 30 - 15}deg)`
            }}></div>
          ))}
        </div>

        {/* The Walking Farmer */}
        <div
          onClick={handleFarmerClick}
          style={{
            position: 'absolute', bottom: '25vh', left: '-20%',
            cursor: 'pointer',
            animation: introGreeting ? 'none' : 'moveRight 25s linear infinite',
            zIndex: 10
          }}>
          {introGreeting && (
            <div style={{
              position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '2px solid #16a34a',
              zIndex: 20, whiteSpace: 'nowrap', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#166534' }}>Hello .. Welcome to Farm2Trade...</div>
              <div style={{
                position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                width: '20px', height: '20px', backgroundColor: 'white', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a'
              }}></div>
            </div>
          )}

          <img
            src={`${import.meta.env.BASE_URL}assets/farmer_plough.png`}
            alt="Walking Farmer"
            style={{
              height: '300px',
              filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))',
              animation: introGreeting ? 'none' : 'bounceWalk 0.8s ease-in-out infinite alternate',
              transformOrigin: 'bottom center',
              mixBlendMode: 'multiply' // Blend the white background
            }}
          />
        </div>

        <style>{`
                  @keyframes moveRight {
                      0% { left: -15%; }
                      100% { left: 110%; }
                  }
                  @keyframes bounceWalk {
                      0% { transform: translateY(0) rotate(-2deg); }
                      100% { transform: translateY(-10px) rotate(2deg); }
                  }
                  @keyframes popIn {
                      from { opacity: 0; transform: translateX(-50%) scale(0.5); }
                      to { opacity: 1; transform: translateX(-50%) scale(1); }
                  }
              `}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: 'var(--text-secondary)', overflowX: 'hidden', backgroundColor: 'var(--bg-primary)' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1.25rem 2rem',
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'var(--bg-secondary)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1.5rem', color: '#166534', lineHeight: '1.2' }}>
            <div style={{ padding: '6px', backgroundColor: 'transparent', borderRadius: '8px' }}>
              <img src={`${import.meta.env.BASE_URL}assets/farm_trade_leaf.png`} alt="FarmTrade Leaf" style={{ width: '32px', height: '32px' }} />
            </div>
            Farm2Trade
          </div>
          <span style={{ fontSize: '0.8rem', color: '#15803d', marginLeft: '50px', fontStyle: 'italic', fontWeight: '500' }}>easy to connect...</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button onClick={() => navigate('/login')} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '1rem'
          }}>Login</button>
          <button onClick={() => navigate('/register')} style={{
            backgroundColor: '#16a34a', color: 'white', border: 'none',
            padding: '0.6rem 1.5rem', borderRadius: '9999px',
            fontWeight: '600', cursor: 'pointer', fontSize: '1rem',
            transition: 'transform 0.2s', boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.39)'
          }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >Get Started</button>
        </div>
      </nav>

      {/* Hero Section - Split Connection Story */}
      <header style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        position: 'relative', overflow: 'hidden', paddingTop: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>

          <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'fadeInUp 0.8s ease-out' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Where <span style={{ color: '#16a34a' }}>Hard Work</span> <br />
              Meets <span style={{ color: '#2563EB' }}>Fair Value</span>.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)', maxWidth: '600px', margin: '0 auto' }}>
              Connecting the hands that grow our food directly to the markets that sell it. No middlemen. Just trust.
            </p>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4rem', width: '100%', position: 'relative', flexWrap: 'wrap'
          }}>

            {/* Left: The Farmer */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)',
              animation: 'slideInLeft 1s ease-out', position: 'relative',
              width: '300px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#16a34a', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>FARMER</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👨‍🌾</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Ramesh's Farm</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Punjab, India</div>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Listed: <strong>Fresh Wheat (Grade A)</strong></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Quantity: 500 Quintals</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a', marginTop: '8px' }}>₹2,200 <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>/Qtl</span></div>
              </div>
              <button style={{ width: '100%', padding: '0.8rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', opacity: 0.9 }}>Waiting for Bids...</button>
            </div>

            {/* Center: Conversation / Connection */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 1.5s ease-out' }}>
              <div style={{
                backgroundColor: '#EFF6FF', padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
                border: '1px solid #BFDBFE', color: '#1E40AF', maxWidth: '200px', textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '0.9rem'
              }}>
                "I have 500kg Tomatoes."
              </div>

              <div style={{ width: '200px', height: '2px', backgroundColor: '#E5E7EB', position: 'relative', margin: '1rem 0' }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: '32px', height: '32px', backgroundColor: 'white', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', fontSize: '1rem'
                }}>⇄</div>
              </div>

              <div style={{
                backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '12px', marginTop: '1rem',
                border: '1px solid #BBF7D0', color: '#166534', maxWidth: '200px', textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '0.9rem'
              }}>
                "Bidding ₹25/kg!"
              </div>
            </div>

            {/* Right: The Retailer */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)',
              animation: 'slideInRight 1s ease-out', position: 'relative',
              width: '300px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>City Fresh Mart</div> {/* 3. Hero text color uses variables */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Looking for fresh stock</div> {/* 3. Hero text color uses variables */}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}> {/* 3. Hero border uses variables */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Requirement:</span> {/* 3. Hero text color uses variables */}
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Tomatoes</span> {/* 3. Hero text color uses variables */}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Volume:</span> {/* 3. Hero text color uses variables */}
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>500kg</span> {/* 3. Hero text color uses variables */}
                </div>
              </div>
              <button style={{ width: '100%', padding: '0.6rem', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', marginTop: '1rem' }}>Start Bidding</button>
            </div>

          </div>

          {/* Call to Actions */}
          <div style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem', animation: 'fadeInUp 1s ease-out' }}>
            <button onClick={() => navigate('/register?role=farmer')} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '999px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.4)' }}>
              Start Selling
            </button>
            <button onClick={() => navigate('/register?role=retailer')} style={{ backgroundColor: 'white', color: 'var(--text-secondary)', border: '1px solid #D1D5DB', padding: '1rem 2.5rem', borderRadius: '999px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' }}>
              Start Buying
            </button>
          </div>

        </div>
      </header>


      {/* Stats Section */}
      <section style={{ padding: '3rem 0', backgroundColor: '#166534', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          <StatItem icon={<Users />} value="5,000+" label="Active Farmers" />
          <StatItem icon={<Truck />} value="12,000+" label="Retailers" />
          <StatItem icon={<TrendingUp />} value="₹50Cr+" label="Trade Volume" />
          <StatItem icon={<ShieldCheck />} value="100%" label="Secure Payments" />
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', backgroundColor: 'var(--bg-tertiary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1rem' }}>Why Choose Farm2Trade?</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)', maxWidth: '700px', margin: '0 auto' }}>We bridge the gap between hard-working farmers and quality-seeking retailers with technology.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <FeatureCard
              icon={<DollarSign color="#D97706" size={32} />}
              title="Best Prices via Bidding"
              desc="Farmers get the true market value through our transparent real-time bidding system."
            />
            <FeatureCard
              icon={<Truck color="#2563EB" size={32} />}
              title="Direct Logistics"
              desc="Coordinate directly for pickup and delivery. No hidden warehouse costs."
            />
            <FeatureCard
              icon={<ShieldCheck color="#16a34a" size={32} />}
              title="Trust & Security"
              desc="Every user is verified. Payments are secure. Trade with peace of mind."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', color: 'white', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1.5rem', color: 'white', marginBottom: '1rem' }}>
              <Leaf size={24} fill="white" /> Farm2Trade
            </div>
            <p style={{ color: '#9CA3AF', maxWidth: '300px' }}>Empowering the agricultural backbone of India with technology and transparency.</p>
          </div>
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#9CA3AF', lineHeight: '2' }}>
                <li>Marketplace</li>
                <li>Pricing</li>
                <li>Logistics</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#9CA3AF', lineHeight: '2' }}>
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '3rem auto 0', paddingTop: '2rem', borderTop: '1px solid var(--text-secondary)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          &copy; 2025 Farm2Trade India Pvt Ltd. All rights reserved.
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
            0% { transform: translateY(0px) rotate(-2deg); }
            50% { transform: translateY(-10px) rotate(-2deg); }
            100% { transform: translateY(0px) rotate(-2deg); }
        }
        @keyframes walk {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-5px) rotate(1deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

const StatItem = ({ icon, value, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>{icon}</div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</div>
    <div style={{ opacity: 0.8 }}>{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div style={{
    backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--border-color)',
    transition: 'transform 0.3s ease', cursor: 'default'
  }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ marginBottom: '1.5rem' }}>{icon}</div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{title}</h3>
    <p style={{ color: 'var(--text-tertiary)', lineHeight: '1.6' }}>{desc}</p>
  </div>
);

export default LandingPage;
