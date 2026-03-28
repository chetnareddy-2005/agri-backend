import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import FarmerDashboard from './pages/dashboards/FarmerDashboard'
import RetailerDashboard from './pages/dashboards/RetailerDashboard'
import ResetPassword from './pages/auth/ResetPassword'
import SetPassword from './pages/auth/SetPassword'
import PaymentSuccess from './pages/PaymentSuccess'
import './styles/global.css'

import Chatbot from './components/Chatbot'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
        <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      <Chatbot />
    </HashRouter>
  )
}

export default App
