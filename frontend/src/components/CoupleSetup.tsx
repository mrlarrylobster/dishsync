import { useState } from 'react'
import { Users, ArrowRight, Loader2, Copy, Check } from 'lucide-react'
import { createCouple, joinCouple } from '../lib/api'

export default function CoupleSetup({ onComplete }: { onComplete: () => void }) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const data = await createCouple()
      setCreatedCode(data.invite_code)
    } catch (err: any) {
      setError(err.message || 'Failed to create couple')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    setLoading(true)
    setError('')
    try {
      await joinCouple(inviteCode)
      onComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to join couple')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFBF7] px-4 py-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#FF6B4A]/10 shadow-sm">
          <Users className="text-[#FF6B4A]" size={40} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#2D2D2D]">Link with Your Partner</h1>
        <p className="mt-1 text-sm text-[#8C8C8C]">Cook together. Stay in sync.</p>
      </div>

      <div className="w-full max-w-[360px] rounded-[1.5rem] border border-[#FF6B4A]/10 bg-white p-6 shadow-[0_16px_48px_rgba(255,107,74,0.08)]">
        <div className="mb-5 flex gap-2 rounded-full bg-[#FFFBF7] p-1">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'create'
                ? 'bg-[#FF6B4A] text-white shadow-sm'
                : 'text-[#8C8C8C] hover:text-[#2D2D2D]'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'join'
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

        {mode === 'create' ? (
          <div>
            {!createdCode ? (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,74,0.25)] transition hover:bg-[#e85d3d] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Generate Invite Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <div className="text-center">
                <p className="mb-2 text-sm text-[#8C8C8C]">Share this code with your partner</p>
                <div className="mb-4 flex items-center justify-center gap-2">
                  <span className="rounded-2xl bg-[#FFFBF7] px-6 py-3 text-2xl font-mono font-bold tracking-widest text-[#2D2D2D]">
                    {createdCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="rounded-xl bg-[#4ECDC4] p-2.5 text-white transition hover:bg-[#3dbdb5]"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <button
                  onClick={onComplete}
                  className="rounded-2xl bg-[#6BCB77] px-6 py-2.5 text-sm font-semibold text-white"
                >
                  Continue to App
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              maxLength={6}
              className="mb-4 w-full rounded-2xl border border-[#FF6B4A]/15 bg-[#FFFBF7] py-3 px-4 text-center text-lg font-mono font-bold tracking-widest text-[#2D2D2D] outline-none transition focus:border-[#FF6B4A]/40 focus:ring-2 focus:ring-[#FF6B4A]/10"
            />
            <button
              onClick={handleJoin}
              disabled={loading || inviteCode.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,74,0.25)] transition hover:bg-[#e85d3d] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Join Couple
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
