import { useState, useEffect } from 'react'
import { Loader2, ShoppingCart, Copy, Check } from 'lucide-react'
import { getGroceryList, checkGroceryItem, clearCheckedGroceryItems, markAllGroceryItems } from '../lib/api'

// Category sort order
const CATEGORY_ORDER: Record<string, number> = {
  produce: 0,
  meat: 1,
  seafood: 2,
  dairy: 3,
  pantry: 4,
  other: 5,
}

const CATEGORY_LABELS: Record<string, string> = {
  produce: '🥬 Produce',
  meat: '🥩 Meat',
  seafood: '🐟 Seafood',
  dairy: '🥛 Dairy',
  pantry: '🥫 Pantry',
  other: '📦 Other',
}

export default function GroceryView() {
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadList()
  }, [])

  async function loadList() {
    setLoading(true)
    try {
      const data = await getGroceryList()
      setList(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleItem(itemId: string, checked: boolean) {
    setUpdating(prev => new Set(prev).add(itemId))
    try {
      await checkGroceryItem(itemId, !checked)
      loadList()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  async function handleMarkAll(checked: boolean) {
    try {
      await markAllGroceryItems(checked)
      loadList()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleClearChecked() {
    try {
      await clearCheckedGroceryItems()
      loadList()
    } catch (err) {
      console.error(err)
    }
  }

  function copyList() {
    if (!list?.items) return
    const text = list.items.map((i: any) => `${i.is_checked ? '[x]' : '[ ]'} ${i.ingredient_name} ${i.quantity || ''} ${i.unit || ''}`).join('\n')
    navigator.clipboard.writeText(text)
    alert('Grocery list copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  if (!list?.items?.length) {
    return (
      <div className="flex flex-col items-center px-4 py-12">
        <div className="w-20 h-20 rounded-full bg-[#F0E6E0] flex items-center justify-center mb-4">
          <ShoppingCart size={32} className="text-[#8C8C8C]" />
        </div>
        <p className="text-sm font-semibold text-[#2D2D2D] mb-1">No groceries needed</p>
        <p className="text-xs text-[#8C8C8C] text-center px-8">
          Schedule meals in the Plan tab to generate your grocery list
        </p>
      </div>
    )
  }

  const items = list.items || []
  const unchecked = items.filter((i: any) => !i.is_checked)
  const checked = items.filter((i: any) => i.is_checked)

  // Group by category with sorting
  const byCategory: Record<string, any[]> = {}
  items.forEach((item: any) => {
    const cat = (item.category || 'other').toLowerCase()
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  })
  const sortedCategories = Object.keys(byCategory).sort(
    (a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99)
  )

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#2D2D2D]">Grocery List</h2>
          <p className="text-xs text-[#8C8C8C]">
            {unchecked.length} remaining · {checked.length} done
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyList}
            className="flex items-center gap-1.5 rounded-full bg-[#FFD93D] px-4 py-2 text-sm font-semibold text-[#2D2D2D] active:scale-95"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleMarkAll(true)}
          className="flex-1 rounded-xl border border-[#6BCB77]/30 bg-[#6BCB77]/10 px-3 py-2 text-xs font-semibold text-[#6BCB77] active:scale-95"
        >
          ✓ Mark All Done
        </button>
        {checked.length > 0 && (
          <button
            onClick={handleClearChecked}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 active:scale-95"
          >
            Clear Done
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedCategories.map((category) => {
          const catItems = byCategory[category].filter((i: any) => !i.is_checked)
          if (catItems.length === 0) return null
          return (
            <div key={category}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="space-y-1">
                {catItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.is_checked)}
                    disabled={updating.has(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      updating.has(item.id)
                        ? 'opacity-50'
                        : 'border-[#F0E6E0] bg-white active:scale-[0.98]'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        item.is_checked
                          ? 'border-[#6BCB77] bg-[#6BCB77]'
                          : 'border-[#8C8C8C]'
                      }`}
                    >
                      {item.is_checked && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.is_checked ? 'text-[#8C8C8C] line-through' : 'text-[#2D2D2D]'}`}>
                        {item.ingredient_name}
                      </p>
                      {(item.quantity || item.unit) && (
                        <p className="text-xs text-[#8C8C8C]">
                          {item.quantity || ''} {item.unit || ''}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Done items */}
        {checked.length > 0 && (
          <div className="pt-4 border-t border-[#F0E6E0]">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">
              Done
            </h3>
            <div className="space-y-1">
              {checked.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id, item.is_checked)}
                  disabled={updating.has(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    updating.has(item.id)
                      ? 'opacity-50'
                      : 'border-[#6BCB77]/30 bg-[#6BCB77]/5'
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#6BCB77] bg-[#6BCB77]">
                    <Check size={12} className="text-white" />
                  </div>
                  <p className="text-sm text-[#8C8C8C] line-through">
                    {item.ingredient_name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
