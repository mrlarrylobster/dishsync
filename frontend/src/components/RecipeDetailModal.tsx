import { useState } from 'react'
import { Clock, ChefHat } from 'lucide-react'
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

  if (!recipe) return null

  return (
    <BottomSheet isOpen={true} onClose={onClose} title={recipe.title}>
      {/* Compact Image */}
      <div className="relative mb-4 rounded-2xl overflow-hidden bg-[#F0E6E0]" style={{ height: '180px' }}>
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ChefHat size={40} className="text-[#8C8C8C]/50" />
          </div>
        )}
        {/* Time badge */}
        <div className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 flex items-center gap-1 shadow-sm">
          <Clock size={12} className="text-[#FF6B4A]" />
          <span className="text-xs font-bold text-[#2D2D2D]">{recipe.total_time_minutes}m</span>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-[#FFFBF7] border border-[#F0E6E0] px-2 py-0.5 text-[10px] font-medium text-[#8C8C8C]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
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
                <p className="text-[10px] font-bold text-[#FF6B4A] uppercase tracking-wider mb-1">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {items.map((ing, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-[#FFFBF7] border border-[#F0E6E0] px-2 py-0.5 text-xs text-[#2D2D2D]"
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
        <div className="mb-4">
          <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
            Instructions
          </h3>
          <div className="space-y-2">
            {recipe.instructions.map((step, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] text-[10px] font-bold">
                  {i + 1}
                </div>
                <p className="text-xs text-[#2D2D2D] leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule button */}
      {onSchedule && (
        <button
          onClick={() => { onSchedule(recipe.id); onClose() }}
          className="w-full rounded-2xl bg-[#FF6B4A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-transform"
        >
          📅 Schedule This Meal
        </button>
      )}
    </BottomSheet>
  )
}
