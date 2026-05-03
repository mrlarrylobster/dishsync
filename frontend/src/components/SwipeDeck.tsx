import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, X, Clock, Flame, ChefHat, Loader2, Sparkles, Info } from 'lucide-react'
import { getRecipeFeed, swipeRecipe } from '../lib/api'
import RecipeDetailModal from './RecipeDetailModal'

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

// Common pantry staples most households already have
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
  'red wine vinegar', 'rice vinegar', 'coconut oil', 'sesame oil',
  'vegetable stock', 'chicken stock', 'beef stock', 'fish stock',
  'dried oregano', 'dried basil', 'dried thyme', 'bay leaf', 'bay leaves',
  'black pepper', 'white pepper', 'sea salt', 'kosher salt', 'table salt',
]

function getPantryOverlap(ingredients: { name: string }[]): string[] {
  const overlap: string[] = []
  for (const ing of ingredients) {
    const nameLower = ing.name.toLowerCase()
    for (const staple of PANTRY_STAPLES) {
      if (nameLower.includes(staple.toLowerCase())) {
        // Capitalize first letter for display
        overlap.push(ing.name)
        break
      }
    }
  }
  // Deduplicate and limit to 4
  return [...new Set(overlap)].slice(0, 4)
}

function PantrySynergyBadge({ ingredients }: { ingredients: { name: string }[] }) {
  const overlap = getPantryOverlap(ingredients)
  if (overlap.length === 0) return null

  return (
    <div
      className="mt-2 mx-4 rounded-xl bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 px-3 py-2"
    >
      <p className="text-xs text-[#2D2D2D]">
        <span className="font-semibold">🛒 Already have:</span> {overlap.join(', ')}
      </p>
    </div>
  )
}

export default function SwipeDeck() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchNotification, setMatchNotification] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  // Drag state
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    setLoading(true)
    setError('')
    try {
      const data = await getRecipeFeed(20)
      setRecipes(data.recipes || [])
      setCurrentIdx(0)
      setDragX(0)
      setDragY(0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipes')
    } finally {
      setLoading(false)
    }
  }

  const finishSwipe = useCallback((dir: 'left' | 'right') => {
    if (currentIdx >= recipes.length) return
    const recipe = recipes[currentIdx]

    // Animate card flying off
    const flyX = dir === 'right' ? window.innerWidth + 200 : -(window.innerWidth + 200)
    setDragX(flyX)
    setDragY(0)

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
      setDragY(0)

      if (currentIdx >= recipes.length - 5) {
        loadRecipes()
      }
    }, 300)
  }, [currentIdx, recipes])

  // Touch / mouse handlers
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    startXRef.current = clientX
    startYRef.current = clientY
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    const deltaX = clientX - startXRef.current
    const deltaY = clientY - startYRef.current
    setDragX(deltaX)
    setDragY(deltaY)
  }, [isDragging])

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 100
    const tapThreshold = 10
    const totalDrag = Math.sqrt(dragX * dragX + dragY * dragY)
    
    // Tap detection: small movement = open detail
    if (totalDrag < tapThreshold) {
      setDragX(0)
      setDragY(0)
      return
    }
    
    if (dragX > threshold) {
      finishSwipe('right')
    } else if (dragX < -threshold) {
      finishSwipe('left')
    } else {
      // Snap back
      setDragX(0)
      setDragY(0)
    }
  }, [isDragging, dragX, dragY, finishSwipe])

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging) e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const onTouchEnd = () => {
    handleEnd()
  }

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMove(e.clientX, e.clientY)
    }
  }

  const onMouseUp = () => {
    handleEnd()
  }

  const onMouseLeave = () => {
    if (isDragging) {
      handleEnd()
    }
  }

  // Rotation based on drag distance
  const rotation = dragX * 0.08

  // Opacity of swipe indicators
  const likeOpacity = Math.min(Math.max(dragX / 150, 0), 1)
  const nopeOpacity = Math.min(Math.max(-dragX / 150, 0), 1)

  // Scale based on drag
  const scale = isDragging ? 1.02 : 1

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
    <div className="relative flex h-full flex-col overflow-hidden px-4 py-4 select-none">
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
        <div
          ref={cardRef}
          className="relative h-full rounded-[1.5rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden cursor-grab active:cursor-grabbing touch-none"
          style={{
            transform: `translateX(${dragX}px) translateY(${dragY * 0.3}px) rotate(${rotation}deg) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Swipe indicators */}
          <div
            className="absolute top-8 left-6 z-20 border-4 border-[#FF6B4A] text-[#FF6B4A] font-bold text-2xl px-4 py-1 rounded-lg tracking-widest uppercase"
            style={{ opacity: nopeOpacity, transform: `rotate(${rotation * 0.5}deg)` }}
          >
            NOPE
          </div>
          <div
            className="absolute top-8 right-6 z-20 border-4 border-[#4ECDC4] text-[#4ECDC4] font-bold text-2xl px-4 py-1 rounded-lg tracking-widest uppercase"
            style={{ opacity: likeOpacity, transform: `rotate(${rotation * 0.5}deg)` }}
          >
            LIKE
          </div>

          {/* Image (55% height) */}
          <div 
            className="relative h-[55%] w-full cursor-pointer"
            onClick={() => {
              // Only open if not dragging
              if (!isDragging && Math.abs(dragX) < 5) {
                setSelectedRecipe(recipe)
              }
            }}
          >
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="h-full w-full object-cover"
                draggable={false}
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.className = 'relative h-[55%] w-full cursor-pointer flex items-center justify-center bg-[#FFFBF7]'
                  }
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

            {/* Info button */}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }}
              className="absolute top-4 right-1/2 translate-x-1/2 z-20 p-2 rounded-full bg-white/90 backdrop-blur shadow-md active:scale-95"
            >
              <Info size={16} className="text-[#2D2D2D]" />
            </button>

            {/* Title on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
                {recipe.title}
              </h2>
            </div>
          </div>

          {/* Smart pantry overlap badge */}
          <PantrySynergyBadge ingredients={recipe.ingredients} />

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

            {/* Action buttons - also work as tap */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); finishSwipe('left'); }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-[#E8E8E8] shadow-lg active:scale-95 transition-transform"
              >
                <X size={24} className="text-[#8C8C8C]" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); finishSwipe('right'); }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/30 active:scale-95 transition-transform"
              >
                <Heart size={28} className="text-white" fill="white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#8C8C8C] mt-3">
        Swipe right to like · Swipe left to pass · Or tap buttons
      </p>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal 
        recipe={selectedRecipe} 
        onClose={() => setSelectedRecipe(null)} 
      />
    </div>
  )
}