import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import AdminPanel from './pages/AdminPanel'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'

function App() {
  return (
    <Router>
      <div
        className="min-h-screen bg-primary p-4 md:p-8 font-sans text-secondary overflow-x-hidden"
        style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'border-2 border-black shadow-[4px_4px_0_0_black] font-bold',
            style: {
              background: '#fff',
              color: '#000',
            },
          }}
        />
        <div className="max-w-md mx-auto md:max-w-4xl">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/group/:id" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
