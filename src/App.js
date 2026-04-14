// src/App.js
import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Payments from './pages/Payments'
import Automate from './pages/Automate'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <span className="logo-icon">🚗</span>
            <span className="logo-text">VahanTax</span>
          </div>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span>🚙</span> Vehicles
          </NavLink>
          <NavLink to="/payments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span>🧾</span> Payments
          </NavLink>
          <NavLink to="/automate" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span>⚡</span> Automate
          </NavLink>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/automate" element={<Automate />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
