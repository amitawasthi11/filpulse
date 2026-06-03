// src/components/common/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../../context/authStore'

const NavItem = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
        isActive
          ? 'bg-accent/10 text-accent border border-accent/20'
          : 'text-white/50 hover:text-white/90 hover:bg-white/5'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span className={`text-lg ${isActive ? 'text-accent' : 'text-white/40 group-hover:text-white/70'}`}>
          {icon}
        </span>
        <span>{label}</span>
        {badge && (
          <span className="ml-auto text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full"
          />
        )}
      </>
    )}
  </NavLink>
)

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, #10121a 0%, #0d0f17 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black font-bold text-sm font-display">
            FP
          </div>
          <div>
            <span className="font-display font-bold text-white text-lg leading-none">FinPulse</span>
            <span className="block text-xs text-white/30 font-mono">AI Finance</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-white/20 uppercase tracking-widest font-mono px-3 mb-3">Main</p>
        <NavItem to="/dashboard" icon="⬡" label="Dashboard" />
        <NavItem to="/portfolio" icon="◈" label="Portfolio" />
        <NavItem to="/news"      icon="◎" label="News Analysis" />
        <NavItem to="/watchlist" icon="◉" label="Watchlist" />

        <p className="text-xs text-white/20 uppercase tracking-widest font-mono px-3 mb-3 mt-6">AI Tools</p>
        <NavItem to="/chat" icon="✦" label="AI Advisor" badge="NEW" />
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold font-display flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-white/30 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/20 hover:text-bear transition-colors text-sm"
            title="Logout"
          >
            ⇥
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
