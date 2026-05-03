import { useState } from 'react'
import { ArrowRight, Link, Copy, Check, Heart, Sparkles } from 'lucide-react'
import { createCouple, joinCouple } from '../lib/api'
import { haptic } from '../lib/haptic'

export default function CoupleSetup({ onComplete, showToast }: { onComplete: () => void; showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [createdCode, setCreatedCode] = useState('')

  async function handleCreate() {
    setLoading(true)
    try {
      const data = await createCouple()
      setCreatedCode(data.invite_code)
      haptic('success')
      showToast('Couple created! Share the code.', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to create couple', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setLoading(true)
    try {
      await joinCouple(inviteCode.trim().toUpperCase())
      haptic('success')
      showToast('Successfully joined!', 'success')
      onComplete()
    } catch (err: any) {
      haptic('error')
      showToast(err.message || 'Invalid invite code', 'error')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode)
      haptic('light')
      showToast('Code copied!', 'success')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B4A]/10 flex items-center justify-center mx-auto mb-3">
            <Heart size={28} className="text-[#FF6B4A]" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">Link with your partner</h2>
          <p className="text-xs text-[#8C8C8C] max-w-xs mx-auto">
            Decide on meals together. Start by creating a couple or joining one.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => { setMode('create'); haptic('light') }}
            className="w-full flex items-center gap-4 rounded-2xl bg-white border border-[#F0E6E0] p-4 text-left hover:border-[#FF6B4A]/30 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FF6B4A]/10 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-[#FF6B4A]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2D2D2D]">Create a couple</p>
              <p className="text-xs text-[#8C8C8C]">Get an invite code to share</p>
            </div>
            <ArrowRight size={16} className="text-[#C4C4C4]" />
          </button>

          <button
            onClick={() => { setMode('join'); haptic('light') }}
            className="w-full flex items-center gap-4 rounded-2xl bg-white border border-[#F0E6E0] p-4 text-left hover:border-[#4ECDC4]/30 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#4ECDC4]/10 flex items-center justify-center shrink-0">
              <Link size={20} className="text-[#4ECDC4]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2D2D2D]">Join a couple</p>
              <p className="text-xs text-[#8C8C8C]">Enter your partner's code</p>
            </div>
            <ArrowRight size={16} className="text-[#C4C4C4]" />
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        {!createdCode ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Create Your Couple</h2>
              <p className="text-xs text-[#8C8C8C]">You'll get a code to share with your partner</p>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full max-w-sm flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  Create Couple
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#6BCB77]/10 flex items-center justify-center mx-auto mb-3">
                <Check size={28} className="text-[#6BCB77]" />
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Couple Created!</h2>
              <p className="text-xs text-[#8C8C8C]">Share this code with your partner</p>
            </div>

            <div className="w-full max-w-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 rounded-2xl bg-[#FFFBF7] border-2 border-[#FFD93D]/30 px-4 py-3 text-center">
                  <span className="text-2xl font-mono font-bold tracking-[0.2em] text-[#2D2D2D]">
                    {createdCode}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className="h-11 w-11 rounded-2xl bg-[#4ECDC4] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>

              <button
                onClick={onComplete}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-all"
              >
                Start Swiping
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Join mode
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Join Your Partner</h2>
        <p className="text-xs text-[#8C8C8C]">Enter the invite code they shared</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Enter code (e.g. ABC123)"
          maxLength={6}
          className="w-full rounded-2xl border-2 border-[#F0E6E0] bg-white px-4 py-3.5 text-center text-lg font-mono font-bold text-[#2D2D2D] placeholder-[#C4C4C4] placeholder:text-sm placeholder:font-normal placeholder:font-sans outline-none focus:border-[#4ECDC4] focus:shadow-lg focus:shadow-[#4ECDC4]/10 transition-all uppercase"
        />

        <button
          onClick={handleJoin}
          disabled={loading || inviteCode.length < 3}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4ECDC4] py-3 text-sm font-semibold text-white shadow-lg shadow-[#4ECDC4]/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Link size={16} />
              Join Couple
            </>
          )}
        </button>

        <button
          onClick={() => setMode('choose')}
          className="w-full py-2 text-xs text-[#8C8C8C] hover:text-[#2D2D2D] transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  )
}
