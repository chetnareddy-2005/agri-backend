import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import FarmerDashboard from './pages/dashboards/FarmerDashboard'
import RetailerDashboard from './pages/dashboards/RetailerDashboard'
import TransporterDashboard from './pages/dashboards/TransporterDashboard'
import ResetPassword from './pages/auth/ResetPassword'
import SetPassword from './pages/auth/SetPassword'
import PaymentSuccess from './pages/PaymentSuccess'
import TransportSelection from './pages/dashboards/TransportSelection'
import OrderTracking from './pages/dashboards/OrderTracking'
import './styles/global.css'

import Chatbot from './components/Chatbot'
import ContinuousAuthWrapper from './components/ContinuousAuthWrapper'

function App() {
  return (
    <ContinuousAuthWrapper>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
          <Route path="/transporter/dashboard" element={<TransporterDashboard />} />
          <Route path="/select-transport" element={<TransportSelection />} />
          <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        <Chatbot />
      </HashRouter>
    </ContinuousAuthWrapper>
  )
}

export default App
