import { useEffect, useState } from 'react'
import { Clock, ChefHat, ArrowLeft } from 'lucide-react'
import { BottomSheet } from './BottomSheet'

export interface Recipe {
  id: string
  title: string
  description?: string
  image_url?: string
  total_time_minutes: number
  tags: string[]
  ingredients: { name: string; category: string; quantity?: string; unit?: string; original_name?: string }[]
  instructions?: string[]
  is_stretch?: boolean
  stretch_minutes?: number
}

interface RecipeDetailModalProps {
  recipe: Recipe | null
  onClose: () => void
  onSchedule?: (recipeId: string) => void
}

export default function RecipeDetailModal({ recipe, onClose, onSchedule }: RecipeDetailModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (recipe) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [recipe])

  if (!recipe) return null

  return (
    <BottomSheet isOpen={true} onClose={onClose}>
      {/* Hero Image */}
      <div className="relative -mx-5 -mt-4 mb-4 aspect-[16/10] overflow-hidden rounded-t-3xl">
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="h-full w-full bg-[#F0E6E0] flex items-center justify-center">
            <ChefHat size={48} className="text-[#8C8C8C]/50" />
          </div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
            {recipe.title}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
              <Clock size={12} />
              {recipe.total_time_minutes}m
            </span>
            {recipe.tags?.map((tag) => (
              <span key={tag} className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
          Ingredients ({recipe.ingredients?.length || 0})
        </h3>
        {recipe.ingredients?.length === 0 ? (
          <p className="text-sm text-[#8C8C8C]">No ingredients listed.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(
              (recipe.ingredients || []).reduce((acc, ing) => {
                const cat = ing.category || 'other'
                acc[cat] = acc[cat] || []
                acc[cat].push(ing)
                return acc
              }, {} as Record<string, typeof recipe.ingredients>)
            ).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-[#FF6B4A] uppercase tracking-wider mb-1.5">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((ing, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-[#FFFBF7] border border-[#F0E6E0] px-2.5 py-1 text-xs text-[#2D2D2D]"
                    >
                      {ing.quantity && ing.unit
                        ? `${ing.quantity} ${ing.unit} ${ing.name}`
                        : ing.quantity
                        ? `${ing.quantity} ${ing.name}`
                        : ing.original_name || ing.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
            Instructions
          </h3>
          <div className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-[#2D2D2D] leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule button */}
      {onSchedule && (
        <button
          onClick={() => { onSchedule(recipe.id); onClose() }}
          className="w-full rounded-2xl bg-[#FF6B4A] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-transform"
        >
          📅 Schedule This Meal
        </button>
      )}
    </BottomSheet>
  )
}
