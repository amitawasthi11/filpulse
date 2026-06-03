// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-black font-bold font-display">
              FP
            </div>
            <span className="font-display font-bold text-white text-2xl">FinPulse</span>
          </div>
          <p className="text-white/40 text-sm">AI-Powered Finance Intelligence</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="font-display font-semibold text-white text-xl mb-1">Sign in</h2>
          <p className="text-white/40 text-sm mb-6">Access your portfolio & AI insights</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium tracking-wide uppercase">Email</label>
              <input
                type="email"
                className="input-dark"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium tracking-wide uppercase">Password</label>
              <input
                type="password"
                className="input-dark"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 rounded-lg bg-white/3 border border-white/5">
            <p className="text-xs text-white/30 font-mono text-center">
              Demo: demo@finpulse.ai / demo123
            </p>
          </div>

          <p className="text-center text-sm text-white/40 mt-5">
            No account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-dim transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
