import { useState, useEffect } from 'react'
import { Heart, ChefHat, Sparkles } from 'lucide-react'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 600)
    const t3 = setTimeout(() => setPhase(3), 1200)
    const t4 = setTimeout(() => onComplete(), 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] bg-[#FFFBF7] flex flex-col items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#FF6B4A]/5 blur-3xl"
          style={{ transform: `scale(${phase >= 1 ? 1 : 0.5})`, transition: 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#4ECDC4]/5 blur-3xl"
          style={{ transform: `scale(${phase >= 1 ? 1 : 0.5})`, transition: 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s' }}
        />
      </div>

      {/* Logo */}
      <div 
        className="relative flex flex-col items-center"
        style={{
          transform: `translateY(${phase >= 2 ? 0 : 20}px) scale(${phase >= 1 ? 1 : 0.8})`,
          opacity: phase >= 1 ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <div className="relative mb-4">
          <div 
            className="absolute inset-0 bg-[#FF6B4A] rounded-3xl blur-xl opacity-30"
            style={{ 
              transform: `scale(${phase >= 2 ? 1.2 : 0.8})`,
              transition: 'transform 0.8s ease'
            }}
          />
          <div className="relative w-20 h-20 bg-[#FF6B4A] rounded-3xl flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
            <ChefHat size={36} className="text-white" />
          </div>
        </div>

        <h1 
          className="text-3xl font-bold text-[#1A1A1A] tracking-tight"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: `translateY(${phase >= 2 ? 0 : 10}px)`,
            transition: 'all 0.5s ease 0.1s'
          }}
        >
          DishPair
        </h1>

        <p 
          className="mt-2 text-sm text-[#8C8C8C] font-medium"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 0.5s ease'
          }}
        >
          Decide together. Cook together.
        </p>

        {/* Floating particles */}
        <div className="absolute -top-8 -right-8" style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s' }}>
          <Sparkles size={16} className="text-[#FFB347] animate-bounce" style={{ animationDelay: '0s' }} />
        </div>
        <div className="absolute -bottom-4 -left-6" style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s 0.2s' }}>
          <Heart size={14} className="text-[#FF6B4A] animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Loading bar */}
      <div 
        className="absolute bottom-12 left-8 right-8 h-1 bg-[#F0E6E0] rounded-full overflow-hidden"
        style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <div 
          className="h-full bg-[#FF6B4A] rounded-full"
          style={{
            width: phase >= 3 ? '100%' : phase >= 2 ? '60%' : '20%',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  )
}
