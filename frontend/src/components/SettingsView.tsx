import { useState, useEffect } from 'react'
import { Copy, Check, Clock, Loader2, Save, RotateCcw, AlertTriangle, LogOut } from 'lucide-react'
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
      <div className="px-4 py-4">
        <div className="space-y-4">
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Invite Code */}
      {couple && (
        <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
            Invite Code
          </label>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-mono font-bold tracking-[0.15em] text-[#2D2D2D] bg-[#FFFBF7] rounded-xl px-4 py-3 text-center">
              {couple.invite_code}
            </span>
            <button
              onClick={copyInviteCode}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4ECDC4] text-white shadow-sm active:scale-90 transition-transform"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8C8C8C]">
            Share this code with your partner to link accounts
          </p>
        </div>
      )}

      {/* Time Budget */}
      {couple && (
        <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
            Time Budget
          </label>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[#FF6B4A]" />
            <span className="text-xl font-bold text-[#2D2D2D]">{timeBudget}</span>
            <span className="text-xs text-[#8C8C8C]">minutes per meal</span>
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
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Budget
            </button>
          )}
        </div>
      )}

      {/* Partner Info */}
      {couple && (
        <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
            Partner
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] text-sm font-bold">
              {couple.partner_1?.display_name?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D2D2D]">{couple.partner_1?.display_name || 'You'}</p>
              <p className="text-xs text-[#8C8C8C]">{couple.partner_1?.email}</p>
            </div>
          </div>
          {couple.partner_2 && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0E6E0]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4ECDC4]/10 text-[#4ECDC4] text-sm font-bold">
                {couple.partner_2.display_name?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D2D2D]">{couple.partner_2.display_name}</p>
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
      )}

      {/* Reset */}
      {couple && (
        <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C] mb-2 block">
            Reset
          </label>
          <p className="text-xs text-[#8C8C8C] mb-3">
            Clear all matches, swipes, and calendar entries. Recipes will return to your swipe deck.
          </p>
          
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 active:scale-95 transition-transform"
            >
              <RotateCcw size={14} />
              Reset All Data
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-sm font-semibold text-red-700">Are you sure?</p>
              </div>
              <p className="text-xs text-red-600 mb-3">
                This deletes all matches, swipes, and scheduled meals. Cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl bg-white border border-[#E8E8E8] py-2 text-sm font-medium text-[#8C8C8C] active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-50"
                >
                  {resetting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  {resetting ? 'Resetting...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sign Out */}
      <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4">
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[#E8E8E8] py-3 text-sm font-semibold text-[#8C8C8C] active:scale-95 transition-transform hover:bg-[#F0E6E0]"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
