import { useState, useEffect } from 'react'
import { Heart, X, Clock, ChefHat, Flame, Loader2 } from 'lucide-react'
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

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    setLoading(true)
    try {
      const data = await getRecipeFeed(20)
      setRecipes(data.recipes || [])
      setCurrentIdx(0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSwipe(direction: 'left' | 'right') {
    if (currentIdx >= recipes.length) return
    const recipe = recipes[currentIdx]

    try {
      const result = await swipeRecipe(recipe.id, direction)
      if (result.match) {
        setMatchNotification(`You matched on ${recipe.title}!`)
        setTimeout(() => setMatchNotification(null), 3000)
      }
    } catch (err) {
      console.error(err)
    }

    setCurrentIdx(prev => prev + 1)

    // If running low, load more
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

  if (currentIdx >= recipes.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4">
        <ChefHat size={48} className="mb-4 text-[#8C8C8C]" />
        <h2 className="text-lg font-bold text-[#2D2D2D]">No more recipes</h2>
        <p className="mt-2 text-sm text-[#8C8C8C]">Check back tomorrow for fresh dishes!</p>
        <button
          onClick={loadRecipes}
          className="mt-4 rounded-2xl bg-[#FF6B4A] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Refresh Deck
        </button>
      </div>
    )
  }

  const recipe = recipes[currentIdx]

  return (
    <div className="flex h-full flex-col px-4 py-4">
      {/* Match notification */}
      {matchNotification && (
        <div className="mb-3 rounded-2xl bg-[#FFD93D] px-4 py-3 text-center shadow-sm">
          <p className="text-sm font-bold text-[#2D2D2D]">{matchNotification}</p>
        </div>
      )}

      {/* Recipe Card */}
      <div className="relative flex-1 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-[55%] w-full object-cover"
          />
        ) : (
          <div className="flex h-[55%] w-full items-center justify-center bg-[#FFFBF7]">
            <ChefHat size={48} className="text-[#8C8C8C]" />
          </div>
        )}

        <div className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#2D2D2D]">{recipe.title}</h2>
          </div>

          <div className="mb-3 flex items-center gap-3 text-sm text-[#8C8C8C]">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {recipe.total_time_minutes} min
            </span>
            {recipe.is_stretch && (
              <span className="flex items-center gap-1 rounded-full bg-[#FFB347]/20 px-2 py-0.5 text-xs font-medium text-[#FFB347]">
                <Flame size={12} />
                +{recipe.stretch_minutes} min stretch
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {recipe.tags?.slice(0, 4).map((tag: string) => (
              <span key={tag} className="rounded-full bg-[#4ECDC4]/10 px-2.5 py-1 text-[11px] font-medium text-[#4ECDC4]">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-xs text-[#8C8C8C]">
              {recipe.ingredients?.slice(0, 5).map((i: any) => i.name).join(', ')}
              {recipe.ingredients?.length > 5 ? '...' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Swipe Buttons */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => handleSwipe('left')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition active:scale-95"
        >
          <X size={28} className="text-[#8C8C8C]" />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/30 transition active:scale-95"
        >
          <Heart size={32} className="text-white" />
        </button>
      </div>
    </div>
  )
}
