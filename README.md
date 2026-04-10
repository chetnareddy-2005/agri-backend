# 🌾 Farm2Trade: Premium Agri-Logistics & Supply Chain Intelligence

### 🚀 Key Highlights:
- **AI-Driven Continuous Authentication**: Seamless behavior-based security.
- **Risk-Based Step-Up Auth**: Automated OTP challenges for anomalous sessions.
- **Real-Time Security Observability**: High-fidelity gauge visualization and audit logging.
- **Agricultural Marketplace**: Secure crop auctioning and logistics orchestration.

---

**Farm2Trade** is a professional, full-stack intelligence platform built to bridge the gap between farmers, retailers, and transporters. It combines a state-of-the-art marketplace with real-time **AI-driven Weather Intelligence** and a **Zero-Trust Security Infrastructure**.

---

## 🚀 Live Demo

🔗 **Frontend:** [https://chetnareddy-2005.github.io/agri-backend/](https://chetnareddy-2005.github.io/agri-backend/)

🔗 **Backend API:** [https://agri-backend-xz72.onrender.com](https://agri-backend-xz72.onrender.com)

⚠️ *Note: Backend is hosted on free tier (Render), first load may take ~30-50 seconds.*

---

## 🛡️ Zero-Trust Security Infrastructure

### 🔄 System Flow
`User -> Frontend -> Backend (Spring Boot) -> ML Service (Flask) -> Risk Engine (Isolation Forest) -> OTP/Auth`

**Core API Architecture:**
1.  `POST /api/auth/login` → Authenticate user and initiate JSESSIONID.
2.  `POST /api/auth/risk-check` → ML Model evaluates behavioral telemetry (mouse/typing).
3.  `POST /api/auth/verify-otp` → Conditional step-up challenge for anomalous sessions.
4.  `GET /api/admin/audit-logs` → Real-time observability for administrators.

### 🔐 Key Security Features
*   **Behavioral Telemetry**: Tracks micro-interactions like typing cadence and mouse velocity.
*   **Dynamic Risk Engine**: Evaluates risk levels (LOW/MEDIUM/HIGH) in real-time.
*   **Hardened Guardrails**: 5-minute OTP expiry and strict 3-attempt retry limits.
*   **Instant Termination**: Automatically kills hijacked sessions on High-Risk detection.

---

## 🚀 Dashboard Breakdown & Components

### 👨‍🌾 1. Farmer Hub (Operational Intelligence)
*   **SmallRiskGauge**: Real-time animated gauge showing session security status.
*   **Weather Intelligence**: Real-time localized climate data + AI crop advice.
*   **Invoice Engine**: jsPDF-powered automated invoice generation for every sale.

### 🏪 2. Retailer Hub (Procurement Foresight)
*   **Smart Marketplace**: Grid-view of products with filtering and dynamic bidding.
*   **Procurement Trends**: Area charts showing procurement value fluctuations.

### 🚛 3. Transporter Hub (Precision Logistics)
*   **Fleet Map**: Leaflet interactive map showing live GPS coordinates.
*   **Bidding Hub**: Real-time negotiation for delivery prices.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide Icons, react-gauge-chart |
| **Main Backend**| Spring Boot 3.x, Java 17, JPA/Hibernate, MySql |
| **ML/Auth Service** | Flask, Python 3.9, Scikit-Learn (Isolation Forest) |
| **Logistics** | Leaflet Maps, Real-Time GPS Tracking |

---

## 🛠️ Setup & Installation

### 📋 Prerequisites
*   **Java**: 17+ | **Node.js**: 18+ | **Python**: 3.9+ | **MySQL**: 8.x

### 💻 Execution Commands

#### 1. Backend (Java)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### 2. ML Security Service (Python)
```bash
cd continuous-auth
pip install -r requirements.txt
python app.py
```

#### 3. Frontend (React)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

Developed with ❤️ for the future of Indian Agriculture.