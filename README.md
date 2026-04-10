# 🌾 Farm2Trade: Premium Agri-Logistics & Supply Chain Intelligence

**Farm2Trade** is a professional, full-stack intelligence platform built to bridge the gap between farmers, retailers, and transporters. It combines a state-of-the-art marketplace with real-time **AI-driven Weather Intelligence** and a **Zero-Trust Security Infrastructure** to optimize agricultural logistics and trading.

---

## 🚀 Live Demo

🔗 **Frontend:** [https://chetnareddy-2005.github.io/agri-backend/](https://chetnareddy-2005.github.io/agri-backend/)

🔗 **Backend API:** [https://agri-backend-xz72.onrender.com](https://agri-backend-xz72.onrender.com)

⚠️ *Note: Backend is hosted on free tier (Render), first load may take ~30-50 seconds.*

---

## 🛡️ Zero-Trust Security Infrastructure (Continuous Authentication)

To ensure high-fidelity anti-fraud protection for Farmer payouts and Retailer transactions, Farm2Trade integrates an autonomous machine-learning security layer:

*   **Behavioral Telemetry**: Tracks micro-interactions like typing cadence, scroll frequency, and mouse speed in real-time. 
*   **Anomaly Detection**: A standalone Flask/Python microservice running an **IsolationForest** model builds a unique profile for every user, detecting hijacking attempts instantly.
*   **Premium Risk Observability**: Integrated **SmallRiskGauge (Gauge Charts)** on all dashboards provide real-time visual feedback of the session's security state.
*   **Step-Up Authentication**:
    *   **Medium Risk**: Automatically triggers an email-based OTP challenge.
    *   **High Risk**: Triggers immediate session termination and account lockout.
    *   **Hardening**: Implemented 5-minute OTP expiry and strict 3-attempt retry limits.
*   **Infinite Audit Logs**: A dedicated Admin interface to monitor every security event, risk evaluation, and step-up challenge across the entire platform.

---

## 🚀 System Flow & Ecosystem

The platform operates as a coordinated circular marketplace:
1. **Farmer**: Lists produce (Vegetables, Grains, Fruits) with either a fixed price or a dynamic bidding period.
2. **Retailer**: Explores the marketplace, places bids, and procures stock based on regional supply trends.
3. **Escrow & Validation**: Payments are secured once an order is placed.
4. **Logistics (Transporter)**: Transporters accept delivery requests, provide live GPS tracking, and submit e-signature proofs for fund release.
5. **AI Planning**: Every user is guided by the **Weather Intelligence Hub**, providing "Crop Advisory" and "Risk Assessments" specific to their city.

---

## 🎨 Dashboard Breakdown & Components

### 👨‍🌾 1. Farmer Hub (Operational Intelligence)
*   **Risk Meter**: Real-time gauge showing session security status.
*   **Weather Intelligence**: Real-time localized climate data + AI advice for crop health.
*   **Product Manager**: Multi-step auction interface with dynamic bidding timers.
*   **Supply Analytics**: Recharts-driven "Produce Mix" and "Monthly Sales" visualizations.
*   **Invoice Engine**: jsPDF-powered automated invoice generation for every sale.

### 🏪 2. Retailer Hub (Procurement Foresight)
*   **Smart Marketplace**: Grid-view of products with filtering by category, price, and distance.
*   **Bidding UI**: Real-time counter-offer system for high-value auctions.
*   **Procurement Trends**: Area charts showing procurement value fluctuations.

### 🚛 3. Transporter Hub (Precision Logistics)
*   **Fleet Map**: Leaflet interactive map showing live GPS coordinates.
*   **Bidding Hub**: Real-time negotiation for delivery prices.
*   **Gamification**: "Driver Badge" system based on XP points and delivery reliability.

### 🛡️ 4. Admin Portal (Governance & Observability)
*   **Security Audit Logs**: Centralized view of all Zero-Trust auth events and risk scores.
*   **User Verification**: Document vetting for new Farmers and Transporters.
*   **Crisis Center**: Global AlertBanner system to push critical weather or road alerts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide Icons, CSS Glassmorphism |
| **Charts & Gauges** | Recharts, React-Gauge-Chart (Premium Visuals) |
| **Main Backend**| Spring Boot 3.x, Java 17, JPA/Hibernate, Security (Session/JSESSIONID) |
| **AI/ML Service** | Python, Flask, Scikit-Learn (Isolation Forest Model) |
| **Database** | MySQL (Audit Logging & Transaction Persistence) |
| **Maps** | Leaflet with React-Leaflet (Live GPS Tracking) |
| **Export** | jsPDF & html2canvas for Professional Invoicing |

---

## ✨ Key Features Stabilized

*   **Premium Security Visualization**: Animated gauge charts for real-time AI security monitoring.
*   **Hardened Auth logic**: Production-ready OTP handling with instant session termination on 401/403 security errors.
*   **Localized Weather (City-Detector)**: Intelligent extraction of location data to ensure accurate AI advice.
*   **High-End "AI Deep-Dives"**: Glassmorphism modals providing scientific "Why?" rationale for farming advice.
*   **Persistent Audit Trail**: Full database-level logging of every authentication decision for platform accountability.

---

## 🛠️ Setup & Installation

Follow these steps to run the Farm2Trade ecosystem locally.

### 📋 Prerequisites
*   **Java**: 17 or higher
*   **Node.js**: 18.x or higher
*   **Python**: 3.9 or higher
*   **MySQL**: 8.x

### 💻 Execution Commands

#### 1. Backend (Spring Boot)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### 2. ML & Security Service (Flask)
```bash
cd continuous-auth
pip install -r requirements.txt
python app.py
```

#### 3. Frontend (Vite/React)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

Developed with ❤️ for the future of Indian Agriculture.