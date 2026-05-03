import { useState, useEffect } from 'react'
import { Heart, Clock, ChefHat, Loader2, CalendarDays, ArrowRight, Trash2 } from 'lucide-react'
import { getMatches, scheduleMatch, deleteMatch } from '../lib/api'
import RecipeDetailModal, { Recipe } from './RecipeDetailModal'

interface Match {
  match_id: string
  id?: string  // alias for recipe id
  title: string
  image_url?: string
  total_time_minutes: number
  tags: string[]
  status: string
  ingredients?: { name: string; category: string }[]
  instructions?: string[]
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MatchesView() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [showDayPicker, setShowDayPicker] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Match | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadMatches()
  }, [])

  async function loadMatches() {
    setLoading(true)
    try {
      const data = await getMatches()
      // Only show pending matches (not yet scheduled)
      const pending = (data.matches || []).filter((m: Match) => m.status === 'pending')
      setMatches(pending)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSchedule(matchId: string, day: string) {
    setSchedulingId(matchId)
    try {
      await scheduleMatch(matchId, day)
      setShowDayPicker(null)
      loadMatches()
    } catch (err) {
      console.error(err)
    } finally {
      setSchedulingId(null)
    }
  }

  async function handleDelete(matchId: string) {
    setDeletingId(matchId)
    try {
      await deleteMatch(matchId)
      loadMatches()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <Heart size={48} className="mb-4 text-[#8C8C8C]" />
        <h2 className="text-lg font-bold text-[#2D2D2D]">No matches yet</h2>
        <p className="mt-2 text-sm text-[#8C8C8C] text-center">
          Swipe right on recipes to match with your partner. Matched dishes will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-lg font-bold text-[#2D2D2D] mb-1">Your Matches</h2>
      <p className="text-sm text-[#8C8C8C] mb-4">
        {matches.length} dish{matches.length !== 1 ? 'es' : ''} waiting to be scheduled
      </p>

      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.match_id} 
            className="rounded-2xl bg-white border border-[#F0E6E0] overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
            onClick={() => setSelectedRecipe(match)}
          >
            <div className="flex">
              {/* Image */}
              <div className="w-24 h-24 shrink-0">
                {match.image_url ? (
                  <img src={match.image_url} alt={match.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FFFBF7] flex items-center justify-center">
                    <ChefHat size={24} className="text-[#8C8C8C]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2D2D2D] line-clamp-1">{match.title}</h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-[#8C8C8C]">
                    <Clock size={12} />
                    {match.total_time_minutes} min
                  </div>
                </div>

                {showDayPicker === match.match_id ? (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button
                        key={day}
                        onClick={(e) => { e.stopPropagation(); handleSchedule(match.match_id, day); }}
                        disabled={schedulingId === match.match_id}
                        className="px-2 py-1 rounded-lg bg-[#4ECDC4] text-white text-xs font-semibold active:scale-95"
                      >
                        {DAY_LABELS[i]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDayPicker(match.match_id); }}
                      className="flex items-center gap-1 text-xs font-semibold text-[#FF6B4A]"
                    >
                      <CalendarDays size={14} />
                      Schedule
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(match.match_id); }}
                      disabled={deletingId === match.match_id}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500 active:scale-95 disabled:opacity-50"
                    >
                      {deletingId === match.match_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipe ? {
          id: selectedRecipe.match_id,
          title: selectedRecipe.title,
          image_url: selectedRecipe.image_url,
          total_time_minutes: selectedRecipe.total_time_minutes,
          tags: selectedRecipe.tags,
          ingredients: selectedRecipe.ingredients || [],
          instructions: selectedRecipe.instructions,
        } as Recipe : null}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  )
}
