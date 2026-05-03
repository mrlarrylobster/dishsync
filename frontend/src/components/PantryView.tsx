import { useState, useEffect } from 'react'
import { Plus, Loader2, Trash2, ChefHat } from 'lucide-react'
import { getPantry, addPantryItem } from '../lib/api'

export default function PantryView() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ ingredient_name: '', category: 'produce', quantity: '', unit: '' })

  useEffect(() => {
    loadPantry()
  }, [])

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
    try {
      await addPantryItem({
        ingredient_name: newItem.ingredient_name,
        category: newItem.category,
        quantity: parseFloat(newItem.quantity) || undefined,
        unit: newItem.unit || undefined,
      })
      setShowAdd(false)
      setNewItem({ ingredient_name: '', category: 'produce', quantity: '', unit: '' })
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
          onClick={() => setShowAdd(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B4A] text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Add Item Form */}
      {showAdd && (
        <div className="mb-4 rounded-2xl border border-[#F0E6E0] bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Ingredient name"
            value={newItem.ingredient_name}
            onChange={e => setNewItem({ ...newItem, ingredient_name: e.target.value })}
            className="mb-2 w-full rounded-xl border border-[#F0E6E0] px-3 py-2 text-sm"
          />
          <div className="mb-2 flex gap-2">
            <input
              type="number"
              placeholder="Qty"
              value={newItem.quantity}
              onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-20 rounded-xl border border-[#F0E6E0] px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Unit"
              value={newItem.unit}
              onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-24 rounded-xl border border-[#F0E6E0] px-3 py-2 text-sm"
            />
            <select
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="flex-1 rounded-xl border border-[#F0E6E0] px-3 py-2 text-sm"
            >
              <option value="produce">Produce</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat</option>
              <option value="dry_goods">Dry Goods</option>
              <option value="spices">Spices</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 rounded-xl bg-[#FF6B4A] py-2 text-sm font-semibold text-white"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 rounded-xl border border-[#F0E6E0] py-2 text-sm text-[#8C8C8C]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pantry Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <ChefHat size={40} className="mb-3 text-[#8C8C8C]" />
          <p className="text-sm text-[#8C8C8C]">Your pantry is empty</p>
          <p className="text-xs text-[#8C8C8C]">Add ingredients to get recipe recommendations</p>
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
                  {item.quantity} {item.unit} · {item.category}
                  {item.confidence < 0.7 && (
                    <span className="ml-1 text-[#FFB347]">· Low confidence</span>
                  )}
                </p>
              </div>
              <button className="rounded-full p-1.5 text-[#8C8C8C] hover:bg-red-50 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
