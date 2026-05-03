import { useState, useEffect, useCallback } from 'react'
import { Heart, X, Clock, Flame, ChefHat, Loader2, Sparkles } from 'lucide-react'
import { getRecipeFeed, swipeRecipe } from '../lib/api'

interface Recipe {
  id: string
  title: string
  description?: string
  image_url?: string
  total_time_minutes: number
  tags: string[]
  ingredients: { name: string; category: string }[]
  is_stretch: boolean
  stretch_minutes: number
}

export default function SwipeDeck() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchNotification, setMatchNotification] = useState<string | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    setLoading(true)
    try {
      const data = await getRecipeFeed(20)
      setRecipes(data.recipes || [])
      setCurrentIdx(0)
      setDragX(0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = useCallback(async (dir: 'left' | 'right') => {
    if (currentIdx >= recipes.length) return
    const recipe = recipes[currentIdx]

    // Animate card off screen
    const exitX = dir === 'right' ? 500 : -500
    setDragX(exitX)

    // Wait for animation then process
    setTimeout(async () => {
      try {
        const result = await swipeRecipe(recipe.id, dir)
        if (result.match) {
          setMatchNotification(`You matched on ${recipe.title}!`)
          setTimeout(() => setMatchNotification(null), 3000)
        }
      } catch (err) {
        console.error(err)
      }

    setCurrentIdx(prev => prev + 1)
      setDragX(0)

      // Preload more if running low
      if (currentIdx >= recipes.length - 5) {
        loadRecipes()
      }
    }, 300)
  }, [currentIdx, recipes])

  const handleTouchStart = () => {
    setIsDragging(true)
  }


  const handleTouchEnd = () => {
    setIsDragging(false)
    if (dragX > 100) {
      handleSwipe('right')
    } else if (dragX < -100) {
      handleSwipe('left')
    } else {
      setDragX(0)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  if (currentIdx >= recipes.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#FF6B4A]/10 mb-4">
          <ChefHat size={40} className="text-[#FF6B4A]" />
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D]">No more recipes</h2>
        <p className="mt-2 text-sm text-[#8C8C8C] text-center">Check back tomorrow for fresh dishes, or refresh now!</p>
        <button
          onClick={loadRecipes}
          className="mt-6 rounded-2xl bg-[#FF6B4A] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25"
        >
          Refresh Deck
        </button>
      </div>
    )
  }

  const recipe = recipes[currentIdx]
  const nextRecipe = recipes[currentIdx + 1]

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Match notification */}
      {matchNotification && (
        <div className="absolute top-4 left-4 right-4 z-50 rounded-2xl bg-[#FFD93D] px-4 py-3 text-center shadow-lg shadow-[#FFD93D]/30">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-[#2D2D2D]" />
            <p className="text-sm font-bold text-[#2D2D2D]">{matchNotification}</p>
            <Sparkles size={16} className="text-[#2D2D2D]" />
          </div>
        </div>
      )}

      {/* Card stack container */}
      <div className="relative flex-1 px-4 pt-4 pb-6">
        {/* Next card (peek behind) */}
        {nextRecipe && (
          <div className="absolute inset-4 top-8 rounded-[1.5rem] bg-white shadow-md overflow-hidden opacity-50 scale-95">
            {nextRecipe.image_url ? (
              <img src={nextRecipe.image_url} alt="" className="h-full w-full object-cover opacity-60" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#FFFBF7]">
                <ChefHat size={32} className="text-[#8C8C8C]" />
              </div>
            )}
          </div>
        )}

        {/* Current card */}
        <div
          className="relative h-full rounded-[1.5rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image section (60% height) */}
          <div className="relative h-[60%] w-full">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#FFFBF7]">
                <ChefHat size={48} className="text-[#8C8C8C]" />
              </div>
            )}
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Time badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5">
              <Clock size={14} className="text-[#2D2D2D]" />
              <span className="text-xs font-semibold text-[#2D2D2D]">{recipe.total_time_minutes} min</span>
            </div>

            {/* Stretch badge */}
            {recipe.is_stretch && (
              <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-[#FFB347]/90 backdrop-blur px-3 py-1.5">
                <Flame size={12} className="text-white" />
                <span className="text-xs font-semibold text-white">+{recipe.stretch_minutes} min stretch</span>
              </div>
            )}

            {/* Title on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-lg">
                {recipe.title}
              </h2>
            </div>
          </div>

          {/* Info section (40% height) */}
          <div className="flex h-[40%] flex-col justify-between p-5">
            <div>
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags?.slice(0, 4).map((tag: string) => (
                  <span key={tag} className="rounded-full bg-[#4ECDC4]/10 px-3 py-1 text-xs font-medium text-[#4ECDC4]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Ingredients preview */}
              <p className="text-sm text-[#8C8C8C] leading-relaxed">
                {recipe.ingredients?.slice(0, 5).map((i: any) => i.name).join(' · ')}
                {recipe.ingredients?.length > 5 ? ' · ...' : ''}
              </p>
            </div>

            {/* Action buttons - floating at bottom */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={(e) => { e.stopPropagation(); handleSwipe('left'); }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-[#E8E8E8] shadow-lg transition active:scale-95 hover:bg-[#F5F5F5]"
              >
                <X size={28} className="text-[#8C8C8C]" />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleSwipe('right'); }}
                className="flex h-18 w-18 items-center justify-center rounded-full bg-[#FF6B4A] shadow-xl shadow-[#FF6B4A]/40 transition active:scale-95 hover:bg-[#e85d3d]"
                style={{ width: '72px', height: '72px' }}
              >
                <Heart size={32} className="text-white" fill="white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe instruction */}
      <div className="pb-4 text-center">
        <p className="text-xs text-[#8C8C8C]">Tap ❤️ to like · Tap ✕ to pass</p>
      </div>
    </div>
  )
}
