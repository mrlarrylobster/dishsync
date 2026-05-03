import { useState, useEffect } from 'react'
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import { Sparkles, Trash2, Loader2, Clock, GripVertical, Heart } from 'lucide-react'
import { getCalendar, getMatches, autoSchedule, requestVeto, moveMatch, scheduleMatch } from '../lib/api'
import RecipeDetailModal from './RecipeDetailModal'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Recipe {
  id: string
  title: string
  image_url?: string
  total_time_minutes: number
  tags: string[]
  ingredients: { name: string; category: string }[]
  instructions?: string[]
}

interface Match {
  match_id: string
  recipe: Recipe
  status: 'pending' | 'scheduled'
}

function DraggableMeal({ match, onTap }: { match: Match; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: match.match_id,
    data: { match },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-[#F0E6E0] shadow-sm select-none ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
      style={{ touchAction: 'none' }}
      onClick={onTap}
    >
      <GripVertical size={18} className="text-[#8C8C8C] shrink-0" />
      {match.recipe.image_url ? (
        <img src={match.recipe.image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" draggable={false} />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-[#FFFBF7] flex items-center justify-center shrink-0">
          <Clock size={14} className="text-[#8C8C8C]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2D2D2D] truncate">{match.recipe.title}</p>
        <span className="text-xs text-[#8C8C8C]">{match.recipe.total_time_minutes} min</span>
      </div>
    </div>
  )
}

function DayRow({
  day,
  label,
  match,
  onTap,
  onRemove,
}: {
  day: string
  label: string
  match?: Match
  onTap: () => void
  onRemove: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 transition-colors ${
        isOver
          ? 'border-[#4ECDC4] bg-[#4ECDC4]/10'
          : match
          ? 'border-[#4ECDC4]/30 bg-[#4ECDC4]/5'
          : 'border-[#F0E6E0] bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#8C8C8C] uppercase">{label}</span>
        {match && (
          <button
            onClick={onRemove}
            className="p-1 rounded-full hover:bg-red-50 text-[#8C8C8C] hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {match ? (
        <DraggableMeal match={match} onTap={onTap} />
      ) : (
        <div className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center ${
          isOver ? 'border-[#4ECDC4] bg-[#4ECDC4]/5' : 'border-[#E8E8E8] bg-[#FFFBF7]'
        }`}>
          <span className="text-xs text-[#8C8C8C]">Drop here</span>
        </div>
      )}
    </div>
  )
}

export default function PlanView() {
  const [calendar, setCalendar] = useState<any>(null)
  const [pendingMatches, setPendingMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [autoScheduling, setAutoScheduling] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [activeDragMatch, setActiveDragMatch] = useState<Match | null>(null)

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [calData, matchesData] = await Promise.all([getCalendar(), getMatches()])
      setCalendar(calData)
      const all = (matchesData.matches || []).map((m: any) => ({
        match_id: m.match_id,
        status: m.status,
        recipe: {
          id: m.id,
          title: m.title,
          image_url: m.image_url,
          total_time_minutes: m.total_time_minutes,
          tags: m.tags,
          ingredients: m.ingredients || [],
          instructions: m.instructions,
        },
      }))
      setPendingMatches(all.filter((m: Match) => m.status === 'pending'))
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
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setAutoScheduling(false)
    }
  }

  async function handleRemove(day: string) {
    try {
      await requestVeto(day)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleMove(matchId: string, fromDay: string, toDay: string) {
    try {
      await moveMatch(matchId, fromDay, toDay)
      loadData()
    } catch (err) {
      console.error('Move failed:', err)
    }
  }

  async function handleSchedule(matchId: string, day: string) {
    try {
      await scheduleMatch(matchId, day)
      loadData()
    } catch (err) {
      console.error('Schedule failed:', err)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const match = event.active.data.current?.match as Match
    if (match) setActiveDragMatch(match)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragMatch(null)
    if (!over) return

    const matchId = active.id as string
    const toDay = over.id as string

    const fromDay = DAYS.find((d) => calendar?.[d]?.id === matchId)
    if (fromDay) {
      if (fromDay !== toDay) handleMove(matchId, fromDay, toDay)
      return
    }

    handleSchedule(matchId, toDay)
  }

  const dayMatches: Record<string, Match | undefined> = {}
  DAYS.forEach((day) => {
    const calData = calendar?.[day]
    if (calData) {
      dayMatches[day] = {
        match_id: calData.id,
        status: 'scheduled',
        recipe: {
          ...calData.recipe,
          ingredients: calData.recipe.ingredients || [],
        },
      }
    }
  })

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
        <h2 className="text-lg font-bold text-[#2D2D2D]">Weekly Plan</h2>
        <button
          onClick={handleAutoSchedule}
          disabled={autoScheduling}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B4A] px-4 py-2 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
        >
          {autoScheduling ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Auto-Schedule
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Days list — full width rows */}
        <div className="space-y-3 mb-6">
          {DAYS.map((day, i) => (
            <DayRow
              key={day}
              day={day}
              label={DAY_LABELS[i]}
              match={dayMatches[day]}
              onTap={() => dayMatches[day] && setSelectedRecipe(dayMatches[day]!.recipe)}
              onRemove={() => handleRemove(day)}
            />
          ))}
        </div>

        {/* Pending matches pool */}
        <div className="rounded-2xl bg-white border border-[#F0E6E0] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-[#FF6B4A]" />
            <h3 className="text-sm font-bold text-[#2D2D2D]">Matches</h3>
            <span className="text-xs text-[#8C8C8C]">{pendingMatches.length} pending</span>
          </div>

          {pendingMatches.length === 0 ? (
            <p className="text-xs text-[#8C8C8C] text-center py-4">
              No pending matches. Swipe right to match!
            </p>
          ) : (
            <div className="space-y-2">
              {pendingMatches.map((match) => (
                <DraggableMeal
                  key={match.match_id}
                  match={match}
                  onTap={() => setSelectedRecipe(match.recipe)}
                />
              ))}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragMatch ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-[#4ECDC4] shadow-xl select-none">
              <GripVertical size={18} className="text-[#4ECDC4] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2D2D2D] truncate">{activeDragMatch.recipe.title}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  )
}
