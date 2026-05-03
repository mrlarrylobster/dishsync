import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, X, Clock, Flame, ChefHat, Sparkles, Info, ArrowRight, ArrowLeft } from 'lucide-react'
import { getRecipeFeed, swipeRecipe } from '../lib/api'
import { haptic } from '../lib/haptic'
import RecipeDetailModal from './RecipeDetailModal'
import { SkeletonCard } from './Skeleton'
import { MatchConfetti } from './MatchConfetti'

interface Recipe {
  id: string
  title: string
  description?: string
  image_url?: string
  total_time_minutes: number
  tags: string[]
  ingredients: { name: string; category: string }[]
  instructions?: string[]
  is_stretch: boolean
  stretch_minutes: number
}

const PANTRY_STAPLES = [
  'salt', 'pepper', 'oil', 'olive oil', 'vegetable oil', 'butter', 'garlic',
  'onion', 'egg', 'eggs', 'flour', 'sugar', 'milk', 'water', 'soy sauce',
  'vinegar', 'honey', 'rice', 'pasta', 'bread', 'tomato', 'potato', 'carrot',
  'lemon', 'lime', 'ginger', 'chili', 'chilli', 'cumin', 'paprika', 'oregano',
  'basil', 'thyme', 'rosemary', 'cinnamon', 'nutmeg', 'stock', 'broth',
  'mustard', 'ketchup', 'mayonnaise', 'cream', 'yogurt', 'cheese', 'cheddar',
  'parmesan', 'mozzarella', 'baking powder', 'baking soda', 'yeast',
  'cornstarch', 'cornflour', 'vanilla', 'cocoa', 'chocolate', 'coffee',
  'tea', 'brown sugar', 'powdered sugar', 'caster sugar', 'granulated sugar',
  'white wine vinegar', 'balsamic vinegar', 'apple cider vinegar',
]

interface SwipeDeckProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export default function SwipeDeck({ showToast }: SwipeDeckProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [matchNotification, setMatchNotification] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [recycled, setRecycled] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    const seen = localStorage.getItem('dishpair_swipe_hint_seen')
    if (!seen) setShowHint(true)
  }, [])

  function dismissHint() {
    localStorage.setItem('dishpair_swipe_hint_seen', '1')
    setShowHint(false)
  }

  useEffect(() => { loadFeed() }, [])

  async function loadFeed() {
    setLoading(true)
    try {
      const data = await getRecipeFeed()
      setRecipes(data.recipes || [])
      setCurrentIndex(0)
      setDragX(0)
      setDragY(0)
      setRecycled(data.recycled || false)
    } catch (err: any) {
      console.error('Feed error:', err)
      if (err.message?.includes('401')) {
        showToast('Session expired. Please sign in again.', 'error')
        localStorage.removeItem('dishsync_token')
        window.location.reload()
      } else {
        showToast('Failed to load recipes.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  function getPantrySynergy(recipe: Recipe) {
    const pantryItems = recipe.ingredients
      .filter((ing) => PANTRY_STAPLES.some((staple) => ing.name.toLowerCase().includes(staple)))
      .map((ing) => ing.name)
    return pantryItems.length > 0 ? pantryItems.slice(0, 3) : null
  }

  const onTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startX.current = clientX
    startY.current = clientY
    isDragging.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const dx = clientX - startX.current
    const dy = clientY - startY.current
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) isDragging.current = true
    if (isDragging.current) {
      e.preventDefault?.()
      setDragX(dx)
      setDragY(dy)
      if (dx > 50) setSwipeDir('right')
      else if (dx < -50) setSwipeDir('left')
      else setSwipeDir(null)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    if (Math.abs(dragX) > 120) {
      handleSwipe(dragX > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
      setDragY(0)
      setSwipeDir(null)
    }
  }, [dragX])

  async function handleSwipe(dir: 'left' | 'right') {
    const recipe = recipes[currentIndex]
    if (!recipe) return
    const flyX = dir === 'right' ? window.innerWidth + 200 : -(window.innerWidth + 200)
    setDragX(flyX)
    setDragY(0)
    haptic(dir === 'right' ? 'medium' : 'light')

    setTimeout(async () => {
      try {
        const result = await swipeRecipe(recipe.id, dir)
        if (result.match) {
          setMatchNotification(`You matched on ${recipe.title}!`)
          setShowConfetti(true)
          haptic('success')
          showToast(`🎉 Matched on ${recipe.title}!`, 'success')
          setTimeout(() => { setMatchNotification(null); setShowConfetti(false) }, 3000)
        }
        setCurrentIndex((prev) => prev + 1)
        setDragX(0)
        setDragY(0)
        setSwipeDir(null)
      } catch (err) {
        console.error(err)
        showToast('Failed to save swipe. Try again.', 'error')
        setDragX(0)
        setDragY(0)
      }
    }, 250)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xs space-y-4">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (currentIndex >= recipes.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#FF6B4A]/10 flex items-center justify-center mb-4">
          <Sparkles size={36} className="text-[#FF6B4A]" />
        </div>
        <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">
          {recycled ? "You're all caught up! 🔄" : "You've seen everything!"}
        </h3>
        <p className="text-sm text-[#8C8C8C] mb-6 max-w-xs">
          {recycled
            ? "All recipes have been swiped. New recipes are added regularly!"
            : "Great job deciding together. Check your Plan tab to see your matches."}
        </p>
        <button
          onClick={loadFeed}
          className="flex items-center gap-2 rounded-2xl bg-[#FF6B4A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-transform"
        >
          <ArrowRight size={16} />
          Discover More
        </button>
      </div>
    )
  }

  const current = recipes[currentIndex]
  const next = recipes[currentIndex + 1]
  const synergy = getPantrySynergy(current)

  return (
    <div className="flex-1 flex flex-col select-none touch-none overflow-hidden">
      {showConfetti && <MatchConfetti />}

      {/* Match notification */}
      {matchNotification && (
        <div className="absolute top-3 left-3 right-3 z-40 animate-[toast-enter_0.4s_ease-out]">
          <div className="rounded-xl bg-[#FFD93D] px-3 py-2 shadow-lg text-center">
            <p className="text-sm font-bold text-[#2D2D2D]">🎉 {matchNotification}</p>
          </div>
        </div>
      )}

      {/* Hint overlay */}
      {showHint && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={dismissHint}>
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-xs text-center shadow-2xl animate-[modal-enter_0.3s_ease-out]">
            <div className="flex justify-center gap-6 mb-3">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-1">
                  <ArrowLeft size={18} className="text-red-500" />
                </div>
                <span className="text-xs font-medium text-[#8C8C8C]">Pass</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#FF6B4A]/10 flex items-center justify-center mb-1">
                  <ArrowRight size={18} className="text-[#FF6B4A]" />
                </div>
                <span className="text-xs font-medium text-[#8C8C8C]">Like</span>
              </div>
            </div>
            <h3 className="text-base font-bold text-[#2D2D2D] mb-1">Swipe to decide</h3>
            <p className="text-xs text-[#8C8C8C] mb-3">
              Swipe right for recipes you want, left to skip.
            </p>
            <button onClick={dismissHint} className="w-full rounded-xl bg-[#FF6B4A] py-2.5 text-sm font-semibold text-white active:scale-95">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Recycled banner */}
      {recycled && (
        <div className="absolute top-3 left-3 right-3 z-30 rounded-lg bg-[#4ECDC4]/15 border border-[#4ECDC4]/30 px-2 py-1.5 text-center">
          <p className="text-xs font-medium text-[#4ECDC4]">🔄 Showing previously swiped recipes</p>
        </div>
      )}

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center px-3 py-2">
        <div className="relative w-full max-w-xs" style={{ maxHeight: 'calc(100dvh - 200px)' }}>
          {/* Background card */}
          {next && (
            <div className="absolute inset-0 rounded-2xl bg-white shadow-sm overflow-hidden scale-[0.95] translate-y-1 opacity-50">
              {next.image_url && (
                <img src={next.image_url} alt="" className="h-[55%] w-full object-cover" loading="lazy" />
              )}
            </div>
          )}

          {/* Current card */}
          <div
            className="relative rounded-2xl bg-white shadow-lg overflow-hidden touch-none flex flex-col"
            style={{
              maxHeight: 'calc(100dvh - 200px)',
              transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${dragX * 0.05}deg)`,
              transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onTouchStart}
            onMouseMove={onTouchMove}
            onMouseUp={onTouchEnd}
            onMouseLeave={onTouchEnd}
          >
            {/* Swipe stamps */}
            {swipeDir === 'right' && (
              <div className="absolute top-4 left-4 z-20 rounded-lg border-3 border-[#6BCB77] bg-[#6BCB77]/10 px-3 py-1 transform -rotate-12">
                <span className="text-xl font-bold text-[#6BCB77] tracking-wider">LIKE</span>
              </div>
            )}
            {swipeDir === 'left' && (
              <div className="absolute top-4 right-4 z-20 rounded-lg border-3 border-red-400 bg-red-400/10 px-3 py-1 transform rotate-12">
                <span className="text-xl font-bold text-red-400 tracking-wider">NOPE</span>
              </div>
            )}

            {/* Image */}
            <div className="relative shrink-0" style={{ height: '55%' }}>
              {current.image_url ? (
                <img
                  src={current.image_url}
                  alt={current.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="h-full w-full bg-[#F0E6E0] flex items-center justify-center">
                  <ChefHat size={40} className="text-[#8C8C8C]/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Top badges */}
              <div className="absolute top-2 left-2 flex gap-1.5">
                {current.is_stretch && (
                  <span className="rounded-md bg-[#FFB347] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm flex items-center gap-0.5">
                    <Flame size={8} />+{current.stretch_minutes}m
                  </span>
                )}
                {synergy && (
                  <span className="rounded-md bg-[#4ECDC4] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    🛒 {synergy.length} pantry
                  </span>
                )}
              </div>

              {/* Time badge */}
              <div className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1 shadow-sm">
                <Clock size={10} className="text-[#FF6B4A]" />
                <span className="text-[10px] font-bold text-[#2D2D2D]">{current.total_time_minutes}m</span>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h2 className="text-lg font-bold text-white leading-tight drop-shadow-lg">
                  {current.title}
                </h2>
                {current.tags?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {current.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[9px] font-medium text-white">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="flex-1 flex flex-col justify-between p-3 bg-white min-h-0">
              <div>
                <p className="text-xs text-[#8C8C8C] line-clamp-2 leading-relaxed">
                  {current.description || `${current.ingredients?.length || 0} ingredients · ${current.total_time_minutes} minutes`}
                </p>

                {/* Ingredient chips */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {current.ingredients?.slice(0, 5).map((ing, i) => (
                    <span key={i} className="rounded-md bg-[#FFFBF7] border border-[#F0E6E0] px-1.5 py-0.5 text-[9px] text-[#666666]">
                      {ing.name}
                    </span>
                  ))}
                  {current.ingredients?.length > 5 && (
                    <span className="rounded-md bg-[#FFFBF7] px-1.5 py-0.5 text-[9px] text-[#8C8C8C]">+{current.ingredients.length - 5}</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => handleSwipe('left')}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white border-2 border-red-200 text-red-500 shadow-sm active:scale-90 transition-transform hover:bg-red-50"
                >
                  <X size={18} />
                </button>

                <button
                  onClick={() => setSelectedRecipe(current)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0E6E0] text-[#8C8C8C] active:scale-90 transition-transform hover:bg-[#E8E8E8]"
                  aria-label="Recipe details"
                >
                  <Info size={14} />
                </button>

                <button
                  onClick={() => handleSwipe('right')}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF6B4A] text-white shadow-md shadow-[#FF6B4A]/30 active:scale-90 transition-transform hover:bg-[#FF5A3A]"
                >
                  <Heart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card counter */}
      <div className="flex justify-center pb-1 pt-1">
        <div className="flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-sm border border-[#F0E6E0] px-2.5 py-1 shadow-sm">
          <ChefHat size={10} className="text-[#FF6B4A]" />
          <span className="text-[10px] font-medium text-[#8C8C8C]">{currentIndex + 1} / {recipes.length}</span>
        </div>
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  )
}
