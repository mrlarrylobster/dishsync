import { useState, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const threshold = 80

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    setPulling(true)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling) return
    const el = containerRef.current
    if (!el || el.scrollTop > 0) {
      setPulling(false)
      setPullDistance(0)
      return
    }
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      const damped = Math.min(delta * 0.5, 120)
      setPullDistance(damped)
    }
  }, [pulling])

  const onTouchEnd = useCallback(async () => {
    if (!pulling) return
    setPulling(false)
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pulling, pullDistance, refreshing, onRefresh])

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform z-10 pointer-events-none"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          opacity: Math.min(pullDistance / threshold, 1),
        }}
      >
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-[#F0E6E0]">
          {refreshing ? (
            <Loader2 size={16} className="animate-spin text-[#FF6B4A]" />
          ) : (
            <div
              className="transition-transform"
              style={{ transform: `rotate(${Math.min(pullDistance * 2, 180)}deg)` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2">
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
            </div>
          )}
          <span className="text-xs font-medium text-[#8C8C8C]">
            {refreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: pulling ? 'none' : 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  )
}
