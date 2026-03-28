# Farmer-Retailer Trading Platform

A web-based platform connecting farmers directly with retailers.

## Prerequisites
- **Java 17** or higher
- **Node.js** & **npm**
- **MySQL Database** running on port 3306
- **Maven** (optional if using wrapper, but recommended)

## Database Setup
Ensure your MySQL server is running. The application is configured to create the database `farmer_retailer_db` automatically if it doesn't exist, provided the credentials match.
- **Username**: `root`
- **Password**: `Chetna@202005`
*(You can change these in `backend/src/main/resources/application.properties`)*

## How to Run

### 1. Backend (Spring Boot)
The backend runs on port `8080`.

**Using Terminal:**
```bash
cd backend
mvn spring-boot:run
```

**Using IDE (IntelliJ/Eclipse):**
1. Open the `backend` folder as a project.
2. Navigate to `src/main/java/com/farmerretailer/BackendApplication.java`.
3. Right-click and select **Run 'BackendApplication'**.

### 2. Frontend (React)
The frontend runs on port `5173`.

**Using Terminal:**
```bash
cd frontend
npm install  # Only needed the first time
npm run dev
```

Open your browser and navigate to: [http://localhost:5173](http://localhost:5173)

## Project Structure
- **backend/**: Spring Boot Server (API, DB, Auth)
- **frontend/**: React Client (UI, Dashboards)

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@agriconnect.com` | `Admin@123` |
| **Farmer** | *Register a new user* | *Set during registration* |
| **Retailer** | *Register a new user* | *Set during registration* |

*Note: New registrations require Admin approval via the Admin Dashboard before they can login.*
