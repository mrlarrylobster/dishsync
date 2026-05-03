import { useState, useEffect } from 'react'
import { Plus, Trash2, ChefHat, AlertCircle, X } from 'lucide-react'
import { getPantry, addPantryItem, deletePantryItem } from '../lib/api'
import { haptic } from '../lib/haptic'
import PullToRefresh from './PullToRefresh'
import { SkeletonList } from './Skeleton'

const CATEGORIES = [
  { value: 'produce', label: 'Produce', emoji: '🥬' },
  { value: 'meat', label: 'Meat', emoji: '🥩' },
  { value: 'seafood', label: 'Seafood', emoji: '🐟' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'pantry', label: 'Pantry', emoji: '🥫' },
  { value: 'other', label: 'Other', emoji: '📦' },
]

export default function PantryView({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ ingredient_name: '', category: 'produce', quantity: '', unit: '' })
  const [formError, setFormError] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadPantry() }, [])

  async function loadPantry() {
    setLoading(true)
    try {
      const data = await getPantry()
      setItems(data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newItem.ingredient_name.trim()) {
      setFormError('Please enter an ingredient name')
      return
    }
    setAdding(true)
    setFormError('')
    try {
      await addPantryItem({
        ingredient_name: newItem.ingredient_name.trim(),
        category: newItem.category,
        quantity: parseFloat(newItem.quantity) || undefined,
        unit: newItem.unit.trim() || undefined,
      })
      haptic('success')
      showToast('Added to pantry!', 'success')
      setShowAdd(false)
      setNewItem({ ingredient_name: '', category: 'produce', quantity: '', unit: '' })
      loadPantry()
    } catch (err) {
      setFormError('Failed to add item')
      showToast('Failed to add item.', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deletePantryItem(itemId)
      haptic('medium')
      showToast('Item removed.', 'info')
      loadPantry()
    } catch (err) {
      console.error(err)
      showToast('Failed to delete item.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-7 skeleton w-24 rounded-lg" />
          <div className="h-10 w-10 skeleton rounded-full" />
        </div>
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadPantry}>
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2D2D2D]">Your Pantry</h2>
            <p className="text-xs text-[#8C8C8C]">{items.length} items</p>
          </div>
          <button
            onClick={() => { setShowAdd(!showAdd); setFormError(''); haptic('light') }}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90 ${
              showAdd ? 'bg-[#F0E6E0] text-[#8C8C8C]' : 'bg-[#FF6B4A] text-white shadow-md shadow-[#FF6B4A]/20'
            }`}
            aria-label={showAdd ? 'Cancel' : 'Add item'}
          >
            {showAdd ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>

        {/* Add Item Form */}
        {showAdd && (
          <div className="mb-4 rounded-2xl border border-[#F0E6E0] bg-white p-4 shadow-sm animate-[modal-enter_0.3s_ease-out]">
            {formError && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {formError}
              </div>
            )}
            <input
              type="text"
              placeholder="Ingredient name (e.g., Olive Oil)"
              value={newItem.ingredient_name}
              onChange={e => setNewItem({ ...newItem, ingredient_name: e.target.value })}
              className="mb-2 w-full rounded-2xl border-2 border-[#F0E6E0] bg-white px-4 py-3.5 text-sm text-[#2D2D2D] placeholder-[#C4C4C4] outline-none focus:border-[#FF6B4A] focus:shadow-lg focus:shadow-[#FF6B4A]/10 transition-all"
            />
            <div className="mb-2 flex gap-2">
              <input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                className="w-20 rounded-2xl border-2 border-[#F0E6E0] bg-white px-3 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#FF6B4A] focus:shadow-lg focus:shadow-[#FF6B4A]/10 transition-all"
              />
              <input
                type="text"
                placeholder="Unit"
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-24 rounded-2xl border-2 border-[#F0E6E0] bg-white px-3 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#FF6B4A] focus:shadow-lg focus:shadow-[#FF6B4A]/10 transition-all"
              />
              <select
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                className="flex-1 rounded-2xl border-2 border-[#F0E6E0] bg-white px-3 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#FF6B4A] focus:shadow-lg focus:shadow-[#FF6B4A]/10 transition-all"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6B4A]/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add to Pantry'}
            </button>
          </div>
        )}

        {/* Pantry Items */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#FF6B4A]/10 flex items-center justify-center mb-3">
              <ChefHat size={28} className="text-[#FF6B4A]" />
            </div>
            <p className="text-sm font-semibold text-[#2D2D2D] mb-1">Your pantry is empty</p>
            <p className="text-xs text-[#8C8C8C] text-center px-8 mb-4">
              Add ingredients you already have at home. We'll skip them in your grocery list.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#FF6B4A] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B4A]/20 active:scale-95 transition-all"
            >
              <Plus size={16} />
              Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-[#F0E6E0] bg-white p-3.5 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFFBF7] border border-[#F0E6E0] flex items-center justify-center text-base">
                    {CATEGORIES.find(c => c.value === item.category)?.emoji || '📦'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D2D2D]">{item.ingredient_name}</p>
                    <p className="text-xs text-[#8C8C8C]">
                      {item.quantity ? `${item.quantity} ${item.unit || ''} · ` : ''}
                      {item.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full p-2 text-[#C4C4C4] hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90"
                  aria-label="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
