import { useState } from 'react'
import { Heart, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { login, register } from '../lib/api'

export default function AuthScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const data = await login(email, password)
        onLogin(data.token)
      } else {
        const data = await register(email, password, name)
        onLogin(data.token)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFBF7] px-4 py-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#FF6B4A]/10 text-4xl shadow-sm">
          <Heart className="text-[#FF6B4A]" size={40} />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2D2D2D]">DishPair</h1>
        <p className="mt-1 text-sm text-[#8C8C8C]">Stop negotiating dinner. Start matching on it.</p>
      </div>

      <div className="w-full max-w-[360px] rounded-[1.5rem] border border-[#FF6B4A]/10 bg-white p-6 shadow-[0_16px_48px_rgba(255,107,74,0.08)]">
        <div className="mb-5 flex gap-2 rounded-full bg-[#FFFBF7] p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-[#FF6B4A] text-white shadow-sm'
                : 'text-[#8C8C8C] hover:text-[#2D2D2D]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'register'
                ? 'bg-[#FF6B4A] text-white shadow-sm'
                : 'text-[#8C8C8C] hover:text-[#2D2D2D]'
            }`}
          >
            Join
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8C8C8C]">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-[#FF6B4A]/15 bg-[#FFFBF7] py-3 pl-11 pr-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#FF6B4A]/40 focus:ring-2 focus:ring-[#FF6B4A]/10"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8C8C8C]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#FF6B4A]/15 bg-[#FFFBF7] py-3 pl-11 pr-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#FF6B4A]/40 focus:ring-2 focus:ring-[#FF6B4A]/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8C8C8C]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-2xl border border-[#FF6B4A]/15 bg-[#FFFBF7] py-3 pl-11 pr-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#FF6B4A]/40 focus:ring-2 focus:ring-[#FF6B4A]/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,74,0.25)] transition hover:bg-[#e85d3d] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#8C8C8C]">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button onClick={() => setMode('register')} className="font-semibold text-[#FF6B4A] hover:underline">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="font-semibold text-[#FF6B4A] hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
