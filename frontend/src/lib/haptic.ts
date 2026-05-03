// Safe haptic feedback utility
export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (!navigator.vibrate) return
  const patterns: Record<string, number[]> = {
    light: [15],
    medium: [30],
    heavy: [50],
    success: [20, 50, 20],
    error: [50, 30, 50],
  }
  try {
    navigator.vibrate(patterns[type] || patterns.light)
  } catch {
    // Ignore unsupported
  }
}
