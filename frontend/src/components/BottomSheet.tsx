import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
      document.body.style.overflow = 'hidden'
    } else {
      setAnimating(false)
      const timer = setTimeout(() => {
        setVisible(false)
        document.body.style.overflow = ''
      }, 300)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!visible) return null

  return (
    <div 
      className="fixed z-[60] flex items-end justify-center"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh',
        width: '100%',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm touch-none"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: animating ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{
          transform: animating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          maxHeight: '75dvh',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#E8E8E8]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
            <h2 className="text-lg font-bold text-[#1A1A1A]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F0E6E0] text-[#8C8C8C] transition-colors active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          className="px-5 pb-8 overflow-y-auto"
          style={{ 
            maxHeight: 'calc(75dvh - 60px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
