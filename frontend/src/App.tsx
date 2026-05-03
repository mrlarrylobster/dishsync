import { useState, useEffect } from 'react'
import { Heart, ChefHat, ShoppingCart, Calendar } from 'lucide-react'
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
  const [view, setView] = useState<View>('swipe')
  const [wsMessage, setWsMessage] = useState<any>(null)

  // WebSocket connection for real-time match reveals
  useEffect(() => {
    if (!token) return
    
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${token}`
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'match.revealed') {
          setWsMessage(data)
          // Auto-dismiss after 5 seconds
          setTimeout(() => setWsMessage(null), 5000)
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    }
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }
    
    // Keepalive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)
    
    return () => {
      clearInterval(pingInterval)
      ws.close()
    }
  }, [token])

  useEffect(() => {
    if (token) {
      checkCouple()
    }
  }, [token])

  async function checkCouple() {
    try {
      const { getCouple } = await import('./lib/api')
      const couple = await getCouple()
      if (!couple) {
        setView('setup')
      }
    } catch (err) {
      console.error(err)
      setView('setup')
    }
  }

  if (!token) {
    return <AuthScreen onLogin={(t) => { setToken(t); localStorage.setItem('dishsync_token', t); setView('swipe') }} />
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#2D2D2D] flex flex-col">
      {/* Match Reveal Notification */}
      {wsMessage && wsMessage.type === 'match.revealed' && (
        <div className="fixed top-16 left-4 right-4 z-50 rounded-2xl bg-[#FFD93D] px-4 py-3 shadow-lg shadow-[#FFD93D]/30 text-center"
        >
          <p className="text-sm font-bold text-[#2D2D2D]"
          >
            🎉 Match with {wsMessage.partner_name}!
          </p>
          <p className="text-xs text-[#2D2D2D]/80"
          >
            {wsMessage.recipe?.title}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#F0E6E0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={24} className="text-[#FF6B4A]" />
          <h1 className="text-lg font-bold">DishPair</h1>
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
        {view === 'setup' && <CoupleSetup onComplete={() => { setView('swipe') }} />}
        {view === 'swipe' && <SwipeDeck />}
        {view === 'calendar' && <CalendarView />}
        {view === 'pantry' && <PantryView />}
        {view === 'grocery' && <GroceryView />}
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
