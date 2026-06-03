// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './context/authStore'
import Layout from './components/common/Layout'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import PortfolioPage  from './pages/PortfolioPage'
import NewsPage       from './pages/NewsPage'
import ChatPage       from './pages/ChatPage'
import WatchlistPage  from './pages/WatchlistPage'

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" replace />
}

const GuestRoute = ({ children }) => {
  const { accessToken } = useAuthStore()
  return !accessToken ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes inside Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="portfolio"  element={<PortfolioPage />} />
        <Route path="news"       element={<NewsPage />} />
        <Route path="watchlist"  element={<WatchlistPage />} />
        <Route path="chat"       element={<ChatPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
