import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
  onDismiss: () => void
}

export function Toast({ message, type = 'info', visible, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [visible, onDismiss])

  if (!visible) return null

  const styles = {
    success: 'bg-[#6BCB77] text-white',
    error: 'bg-[#EF4444] text-white',
    info: 'bg-[#2D2D2D] text-white',
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-[60] animate-[toast-enter_0.3s_ease-out]">
      <div className={`rounded-2xl px-4 py-3 shadow-lg text-center text-sm font-semibold ${styles[type]}`}>
        {message}
      </div>
    </div>
  )
}
