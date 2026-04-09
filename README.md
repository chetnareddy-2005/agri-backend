# 🌾 Farm2Trade: Premium Agri-Logistics & Supply Chain Intelligence

**Farm2Trade** is a professional, full-stack intelligence platform built to bridge the gap between farmers, retailers, and transporters. It combines a state-of-the-art marketplace with real-time **AI-driven Weather Intelligence** to optimize agricultural logistics and trading.

---

## 🚀 Live Demo

🔗 **Frontend:** [https://chetnareddy-2005.github.io/agri-backend/](https://chetnareddy-2005.github.io/agri-backend/)

🔗 **Backend API:** [https://agri-backend-xz72.onrender.com](https://agri-backend-xz72.onrender.com)

⚠️ *Note: Backend is hosted on free tier (Render), first load may take ~30-50 seconds.*

---

## 🚀 System Flow & Ecosystem

The platform operates as a coordinated circular marketplace:
1. **Farmer**: Lists produce (Vegetables, Grains, Fruits) with either a fixed price or a dynamic bidding period.
2. **Retailer**: Explores the marketplace, places bids, and procures stock based on regional supply trends.
3. **Escrow & Validation**: Payments are secured once an order is placed.
4. **Logistics (Transporter)**: Transporters accept delivery requests, provide live GPS tracking, and submit e-signature proofs for fund release.
5. **AI Planning**: Every user is guided by the **Weather Intelligence Hub**, which provides "Crop Advisory," "Harvest Windows," and "Risk Assessments" specific to their city.

---

## 🎨 Dashboard Breakdown & Components

### 👨‍🌾 1. Farmer Hub (Operational Intelligence)
*   **Metrics Row**: Quick-view cards for active Listings, Total Sales value, and Pending Orders.
*   **Weather Intelligence**: Real-time localized climate data + AI advice for crop health and harvest timing.
*   **Product Manager**: Multi-step auction/listing interface with dynamic bidding timers.
*   **Supply Analytics**: Recharts-driven "Produce Mix" and "Monthly Sales" visualizations.
*   **Invoice Engine**: jsPDF-powered automated invoice generation for every sale.

### 🏪 2. Retailer Hub (Procurement Foresight)
*   **Smart Marketplace**: Grid-view of products with filtering by category, price, and distance.
*   **Bidding UI**: Real-time counter-offer system for high-value auctions.
*   **Procurement Trends**: Area charts showing procurement value fluctuations.
*   **Regional Weather foresight**: AI advice on demand-driving weather events (e.g., "Heatwave coming: Stock up on moisture-sensitive vegetables").

### 🚛 3. Transporter Hub (Precision Logistics)
*   **Fleet Map**: Leaflet interactive map showing live GPS coordinates.
*   **Bidding Hub**: Real-time negotiation for delivery prices between transporters and retailers.
*   **Gamification**: "Driver Badge" system based on XP points, delivery speed, and rating.
*   **Proof of Delivery**: Mobile-first camera and e-signature upload for secure order completion.

### 🛡️ 4. Admin Portal (Governance)
*   **User Verification**: Document vetting for new Farmers and Transporters to ensure safety.
*   **Crisis Center**: Global AlertBanner system to push "Weather Alerts" or "Road Blockages" to specific cities.
*   **Aggregated Stats**: Platform-wide total users, revenue, and trade health.

---

## 🔐 Continuous Authentication (Zero-Trust Security)

To ensure high-fidelity anti-fraud protection for Farmer payouts and Retailer transactions, Farm2Trade integrates an autonomous machine-learning security layer:
*   **Behavioral Telemetry**: Tracks micro-interactions like typing cadence, scroll frequency, and mouse speed. 
*   **Anomaly Detection**: A standalone Flask/Python microservice running an **IsolationForest** model builds a unique profile for every user.
*   **Dynamic Risk Engine**: Evaluates session risk in real-time. Automatically prompts for OTP on medium friction and instantly drops high-risk/hijacked sessions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Lucide Icons, CSS Glassmorphism |
| **Main Backend**| Spring Boot, Java, JPA/Hibernate, Security (JWT) |
| **ML/Auth Service** | Python, Flask, Scikit-Learn (Isolation Forest) |
| **Database** | MySQL (with BLOB support for document verification) |
| **Charts** | Recharts (Responsive Pie, Bar, and Area Charts) |
| **Maps** | Leaflet with React-Leaflet (Live GPS Tracking) |
| **AI Layer** | Custom "AI Planning Engine" (Weather-Condition Map logic) |
| **Export** | jsPDF & html2canvas for Professional Invoicing |

---

## ✨ Key Features Stabilized

*   **Continuous Authentication System**: ML-powered anomaly detection protecting against account hijackings using biometric telemetry (typing cadence, mouse velocity).
*   **Localized Weather (City-Detector)**: Automatically extracts city names from detailed addresses to ensure weather reports never show blank.
*   **High-End "AI Deep-Dives"**: Glassmorphism modals providing scientific "Why?" rationale for farming and logistics advice.
*   **Premium Registration**: Multi-step form with split address components (Address/City/State) for robust data structure.
*   **Global AlertBanner**: Real-time, color-coded risk alerts (High/Medium) visible globally across all roles.

---

Developed with ❤️ for the future of Indian Agriculture.