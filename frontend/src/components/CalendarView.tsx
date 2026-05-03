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
import { Sparkles, Trash2, Loader2, Clock, GripVertical } from 'lucide-react'
import { getCalendar, autoSchedule, requestVeto, moveMatch } from '../lib/api'
import RecipeDetailModal from './RecipeDetailModal'

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
    ingredients?: { name: string; category: string }[]
    instructions?: string[]
  }
}

// Draggable card — entire card is the drag handle
function DraggableCard({
  dayData,
  onTap,
}: {
  dayData: DayData
  onTap: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dayData.id,
    data: { dayData },
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

      {dayData.recipe.image_url ? (
        <img
          src={dayData.recipe.image_url}
          alt=""
          className="h-10 w-10 rounded-lg object-cover shrink-0"
          draggable={false}
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-[#FFFBF7] flex items-center justify-center shrink-0">
          <Clock size={14} className="text-[#8C8C8C]" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2D2D2D] truncate">
          {dayData.recipe.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-[#8C8C8C]">
            <Clock size={12} />
            {dayData.recipe.total_time_minutes} min
          </span>
        </div>
      </div>
    </div>
  )
}

// Droppable day column
function DaySlot({
  day,
  label,
  dayData,
  onClickRecipe,
  onRemove,
}: {
  day: string
  label: string
  dayData?: DayData
  onClickRecipe: (recipe: any) => void
  onRemove: (day: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 transition-colors ${
        isOver
          ? 'border-[#4ECDC4] bg-[#4ECDC4]/10'
          : dayData
          ? 'border-[#4ECDC4]/30 bg-[#4ECDC4]/5'
          : 'border-[#F0E6E0] bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#8C8C8C] uppercase">{label}</span>
        {dayData && (
          <button
            onClick={() => onRemove(day)}
            className="p-1 rounded-full hover:bg-red-50 text-[#8C8C8C] hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {dayData ? (
        <DraggableCard
          dayData={dayData}
          onTap={() => onClickRecipe(dayData.recipe)}
        />
      ) : (
        <div
          className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center ${
            isOver ? 'border-[#4ECDC4] bg-[#4ECDC4]/5' : 'border-[#E8E8E8] bg-[#FFFBF7]'
          }`}
        >
          <span className="text-xs text-[#8C8C8C]">Drop here</span>
        </div>
      )}
    </div>
  )
}

export default function CalendarView() {
  const [calendar, setCalendar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoScheduling, setAutoScheduling] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [activeDragData, setActiveDragData] = useState<DayData | null>(null)

  // Touch + pointer sensors — delay distinguishes tap from drag
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

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

  async function handleMove(matchId: string, fromDay: string, toDay: string) {
    try {
      await moveMatch(matchId, fromDay, toDay)
      loadCalendar()
    } catch (err) {
      console.error('Move failed:', err)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current?.dayData as DayData
    if (data) setActiveDragData(data)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragData(null)

    if (!over) return

    const matchId = active.id as string
    const toDay = over.id as string

    // Find which day this match is currently on
    const fromDay = DAYS.find((d) => calendar?.[d]?.id === matchId)
    if (!fromDay || fromDay === toDay) return

    handleMove(matchId, fromDay, toDay)
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
        <h2 className="text-lg font-bold text-[#2D2D2D]">Weekly Plan</h2>
        <button
          onClick={handleAutoSchedule}
          disabled={autoScheduling}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B4A] px-4 py-2 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
        >
          {autoScheduling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Auto-Schedule
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-3">
          {DAYS.map((day, i) => {
            const dayData = calendar?.[day] as DayData | undefined
            return (
              <DaySlot
                key={day}
                day={day}
                label={DAY_LABELS[i]}
                dayData={dayData}
                onClickRecipe={setSelectedRecipe}
                onRemove={handleRemove}
              />
            )
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragData ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-[#4ECDC4] shadow-xl opacity-90 select-none">
              <GripVertical size={18} className="text-[#4ECDC4] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2D2D2D] truncate">
                  {activeDragData.recipe.title}
                </p>
                <span className="text-xs text-[#8C8C8C]">
                  {activeDragData.recipe.total_time_minutes} min
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="mt-4 text-center text-xs text-[#8C8C8C]">
        Long-press a card to drag. Tap to view details.
      </p>

      <RecipeDetailModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  )
}
