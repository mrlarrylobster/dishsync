import { useState, useEffect, useCallback } from 'react'
import { Heart, ShoppingCart, Calendar, Settings } from 'lucide-react'
import AuthScreen from './components/AuthScreen'
import SwipeDeck from './components/SwipeDeck'
import PlanView from './components/PlanView'
import PantryView from './components/PantryView'
import GroceryView from './components/GroceryView'
import CoupleSetup from './components/CoupleSetup'
import SettingsView from './components/SettingsView'
import { SplashScreen } from './components/SplashScreen'
import { Toast } from './components/Toast'
import { haptic } from './lib/haptic'
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

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('dishsync_token'))
  const [view, setView] = useState<View>('swipe')
  const [badgeCounts, setBadgeCounts] = useState({ plan: 0, shop: 0 })
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false })
  const [showSplash, setShowSplash] = useState(!localStorage.getItem('dishpair_splash_seen'))
  const [isTransitioning, setIsTransitioning] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true })
  }, [])

  const dismissToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  // Splash screen completion
  function handleSplashComplete() {
    localStorage.setItem('dishpair_splash_seen', '1')
    setShowSplash(false)
  }

  // WebSocket
  useEffect(() => {
    if (!token) return
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${token}`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'match.revealed') {
          showToast(`🎉 Match with ${data.partner_name}!`, 'success')
          haptic('success')
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
  }, [token, showToast])

  useEffect(() => {
    if (token) {
      fetchBadgeCounts()
    }
  }, [token, view])

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

  const handleNav = (v: View) => {
    if (v === view) return
    haptic('light')
    setIsTransitioning(true)
    setTimeout(() => {
      setView(v)
      setIsTransitioning(false)
    }, 150)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (!token) {
    return <AuthScreen onLogin={(t) => { setToken(t); localStorage.setItem('dishsync_token', t); setView('swipe') }} />
  }

  return (
    <div className="min-h-[100dvh] bg-[#FFFBF7] text-[#2D2D2D] flex flex-col overflow-x-hidden">
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={dismissToast}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-[#F0E6E0] px-4 pt-[env(safe-area-inset-top)] pb-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B4A]/10 flex items-center justify-center">
            <Heart size={16} className="text-[#FF6B4A]" />
          </div>
          <h1 className="text-base font-bold">{VIEW_TITLES[view] || 'DishPair'}</h1>
        </div>
        {view !== 'settings' && (
          <button
            onClick={() => handleNav('settings')}
            className="p-2 rounded-full hover:bg-[#F0E6E0] text-[#8C8C8C] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF6B4A] active:scale-90"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        )}
      </header>

      {/* Main Content with transition */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{
          opacity: isTransitioning ? 0.6 : 1,
          transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
          transition: 'all 0.15s ease',
        }}
      >
        {view === 'setup' && <CoupleSetup onComplete={() => setView('swipe')} showToast={showToast} />}
        {view === 'swipe' && <SwipeDeck showToast={showToast} />}
        {view === 'plan' && <PlanView showToast={showToast} />}
        {view === 'pantry' && <PantryView showToast={showToast} />}
        {view === 'grocery' && <GroceryView showToast={showToast} />}
        {view === 'settings' && <SettingsView onSignOut={() => { localStorage.removeItem('dishsync_token'); setToken(null); setView('auth') }} showToast={showToast} />}
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 z-40 bg-white border-t border-[#F0E6E0] px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] flex justify-around select-none" role="tablist">
        <NavButton 
          icon={<Heart size={18} />} 
          label="Swipe" 
          active={view === 'swipe'} 
          onClick={() => handleNav('swipe')} 
        />
        <NavButton 
          icon={<Calendar size={18} />} 
          label="Plan" 
          active={view === 'plan'} 
          badge={badgeCounts.plan > 0 ? badgeCounts.plan : undefined}
          onClick={() => handleNav('plan')} 
        />
        <NavButton 
          icon={<ShoppingCart size={18} />} 
          label="Shop" 
          active={view === 'grocery'} 
          badge={badgeCounts.shop > 0 ? badgeCounts.shop : undefined}
          onClick={() => handleNav('grocery')} 
        />
        <NavButton 
          icon={<Settings size={18} />} 
          label="Settings" 
          active={view === 'settings'} 
          onClick={() => handleNav('settings')} 
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
      role="tab"
      aria-selected={active}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 min-w-[44px] min-h-[44px] ${
        active ? 'text-[#FF6B4A]' : 'text-[#8C8C8C] hover:text-[#666666]'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF6B4A] px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

export default App