import { useState, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { getCalendar, getMatches, autoSchedule } from '../lib/api'

export default function CalendarView() {
  const [calendar, setCalendar] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [calData, matchData] = await Promise.all([
        getCalendar(),
        getMatches(),
      ])
      setCalendar(calData)
      setMatches(matchData.matches || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoSchedule() {
    try {
      await autoSchedule()
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2D2D2D]">This Week</h2>
        <button
          onClick={handleAutoSchedule}
          className="flex items-center gap-1.5 rounded-full bg-[#4ECDC4] px-4 py-2 text-sm font-semibold text-white"
        >
          <Sparkles size={14} />
          Auto-Schedule
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {days.map((day, i) => {
          const match = calendar?.[day]
          return (
            <div
              key={day}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                match ? 'border-[#4ECDC4]/30 bg-[#4ECDC4]/5' : 'border-[#F0E6E0] bg-white'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFFBF7]">
                <span className="text-sm font-bold text-[#8C8C8C]">{dayLabels[i]}</span>
              </div>
              {match ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#2D2D2D]">{match.recipe.title}</p>
                  <p className="text-xs text-[#8C8C8C]">{match.recipe.total_time_minutes} min</p>
                </div>
              ) : (
                <p className="text-sm text-[#8C8C8C]">No meal planned</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Matches Pool */}
      {matches.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold text-[#2D2D2D]">Your Matches</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {matches.map((match: any) => (
              <div
                key={match.id}
                className="w-36 shrink-0 rounded-2xl border border-[#FFD93D]/30 bg-[#FFD93D]/5 p-3"
              >
                {match.image_url && (
                  <img
                    src={match.image_url}
                    alt={match.title}
                    className="mb-2 h-20 w-full rounded-xl object-cover"
                  />
                )}
                <p className="text-xs font-medium text-[#2D2D2D]">{match.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
