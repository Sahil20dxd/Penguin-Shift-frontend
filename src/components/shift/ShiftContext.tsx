// src/components/shift/ShiftContext.tsx
// --------------------------------------------------------------------
// Holds selection state and the latest transferId across Shift pages.
// Persists sourcePlatform + selections to localStorage so both
// Spotify → YouTube and YouTube → Spotify flows work seamlessly.
// --------------------------------------------------------------------
import React, { createContext, useContext, useEffect, useState } from 'react'

type ShiftState = {
  sourcePlatform: 'spotify' | 'youtube' | null
  selectedPlaylistIds: string[]
  includeTracks: Record<string, 'ALL' | string[]>
  transferId: number | null
}

type ShiftContextValue = ShiftState & {
  updateState: (updates: Partial<ShiftState>) => void
  resetState: () => void
}

const ShiftContext = createContext<ShiftContextValue | null>(null)

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShiftState>(() => {
    // ✅ Load from localStorage if available
    try {
      const saved = localStorage.getItem('penguinShiftState')
      return saved
        ? JSON.parse(saved)
        : {
            sourcePlatform: null,
            selectedPlaylistIds: [],
            includeTracks: {},
            transferId: null
          }
    } catch {
      return {
        sourcePlatform: null,
        selectedPlaylistIds: [],
        includeTracks: {},
        transferId: null
      }
    }
  })

  // ✅ Automatically persist changes
  useEffect(() => {
    localStorage.setItem('penguinShiftState', JSON.stringify(state))
  }, [state])

  const updateState = (updates: Partial<ShiftState>) =>
    setState((prev) => ({ ...prev, ...updates }))

  const resetState = () => {
    const reset = {
      sourcePlatform: null,
      selectedPlaylistIds: [],
      includeTracks: {},
      transferId: null
    }
    setState(reset)
    localStorage.removeItem('penguinShiftState')
  }

  return (
    <ShiftContext.Provider value={{ ...state, updateState, resetState }}>
      {children}
    </ShiftContext.Provider>
  )
}

export function useShift() {
  const ctx = useContext(ShiftContext)
  if (!ctx) throw new Error('useShift must be used within ShiftProvider')
  return ctx
}
