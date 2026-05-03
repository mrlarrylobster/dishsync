import { useState } from 'react'
import { ChefHat, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { login, register } from '../lib/api'
import { haptic } from '../lib/haptic'

export default function AuthScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    haptic('medium')

    try {
      if (isRegister) {
        await register(email, password, displayName || '')
      }
      const data = await login(email, password)
      haptic('success')
      onLogin(data.access_token)
    } catch (err: any) {
      haptic('error')
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#FF6B4A]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#4ECDC4]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[#FF6B4A] rounded-3xl blur-xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 bg-[#FF6B4A] rounded-3xl flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
              <ChefHat size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">DishPair</h1>
          <p className="mt-2 text-sm text-[#8C8C8C]">Decide together. Cook together.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <label className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1.5 block">
                Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your name"
                className={`w-full rounded-2xl border-2 bg-white px-4 py-3.5 text-sm text-[#2D2D2D] placeholder-[#C4C4C4] outline-none transition-all ${
                  focusedField === 'name' ? 'border-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/10' : 'border-[#F0E6E0]'
                }`}
              />
            </div>
          )}

          <div className="relative">
            <label className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="you@example.com"
              required
              className={`w-full rounded-2xl border-2 bg-white px-4 py-3.5 text-sm text-[#2D2D2D] placeholder-[#C4C4C4] outline-none transition-all ${
                focusedField === 'email' ? 'border-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/10' : 'border-[#F0E6E0]'
              }`}
            />
          </div>

          <div className="relative">
            <label className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                className={`w-full rounded-2xl border-2 bg-white px-4 py-3.5 pr-12 text-sm text-[#2D2D2D] placeholder-[#C4C4C4] outline-none transition-all ${
                  focusedField === 'password' ? 'border-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/10' : 'border-[#F0E6E0]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#8C8C8C] hover:text-[#666666] transition-colors rounded-lg hover:bg-[#F0E6E0]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-[shake_0.4s_ease-in-out]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-4 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-all disabled:opacity-50 hover:bg-[#FF5A3A]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); haptic('light') }}
            className="text-sm text-[#8C8C8C] hover:text-[#FF6B4A] transition-colors"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* Test account hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#C4C4C4]">
            Test account: admin@dishpair.app / 123
          </p>
        </div>
      </div>
    </div>
  )
}
