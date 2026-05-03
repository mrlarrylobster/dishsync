import { X, Clock, ShoppingCart, ChefHat, Flame } from 'lucide-react'

interface Ingredient {
  name: string
  original_name?: string
  quantity?: number
  unit?: string
  category: string
  is_perishable?: boolean
}

export interface Recipe {
  id: string
  title: string
  description?: string
  image_url?: string
  total_time_minutes: number
  tags: string[]
  ingredients: Ingredient[]
  instructions?: string[]
  is_stretch?: boolean
  stretch_minutes?: number
}

interface RecipeDetailModalProps {
  recipe: Recipe | null
  onClose: () => void
  synergy?: {
    overlap_count: number
    overlap_items: string[]
    reason: string
  }
}

export default function RecipeDetailModal({ recipe, onClose, synergy }: RecipeDetailModalProps) {
  if (!recipe) return null

  const categories = [...new Set(recipe.ingredients.map(i => i.category))]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-[#FFFBF7] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Image header */}
        <div className="relative h-56 shrink-0">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover rounded-t-3xl sm:rounded-t-3xl" />
          ) : (
            <div className="w-full h-full bg-[#F0E6E0] flex items-center justify-center rounded-t-3xl">
              <ChefHat size={48} className="text-[#8C8C8C]" />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white backdrop-blur"
          >
            <X size={20} />
          </button>
          
          {/* Stretch badge */}
          {recipe.is_stretch && (
            <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-[#FFD93D] px-3 py-1.5 text-xs font-bold text-[#2D2D2D]">
              <Flame size={14} />
              +{recipe.stretch_minutes} min stretch
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title + tags */}
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">{recipe.title}</h2>
          
          <div className="flex flex-wrap gap-1.5 mb-4">
            {recipe.tags?.map(tag => (
              <span key={tag} className="px-2 py-1 rounded-full bg-[#4ECDC4]/10 text-[#4ECDC4] text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mb-4 text-sm text-[#8C8C8C]">
            <span className="flex items-center gap-1">
              <Clock size={16} className="text-[#FF6B4A]" />
              {recipe.total_time_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <ShoppingCart size={16} className="text-[#4ECDC4]" />
              {recipe.ingredients.length} ingredients
            </span>
          </div>

          {/* Synergy badge */}
          {synergy && synergy.overlap_count > 0 && (
            <div className="mb-4 p-3 rounded-2xl bg-[#4ECDC4]/10 border border-[#4ECDC4]/20">
              <p className="text-sm text-[#2D2D2D]">
                <span className="font-semibold">🛒 Smart match:</span> {synergy.reason}
              </p>
              <p className="text-xs text-[#8C8C8C] mt-1">
                You already have: {synergy.overlap_items.join(", ")}
              </p>
            </div>
          )}

          {/* Ingredients by category */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#8C8C8C] uppercase tracking-wider mb-3">Ingredients</h3>
            
            {categories.map(cat => (
              <div key={cat} className="mb-3">
                <p className="text-xs font-semibold text-[#4ECDC4] uppercase mb-1.5">{cat}</p>
                <div className="space-y-1.5">
                  {recipe.ingredients
                    .filter(i => i.category === cat)
                    .map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white border border-[#F0E6E0]">
                        <span className="text-sm text-[#2D2D2D]">{ing.name}</span>
                        <span className="text-xs text-[#8C8C8C]">
                          {ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ing.original_name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#8C8C8C] uppercase tracking-wider mb-3">Instructions</h3>
              <div className="space-y-3">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B4A] text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-[#2D2D2D] leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description if available */}
          {recipe.description && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#8C8C8C] uppercase tracking-wider mb-2">About</h3>
              <p className="text-sm text-[#2D2D2D] leading-relaxed">{recipe.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
