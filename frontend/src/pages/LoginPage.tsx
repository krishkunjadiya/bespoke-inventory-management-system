import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, Star, Lightning, ChartBar, Bell } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, login } from '../services/api'
import { getAccessToken } from '../services/session'

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getAccessToken()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      queryClient.clear()
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to login. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    window.location.href = 'mailto:support@yourstore.com?subject=Password%20Reset%20Request'
  }

  const handleRequestAccess = () => {
    window.location.href = 'mailto:support@yourstore.com?subject=Account%20Access%20Request'
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col w-[55%] bg-primary p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute border border-white rounded-full"
              style={{
                width: `${(i + 1) * 160}px`,
                height: `${(i + 1) * 160}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Star size={20} weight="fill" className="text-white" />
          </div>
          <span className="font-heading font-bold text-2xl text-white">Bespoke Inventory</span>
        </div>

        {/* Hero text */}
        <div className="mt-auto relative z-10 max-w-md">
          <h1 className="font-heading text-5xl font-extrabold text-white leading-tight mb-4">
            Manage Smarter.<br />Sell Faster.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Your complete inventory, sales, and purchasing hub for modern retail businesses.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: <Lightning size={18} weight="fill" />, text: 'Real-time stock tracking across all categories' },
              { icon: <ChartBar size={18} weight="fill" />, text: 'Smart sales analytics and profit insights' },
              { icon: <Bell size={18} weight="fill" />, text: 'Instant low-stock and expiry alerts' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/80 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="mt-12 relative z-10 border-t border-white/15 pt-6">
          <p className="text-white/50 text-xs">© 2026 Bespoke Inventory. Built for modern retail.</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Star size={16} weight="fill" className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-text-primary">Bespoke Inventory</span>
          </div>

          <h2 className="font-heading text-3xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-text-secondary mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="manager@yourstore.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-xs text-text-secondary hover:text-text-primary">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Type your account password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <button type="button" onClick={handleRequestAccess} className="text-text-primary font-medium underline underline-offset-2">
              Request access
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
