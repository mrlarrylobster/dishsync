import { useState, useEffect } from 'react'
import { Check, Copy, Loader2, ShoppingCart } from 'lucide-react'
import { getGroceryList, checkGroceryItem } from '../lib/api'

export default function GroceryView() {
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    try {
      await checkGroceryItem(itemId, !checked)
      loadList()
    } catch (err) {
      console.error(err)
    }
  }

  function exportList() {
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
        <ShoppingCart size={40} className="mb-3 text-[#8C8C8C]" />
        <p className="text-sm text-[#8C8C8C]">No grocery list yet</p>
        <p className="text-xs text-[#8C8C8C]">Schedule meals in your calendar to generate a list</p>
      </div>
    )
  }

  // Group by category
  const byCategory: Record<string, any[]> = {}
  list.items.forEach((item: any) => {
    const cat = item.category || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  })

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2D2D2D]">Grocery List</h2>
        <button
          onClick={exportList}
          className="flex items-center gap-1.5 rounded-full bg-[#4ECDC4] px-4 py-2 text-sm font-semibold text-white"
        >
          <Copy size={14} />
          Copy
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">
              {category}
            </h3>
            <div className="space-y-1">
              {items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id, item.is_checked)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    item.is_checked
                      ? 'border-[#6BCB77]/30 bg-[#6BCB77]/5'
                      : 'border-[#F0E6E0] bg-white'
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
                  <div className="flex-1">
                    <p className={`text-sm ${item.is_checked ? 'text-[#8C8C8C] line-through' : 'text-[#2D2D2D]'}`}>
                      {item.ingredient_name}
                    </p>
                    <p className="text-xs text-[#8C8C8C]">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
