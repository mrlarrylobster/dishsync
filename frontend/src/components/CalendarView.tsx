import { useState, useEffect } from 'react'
import { Sparkles, Trash2, Loader2, Clock } from 'lucide-react'
import { getCalendar, autoSchedule, requestVeto } from '../lib/api'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayData {
  id: string
  status: string
  recipe: {
    id: string
    title: string
    image_url?: string
    total_time_minutes: number
    tags: string[]
  }
}

export default function CalendarView() {
  const [calendar, setCalendar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoScheduling, setAutoScheduling] = useState(false)

  useEffect(() => {
    loadCalendar()
  }, [])

  async function loadCalendar() {
    setLoading(true)
    try {
      const data = await getCalendar()
      setCalendar(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoSchedule() {
    setAutoScheduling(true)
    try {
      await autoSchedule()
      loadCalendar()
    } catch (err) {
      console.error(err)
    } finally {
      setAutoScheduling(false)
    }
  }

  async function handleRemove(day: string) {
    try {
      await requestVeto(day)
      loadCalendar()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#2D2D2D]">This Week</h2>
        <button
          onClick={handleAutoSchedule}
          disabled={autoScheduling}
          className="flex items-center gap-1.5 rounded-full bg-[#4ECDC4] px-4 py-2 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
        >
          {autoScheduling ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Auto-Schedule
        </button>
      </div>

      <div className="space-y-2">
        {DAYS.map((day, i) => {
          const dayData: DayData | null = calendar?.[day]
          return (
            <div
              key={day}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                dayData ? 'border-[#4ECDC4]/30 bg-[#4ECDC4]/5' : 'border-[#F0E6E0] bg-white'
              }`}
            >
              {/* Day badge */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFFBF7]">
                <span className="text-xs font-bold text-[#8C8C8C]">{DAY_LABELS[i]}</span>
              </div>

              {dayData ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D2D2D] truncate">
                    {dayData.recipe.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-[#8C8C8C]">
                      <Clock size={12} />
                      {dayData.recipe.total_time_minutes} min
                    </span>
                    {dayData.recipe.tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#4ECDC4]/10 text-[#4ECDC4]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#8C8C8C]">No meal planned</p>
              )}

              {dayData && (
                <button
                  onClick={() => handleRemove(day)}
                  className="p-2 rounded-full text-[#8C8C8C] hover:bg-red-50 hover:text-red-500 active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {calendar?.monday && (
        <div className="mt-4 p-3 rounded-2xl bg-[#FFD93D]/10 border border-[#FFD93D]/20">
          <p className="text-xs text-[#8C8C8C]">
            💡 Tap "Auto-Schedule" to intelligently place matched dishes across the week based on ingredient synergy and perishability.
          </p>
        </div>
      )}
    </div>
  )
}
