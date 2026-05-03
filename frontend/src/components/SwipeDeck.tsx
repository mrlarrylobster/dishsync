import { useState, useEffect } from 'react'
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
  const [error, setError] = useState('')
  const [matchNotification, setMatchNotification] = useState<string | null>(null)

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    setLoading(true)
    setError('')
    try {
      const data = await getRecipeFeed(20)
      console.log('Recipes loaded:', data.recipes?.length)
      setRecipes(data.recipes || [])
      setCurrentIdx(0)
    } catch (err: any) {
      console.error('Failed to load recipes:', err)
      setError(err.message || 'Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  async function handleSwipe(dir: 'left' | 'right') {
    if (currentIdx >= recipes.length) return
    const recipe = recipes[currentIdx]

    try {
      const result = await swipeRecipe(recipe.id, dir)
      console.log('Swipe result:', result)
      if (result.match) {
        setMatchNotification(`You matched on ${recipe.title}!`)
        setTimeout(() => setMatchNotification(null), 3000)
      }
    } catch (err) {
      console.error(err)
    }

    setCurrentIdx(prev => prev + 1)

    if (currentIdx >= recipes.length - 5) {
      loadRecipes()
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <ChefHat size={48} className="mb-4 text-[#8C8C8C]" />
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={loadRecipes} className="mt-4 rounded-2xl bg-[#FF6B4A] px-6 py-2.5 text-sm font-semibold text-white">
          Retry
        </button>
      </div>
    )
  }

  if (currentIdx >= recipes.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <ChefHat size={48} className="mb-4 text-[#8C8C8C]" />
        <h2 className="text-lg font-bold text-[#2D2D2D]">No more recipes</h2>
        <p className="mt-2 text-sm text-[#8C8C8C]">Check back tomorrow for fresh dishes!</p>
        <button onClick={loadRecipes} className="mt-4 rounded-2xl bg-[#FF6B4A] px-6 py-2.5 text-sm font-semibold text-white">
          Refresh Deck
        </button>
      </div>
    )
  }

  const recipe = recipes[currentIdx]
  const nextRecipe = recipes[currentIdx + 1]

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-4 py-4">
      {/* Match notification */}
      {matchNotification && (
        <div className="mb-3 rounded-2xl bg-[#FFD93D] px-4 py-3 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-[#2D2D2D]" />
            <p className="text-sm font-bold text-[#2D2D2D]">{matchNotification}</p>
            <Sparkles size={16} className="text-[#2D2D2D]" />
          </div>
        </div>
      )}

      {/* Card stack */}
      <div className="relative flex-1">
        {/* Next card (peek behind) */}
        {nextRecipe && (
          <div className="absolute inset-0 top-3 rounded-[1.5rem] bg-white shadow-md overflow-hidden opacity-40 scale-95">
            {nextRecipe.image_url ? (
              <img src={nextRecipe.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#FFFBF7]">
                <ChefHat size={32} className="text-[#8C8C8C]" />
              </div>
            )}
          </div>
        )}

        {/* Current card */}
        <div className="relative h-full rounded-[1.5rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Image (55% height) */}
          <div className="relative h-[55%] w-full">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', recipe.image_url)
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#FFFBF7]">
                <ChefHat size={48} className="text-[#8C8C8C]" />
              </div>
            )}
            
            {/* Gradient overlay */}
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
              <h2 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
                {recipe.title}
              </h2>
            </div>
          </div>

          {/* Info section */}
          <div className="p-5 flex flex-col justify-between h-[45%]">
            <div>
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags?.slice(0, 4).map((tag: string) => (
                  <span key={tag} className="rounded-full bg-[#4ECDC4]/10 px-3 py-1 text-xs font-medium text-[#4ECDC4]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Ingredients */}
              <p className="text-sm text-[#8C8C8C]">
                {recipe.ingredients?.slice(0, 5).map((i: any) => i.name).join(' · ')}
                {recipe.ingredients?.length > 5 ? ' · ...' : ''}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <button
                onClick={() => handleSwipe('left')}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-[#E8E8E8] shadow-lg active:scale-95"
              >
                <X size={24} className="text-[#8C8C8C]" />
              </button>
              
              <button
                onClick={() => handleSwipe('right')}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/30 active:scale-95"
              >
                <Heart size={28} className="text-white" fill="white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#8C8C8C] mt-3">
        Tap ❤️ to like · Tap ✕ to pass
      </p>
    </div>
  )
}