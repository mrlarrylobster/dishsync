import { useState, useEffect } from 'react'
import { Users, Copy, Check, Clock, Loader2, Save, RotateCcw, AlertTriangle } from 'lucide-react'
import { getCouple, updateCouple, resetCoupleData } from '../lib/api'
import { haptic } from '../lib/haptic'

export default function SettingsView({ onSignOut, showToast }: { onSignOut: () => void; showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [couple, setCouple] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeBudget, setTimeBudget] = useState(60)
  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    loadCouple()
  }, [])

  async function loadCouple() {
    setLoading(true)
    try {
      const data = await getCouple()
      setCouple(data)
      setTimeBudget(data?.time_budget_minutes || 60)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBudget() {
    setSaving(true)
    try {
      await updateCouple({ time_budget_minutes: timeBudget })
      setCouple({ ...couple, time_budget_minutes: timeBudget })
      haptic('success')
      showToast('Time budget saved!', 'success')
    } catch (err) {
      console.error(err)
      showToast('Failed to save budget.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      await resetCoupleData()
      haptic('success')
      showToast('All data reset. Recipes are back in your deck!', 'success')
      setShowResetConfirm(false)
      await loadCouple()
    } catch (err) {
      console.error(err)
      showToast('Reset failed. Please try again.', 'error')
    } finally {
      setResetting(false)
    }
  }

  function copyInviteCode() {
    if (couple?.invite_code) {
      navigator.clipboard.writeText(couple.invite_code)
      haptic('light')
      showToast('Invite code copied!', 'success')
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
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-[#FF6B4A]" />
          <span className="text-2xl font-bold text-[#2D2D2D]">
            {timeBudget}
          </span>
          <span className="text-sm text-[#8C8C8C]">minutes per meal</span>
        </div>

        <input
          type="range"
          min={15}
          max={120}
          step={5}
          value={timeBudget}
          onChange={(e) => setTimeBudget(Number(e.target.value))}
          className="w-full h-2 bg-[#F0E6E0] rounded-lg appearance-none cursor-pointer accent-[#FF6B4A]"
        />
        <div className="flex justify-between text-xs text-[#8C8C8C] mt-1">
          <span>15 min</span>
          <span>120 min</span>
        </div>

        {timeBudget !== couple.time_budget_minutes && (
          <button
            onClick={handleSaveBudget}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B4A] py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Budget
          </button>
        )}
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

      {/* Reset */}
      <div className="mt-6 rounded-2xl bg-white border border-[#F0E6E0] p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
          Reset
        </label>
        <p className="text-xs text-[#8C8C8C] mb-3">
          Clear all matches, swipes, and calendar entries. Recipes will return to your swipe deck.
        </p>
        
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 active:scale-95"
          >
            <RotateCcw size={16} />
            Reset All Data
          </button>
        ) : (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-sm font-semibold text-red-700">Are you sure?</p>
            </div>
            <p className="text-xs text-red-600 mb-3">
              This deletes all matches, swipes, and scheduled meals. Cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-xl bg-white border border-[#E8E8E8] py-2 text-sm font-medium text-[#8C8C8C] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
              >
                {resetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Sign Out */}
      <div className="mt-6 rounded-2xl bg-white border border-[#F0E6E0] p-4 shadow-sm">
        <button
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#E8E8E8] py-2.5 text-sm font-semibold text-[#8C8C8C] active:scale-95 hover:bg-[#F0E6E0]"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
