import { useState } from 'react'
import { Heart, X, Clock, ChefHat, ShoppingCart, Calendar, Settings, User } from 'lucide-react'
import AuthScreen from './components/AuthScreen'
import SwipeDeck from './components/SwipeDeck'
import CalendarView from './components/CalendarView'
import PantryView from './components/PantryView'
import GroceryView from './components/GroceryView'
import CoupleSetup from './components/CoupleSetup'
import './index.css'

export type View = 'auth' | 'setup' | 'swipe' | 'calendar' | 'pantry' | 'grocery'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('dishsync_token'))
  const [view, setView] = useState<View>(token ? 'swipe' : 'auth')

  if (!token) {
    return <AuthScreen onLogin={(t) => { setToken(t); localStorage.setItem('dishsync_token', t); setView('swipe') }} />
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#2D2D2D] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#F0E6E0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat size={24} className="text-[#FF6B4A]" />
          <h1 className="text-lg font-bold">DishSync</h1>
        </div>
        <button
          onClick={() => { localStorage.removeItem('dishsync_token'); setToken(null); setView('auth') }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {view === 'setup' && <CoupleSetup token={token} onComplete={() => setView('swipe')} />}
        {view === 'swipe' && <SwipeDeck token={token} />}
        {view === 'calendar' && <CalendarView token={token} />}
        {view === 'pantry' && <PantryView token={token} />}
        {view === 'grocery' && <GroceryView token={token} />}
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 z-40 bg-white border-t border-[#F0E6E0] px-4 py-2 flex justify-around">
        <NavButton icon={<Heart size={20} />} label="Swipe" active={view === 'swipe'} onClick={() => setView('swipe')} />
        <NavButton icon={<Calendar size={20} />} label="Plan" active={view === 'calendar'} onClick={() => setView('calendar')} />
        <NavButton icon={<ShoppingCart size={20} />} label="Shop" active={view === 'grocery'} onClick={() => setView('grocery')} />
        <NavButton icon={<ChefHat size={20} />} label="Pantry" active={view === 'pantry'} onClick={() => setView('pantry')} />
      </nav>
    </div>
  )
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${
        active ? 'text-[#FF6B4A]' : 'text-[#8C8C8C]'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

export default App
