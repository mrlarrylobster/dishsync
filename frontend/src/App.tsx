import { useState, useEffect } from 'react'
import { Heart, ShoppingCart, Calendar, Settings } from 'lucide-react'
import AuthScreen from './components/AuthScreen'
import SwipeDeck from './components/SwipeDeck'
import PlanView from './components/PlanView'
import PantryView from './components/PantryView'
import GroceryView from './components/GroceryView'
import CoupleSetup from './components/CoupleSetup'
import SettingsView from './components/SettingsView'
import './index.css'

export type View = 'auth' | 'setup' | 'swipe' | 'plan' | 'pantry' | 'grocery' | 'settings'

const VIEW_TITLES: Record<View, string> = {
  auth: 'Welcome',
  setup: 'Link with Partner',
  swipe: 'Discover',
  plan: 'Weekly Plan',
  pantry: 'Pantry',
  grocery: 'Grocery List',
  settings: 'Settings',
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('dishsync_token'))
  const [view, setView] = useState<View>('swipe')
  const [wsMessage, setWsMessage] = useState<any>(null)
  const [badgeCounts, setBadgeCounts] = useState({ plan: 0, shop: 0 })

  // WebSocket connection
  useEffect(() => {
    if (!token) return
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${token}`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'match.revealed') {
          setWsMessage(data)
          setTimeout(() => setWsMessage(null), 5000)
        }
      } catch (err) {
        console.error('WebSocket error:', err)
      }
    }
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping')
    }, 30000)
    return () => {
      clearInterval(pingInterval)
      ws.close()
    }
  }, [token])

  useEffect(() => {
    if (token) {
      checkCouple()
      fetchBadgeCounts()
    }
  }, [token, view])

  async function checkCouple() {
    try {
      const { getCouple } = await import('./lib/api')
      const couple = await getCouple()
      if (!couple) setView('setup')
    } catch (err) {
      console.error(err)
      setView('setup')
    }
  }

  async function fetchBadgeCounts() {
    try {
      const { getMatches, getGroceryList } = await import('./lib/api')
      const [matchesData, groceryData] = await Promise.all([
        getMatches().catch(() => ({ matches: [] })),
        getGroceryList().catch(() => ({ items: [] })),
      ])
      const pending = (matchesData.matches || []).filter((m: any) => m.status === 'pending').length
      const unchecked = (groceryData.items || []).filter((i: any) => !i.is_checked).length
      setBadgeCounts({ plan: pending, shop: unchecked })
    } catch (err) {
      console.error(err)
    }
  }

  if (!token) {
    return <AuthScreen onLogin={(t) => { setToken(t); localStorage.setItem('dishsync_token', t); setView('swipe') }} />
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#2D2D2D] flex flex-col">
      {/* Match notification */}
      {wsMessage && wsMessage.type === 'match.revealed' && (
        <div className="fixed top-16 left-4 right-4 z-50 rounded-2xl bg-[#FFD93D] px-4 py-3 shadow-lg text-center">
          <p className="text-sm font-bold text-[#2D2D2D]">🎉 Match with {wsMessage.partner_name}!</p>
          <p className="text-xs text-[#2D2D2D]/80">{wsMessage.recipe?.title}</p>
        </div>
      )}

      {/* Header with screen title */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#F0E6E0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-[#FF6B4A]" />
          <h1 className="text-base font-bold">{VIEW_TITLES[view] || 'DishPair'}</h1>
        </div>
        {view !== 'settings' && (
          <button
            onClick={() => setView('settings')}
            className="p-2 rounded-full hover:bg-[#F0E6E0] text-[#8C8C8C] transition-colors"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {view === 'setup' && <CoupleSetup onComplete={() => setView('swipe')} />}
        {view === 'swipe' && <SwipeDeck />}
        {view === 'plan' && <PlanView />}
        {view === 'pantry' && <PantryView />}
        {view === 'grocery' && <GroceryView />}
        {view === 'settings' && <SettingsView onSignOut={() => { localStorage.removeItem('dishsync_token'); setToken(null); setView('auth') }} />}
      </main>

      {/* Bottom Nav - 4 items */}
      <nav className="sticky bottom-0 z-40 bg-white border-t border-[#F0E6E0] px-2 py-2 flex justify-around">
        <NavButton 
          icon={<Heart size={18} />} 
          label="Swipe" 
          active={view === 'swipe'} 
          onClick={() => setView('swipe')} 
        />
        <NavButton 
          icon={<Calendar size={18} />} 
          label="Plan" 
          active={view === 'plan'} 
          badge={badgeCounts.plan > 0 ? badgeCounts.plan : undefined}
          onClick={() => setView('plan')} 
        />
        <NavButton 
          icon={<ShoppingCart size={18} />} 
          label="Shop" 
          active={view === 'grocery'} 
          badge={badgeCounts.shop > 0 ? badgeCounts.shop : undefined}
          onClick={() => setView('grocery')} 
        />
        <NavButton 
          icon={<Settings size={18} />} 
          label="Settings" 
          active={view === 'settings'} 
          onClick={() => setView('settings')} 
        />
      </nav>
    </div>
  )
}

function NavButton({ 
  icon, 
  label, 
  active, 
  badge, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  badge?: number;
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition ${
        active ? 'text-[#FF6B4A]' : 'text-[#8C8C8C]'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF6B4A] px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

export default App
