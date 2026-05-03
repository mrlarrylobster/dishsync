import { useState, useEffect } from 'react'
import { Plus, Loader2, Trash2, ChefHat, AlertCircle } from 'lucide-react'
import { getPantry, addPantryItem, deletePantryItem } from '../lib/api'

const CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'meat', label: 'Meat' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'other', label: 'Other' },
]

export default function PantryView() {
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
      setShowAdd(false)
      setNewItem({ ingredient_name: '', category: 'produce', quantity: '', unit: '' })
      loadPantry()
    } catch (err) {
      setFormError('Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deletePantryItem(itemId)
      loadPantry()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#2D2D2D]">Your Pantry</h2>
        <button
          onClick={() => { setShowAdd(!showAdd); setFormError('') }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B4A] text-white active:scale-95"
          aria-label={showAdd ? 'Cancel' : 'Add item'}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Add Item Form */}
      {showAdd && (
        <div className="mb-4 rounded-2xl border border-[#F0E6E0] bg-white p-4 shadow-sm">
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
            className="mb-2 w-full rounded-xl border border-[#F0E6E0] px-3 py-2.5 text-sm focus:border-[#FF6B4A] focus:outline-none"
          />
          <div className="mb-2 flex gap-2">
            <input
              type="number"
              placeholder="Qty"
              value={newItem.quantity}
              onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-20 rounded-xl border border-[#F0E6E0] px-3 py-2.5 text-sm focus:border-[#FF6B4A] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Unit (e.g., ml, g)"
              value={newItem.unit}
              onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-24 rounded-xl border border-[#F0E6E0] px-3 py-2.5 text-sm focus:border-[#FF6B4A] focus:outline-none"
            />
            <select
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="flex-1 rounded-xl border border-[#F0E6E0] px-3 py-2.5 text-sm focus:border-[#FF6B4A] focus:outline-none bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 rounded-xl bg-[#FF6B4A] py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
            >
              {adding ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Add to Pantry'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setFormError('') }}
              className="flex-1 rounded-xl border border-[#F0E6E0] py-2.5 text-sm font-medium text-[#8C8C8C] active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pantry Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#F0E6E0] flex items-center justify-center mb-4">
            <ChefHat size={32} className="text-[#8C8C8C]" />
          </div>
          <p className="text-sm font-semibold text-[#2D2D2D] mb-1">Your pantry is empty</p>
          <p className="text-xs text-[#8C8C8C] text-center px-8">Add ingredients you already have at home. We'll skip them in your grocery list.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 rounded-xl bg-[#FF6B4A] px-6 py-2.5 text-sm font-semibold text-white active:scale-95"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-[#F0E6E0] bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-[#2D2D2D]">{item.ingredient_name}</p>
                <p className="text-xs text-[#8C8C8C]">
                  {item.quantity ? `${item.quantity} ${item.unit || ''} · ` : ''}
                  {item.category}
                  {item.confidence < 0.7 && (
                    <span className="ml-1 text-[#FFB347]">· Low confidence</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="rounded-full p-2.5 text-[#8C8C8C] hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Delete item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
