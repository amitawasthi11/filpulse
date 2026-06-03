// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')

    const result = await register(form.name, form.email, form.password)
    if (result.success) {
      toast.success('Account created! Welcome to FinPulse')
      navigate('/dashboard')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-black font-bold font-display">
              FP
            </div>
            <span className="font-display font-bold text-white text-2xl">FinPulse</span>
          </div>
          <p className="text-white/40 text-sm">Start your AI finance journey</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="font-display font-semibold text-white text-xl mb-1">Create account</h2>
          <p className="text-white/40 text-sm mb-6">Join thousands of investors</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'name',     label: 'Full Name',       type: 'text',     placeholder: 'Amit Awasthi' },
              { field: 'email',    label: 'Email Address',   type: 'email',    placeholder: 'amit@example.com' },
              { field: 'password', label: 'Password',        type: 'password', placeholder: 'At least 6 characters' },
              { field: 'confirm',  label: 'Confirm Password',type: 'password', placeholder: '••••••••' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs text-white/50 mb-1.5 font-medium tracking-wide uppercase">
                  {label}
                </label>
                <input
                  type={type}
                  className="input-dark"
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-dim transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
