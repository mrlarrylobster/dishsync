import { useState, useEffect } from 'react'
import { Users, Copy, Check, Clock, Loader2 } from 'lucide-react'
import { getCouple } from '../lib/api'

export default function SettingsView() {
  const [couple, setCouple] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadCouple()
  }, [])

  async function loadCouple() {
    setLoading(true)
    try {
      const data = await getCouple()
      setCouple(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function copyInviteCode() {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  if (!couple) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <Users size={48} className="mb-4 text-[#8C8C8C]" />
        <p className="text-sm text-[#8C8C8C]">No couple found</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-bold text-[#2D2D2D] mb-4">Couple Settings</h2>

      {/* Invite Code */}
      <div className="mb-6 rounded-2xl bg-white border border-[#F0E6E0] p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
          Invite Code
        </label>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-3xl font-mono font-bold tracking-widest text-[#2D2D2D] bg-[#FFFBF7] rounded-xl px-4 py-3 text-center">
            {couple.invite_code}
          </span>
          <button
            onClick={copyInviteCode}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4ECDC4] text-white active:scale-95"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#8C8C8C]">
          Share this code with your partner to link accounts
        </p>
      </div>

      {/* Time Budget */}
      <div className="mb-6 rounded-2xl bg-white border border-[#F0E6E0] p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
          Time Budget
        </label>
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[#FF6B4A]" />
          <span className="text-2xl font-bold text-[#2D2D2D]">
            {couple.time_budget_minutes}
          </span>
          <span className="text-sm text-[#8C8C8C]">minutes per meal</span>
        </div>
      </div>

      {/* Partner Info */}
      <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
          Partner
        </label>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] font-bold">
            {couple.partner_1?.display_name?.[0] || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-[#2D2D2D]">
              {couple.partner_1?.display_name || 'You'}
            </p>
            <p className="text-xs text-[#8C8C8C]">{couple.partner_1?.email}</p>
          </div>
        </div>
        {couple.partner_2 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0E6E0]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4ECDC4]/10 text-[#4ECDC4] font-bold">
              {couple.partner_2.display_name?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D2D2D]">
                {couple.partner_2.display_name}
              </p>
              <p className="text-xs text-[#8C8C8C]">{couple.partner_2.email}</p>
            </div>
          </div>
        )}
        {!couple.partner_2 && (
          <p className="mt-3 pt-3 border-t border-[#F0E6E0] text-xs text-[#8C8C8C]">
            No partner linked yet. Share the invite code above.
          </p>
        )}
      </div>
    </div>
  )
}
