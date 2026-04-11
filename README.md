# 🌾 Farm2Trade: Premium Agri-Logistics & B2B Intelligence

![Platform Banner](https://via.placeholder.com/1200x400/16a34a/ffffff?text=Farm2Trade+Supply+Chain+Intelligence)

### 🚀 Key Highlights:
- **Zero-Trust Security Infrastructure**: Continuous AI-driven authentication.
- **B2B Double-Handshake Transaction**: Secure receipt confirmation for verified arrivals.
- **Automated Escrow & Wallet System**: Real-time financial settlement and transparency.
- **Weather Intelligence Hub**: Hyper-local climate tracking + AI-powered crop advisory.
- **Integrated Precision Logistics**: Real-time fleet tracking and multi-party negotiation.

---

## 🚀 Live Demo

🔗 **Frontend:** [https://chetnareddy-2005.github.io/agri-backend/](https://chetnareddy-2005.github.io/agri-backend/)

🔗 **Backend API:** [https://agri-backend-xz72.onrender.com](https://agri-backend-xz72.onrender.com)

⚠️ *Note: Backend is hosted on free tier (Render), first load may take ~30-50 seconds.*

---

**Farm2Trade** is a high-fidelity, production-ready B2B platform designed to revolutionize the agricultural supply chain. By bridging the gap between Farmers, Retailers, and Transporters within a secure, zero-trust ecosystem, we ensure fairness, transparency, and operational excellence from farm to fork.

---

## 🛡️ Zero-Trust & Continuous Authentication
Our security posture is built on the principle of **Never Trust, Always Verify**.

*   **Behavioral Biometrics**: We track micro-interactions (mouse velocity, typing cadence) to detect session hijacking.
*   **Dynamic Risk Scoring**: Real-time risk assessment (LOW/MEDIUM/HIGH) determines adaptive security challenges.
*   **Instant Termination**: Automatic session termination and identity isolation upon high-risk detection.
*   **Compact Risk Gauges**: Persistent visual indicators across all dashboards provide real-time security observability.

---

## 💳 Financial Integrity & Settlement
We've implemented a robust "Double-Handshake" mechanism to eliminate transaction friction.

1.  **Escrow Management**: When a Retailer pays, funds are locked in a secure **Escrow Balance**.
2.  **Verified Handshake**: The Retailer confirms receipt via the "Confirm Receipt" protocol upon successful delivery.
3.  **Automated Release**: Confirmation triggers an immediate transfer of funds from Escrow to the Farmer's and Transporter's **Available Balance**.
4.  **Full Transparency**: Participants track their earnings through a dedicated **Financial Wallet Hub**.

---

## 🚀 Dashboard Breakdown

### 👨‍🌾 1. Farmer Hub (Operational Intelligence)
*   **Marketplace Control**: List products for auction or fixed-price sales.
*   **Weather Node Monitor**: Real-time localized weather data integrated with Gemini AI for cultivation advice.
*   **Financial Hub**: Dedicated wallet showing locked vs. available funds.
*   **Automated Invoicing**: Instant PDF generation for every verified transaction.

### 🏪 2. Retailer Hub (Procurement Foresight)
*   **Smart Procurement**: Multi-criteria filtering, bidding engine, and dynamic negotiation.
*   **Verification Protocol**: Formal receipt verification to finalize logistics and financial cycles.
*   **Fleet Tracking**: Real-time Leaflet-powered map tracking of inbound shipments.

### 🚛 3. Transporter Hub (Precision Logistics)
*   **Fleet Orchestration**: Interactive GPS map tracking and route optimization.
*   **Bidding Hub**: Dynamic price negotiation with retailers for delivery contracts.
*   **Proof of Delivery**: Digital signature and photo evidence submission.
*   **Earnings Tracker**: Real-time payout tracking for every kilometer traveled.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS (for base), Lucide Icons, Leaflet.js |
| **Backend** | Spring Boot 3.x, Java 17, JPA/Hibernate, MySQL 8.x |
| **Security Service** | Flask, Python 3.9, Scikit-Learn (Isolation Forest ML) |
| **Intelligence** | Gemini AI (Crop Advisory), OpenWeather API |
| **Financials** | Cashfree PG Integration, Custom Escrow Ledger |

---

## 🛠️ Setup & Installation

### 📋 Prerequisites
*   **Java**: 17+ | **Node.js**: 20+ | **Python**: 3.9+ | **MySQL**: 8.x

### 💻 Execution Commands

#### 1. Backend (Spring Boot)
```bash
cd Farmer-Retailer/backend
mvn clean install
mvn spring-boot:run
```

#### 2. ML Security Node (Flask)
```bash
cd Farmer-Retailer/continuous-auth
pip install -r requirements.txt
python app.py
```

#### 3. Frontend (React)
```bash
cd Farmer-Retailer/frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 🏛️ Governance & KYC
The platform includes a dedicated **Admin Oversight Center**:
*   **KYC Verification**: Document-based verification system for new Farmers and Transporters.
*   **Audit Logs**: Infinite audit trail of all security events and authentication challenges.
*   **Crisis Management**: Ability to broadcast emergency alerts (roadblocks, extreme weather) to specific regions.

---

Developed with ❤️ for the future of Digital Agriculture.