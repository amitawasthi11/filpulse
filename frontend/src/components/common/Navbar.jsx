// src/components/common/Navbar.jsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const routeTitles = {
  '/dashboard': { title: 'Dashboard',     sub: 'Market overview' },
  '/portfolio': { title: 'Portfolio',     sub: 'Your holdings' },
  '/news':      { title: 'News Analysis', sub: 'AI-powered insights' },
  '/watchlist': { title: 'Watchlist',     sub: 'Track assets' },
  '/chat':      { title: 'AI Advisor',    sub: 'Finance chatbot' },
}

export default function Navbar() {
  const location  = useLocation()
  const [time]    = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
  const route     = routeTitles[location.pathname] || { title: 'FinPulse', sub: '' }
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div>
        <h1 className="font-display font-semibold text-white text-lg leading-tight">{route.title}</h1>
        <p className="text-xs text-white/30">{route.sub}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Market status */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse-slow" />
          <span className="text-white/40">Market Open</span>
        </div>

        {/* Date/time */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-white/50 font-mono">{today}</p>
          <p className="text-xs text-white/30 font-mono">{time} EST</p>
        </div>

        {/* Notification bell */}
        <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors relative">
          🔔
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>
      </div>
    </header>
  )
}
