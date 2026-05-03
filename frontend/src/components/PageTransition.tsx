import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  view: string
}

export function PageTransition({ children, view }: PageTransitionProps) {
  const [displayView, setDisplayView] = useState(view)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const viewOrder = ['swipe', 'plan', 'grocery', 'settings']

  useEffect(() => {
    if (view !== displayView) {
      const currentIdx = viewOrder.indexOf(displayView)
      const nextIdx = viewOrder.indexOf(view)
      setDirection(nextIdx > currentIdx ? 'right' : 'left')
      setAnimating(true)
      const timer = setTimeout(() => {
        setDisplayView(view)
        setAnimating(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [view, displayView])

  return (
    <div className="relative overflow-hidden flex-1">
      <div
        className="h-full"
        style={{
          transform: animating
            ? `translateX(${direction === 'right' ? '-20%' : '20%'})`
            : 'translateX(0)',
          opacity: animating ? 0.5 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
