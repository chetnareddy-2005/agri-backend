# 🌱 Farm2Trade: Agri-Supply Chain Dashboard

**Farm2Trade** is a robust, full-stack web application designed to eliminate middlemen, directly connecting **Farmers** and **Retailers**. The platform features comprehensive role-based dashboards, secure transactions, user identity validation, and an advanced Administrator panel to manage the entire agricultural supply chain.

---

## 🚀 Live Deployments

*   **Frontend (UI):** Hosted on [GitHub Pages](https://chetnareddy-2005.github.io/agri-supply-chain-dashboard/)
*   **Backend (API):** Hosted securely via Docker Containers on [Render](https://agri-backend-xz72.onrender.com)
*   *Please note: Due to free-tier hosting on Render, the backend may take 30-50 seconds to spin up on your first visit.*

---

## 🛠️ Technology Stack Used

### **Frontend Architecture**
*   **React 19.x:** Core component-based UI library.
*   **Vite:** Ultra-fast modern frontend build tool and development server.
*   **React Router DOM:** Client-side routing for dynamic, multi-page experiences (Admin, Farmer, Retailer Dashboards).
*   **Recharts:** Composable charting library used for data-rich Admin visualizations (Pie Charts & Bar Charts).
*   **Lucide React:** Beautiful, consistent icon toolkit mapped across the application.
*   **PDF/Canvas Export:** `html2canvas` and `jspdf` for report generation workflows.
*   **CSS3 & CSS Variables:** Pure CSS styling leveraging root variables for responsive dark/light mode adaptable themes (**No Tailwind required**).

### **Backend Architecture**
*   **Java 17:** Statically-typed object-oriented language acting as the core processing engine.
*   **Spring Boot 3.x:** Enterprise Java framework handling core REST APIs.
*   **Spring Security:** Handles API request protection, cross-site tracking resistance, and CORS configurations.
*   **Spring Data JPA & Hibernate:** ORM mapping translating Java objects directly into relational database tables.
*   **MySQL:** Relational database securely holding normalized User, Role, Transaction, and Complaint records.

### **Integrations & Cloud Services**
*   **Authentication mechanism:** Cross-Origin Cookie-based User Sessions tracked with `JSESSIONID` (`SameSite=None` + `Secure`).
*   **Cashfree PG (Sandbox):** Payment gateway integration structure for transaction simulation.
*   **Gmail SMTP Integration:** Programmatic email dispatcher used for notification alerts.
*   **Docker:** Multistage containerization (Maven build stage -> Eclipse Temurin runtime stage) for foolproof Render deployments.

---

## ✨ Key Features & Functionality

### 1. Robust Role-Based Access Control (RBAC)
Dedicated user isolation logic ensuring users only see what their role allows:
*   **Farmers:** Request onboarding, list produce, track incoming retailer orders.
*   **Retailers:** Register business, browse open crop inventory, checkout agricultural goods.
*   **Administrators:** Ultimate oversight and control of the entire ecosystem.

### 2. Admin Verification Workflow
New Farmers and Retailers must upload supporting identity/business **Documents** upon registration.
Administrators review these applications from their dashboard and have the sole power to **Approve or Reject** them before users can physically use the platform.

### 3. Complaint & Messaging System
An interactive Help Desk. Users can open tickets regarding failed orders. Admins hold individual live-chat workflows mapped to each complaint ID, including features like **Unread Badges** so immediate attention is never missed.

### 4. Advanced Data Visualization Analytics
Admins can visualize live supply-chain flow via responsive **Recharts** integrations, tracking User Distributions (Farmers vs Retailers) and Transaction Statuses (Shipped, Pending, Delivered) in dynamic, modern graphical views.

### 5. Automated Build-and-Deploy CI/CD Mentality
Custom deployment scripts automate the complex replacement of local development variables (`localhost:8080`) directly into heavily cached production environments (Render URLs), guaranteeing accurate and seamless Github Pages deployment pipelines.

---

## 💻 Local Developer Setup

### Prerequisites
*   Node.js (v18+)
*   Java 17 jdk
*   MySQL Server (port 3306)

### 1. Running the Spring Boot Backend
```bash
cd backend
# Database creation via application.properties is automatic
./mvnw spring-boot:run
```

### 2. Running the React Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Deploying the Frontend to Production
The project uses `gh-pages` branch deployment. You can fully compile and deploy via:
```bash
cd frontend
npm run deploy
```

---
*Created dynamically for the Farm2Trade project. Documentation accurately reflects deployment strategies updated March 2026.*