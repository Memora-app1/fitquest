'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { useRealtimeProfile } from './use-realtime-profile'

interface ProfileSnapshot {
  xp_total: number
  level: number
  streak_current: number
}

interface XpBump {
  amount: number
  timestamp: number
}

interface RealtimeCtxValue {
  profile: ProfileSnapshot
  xpBump: XpBump | null
}

const RealtimeCtx = createContext<RealtimeCtxValue | null>(null)

/**
 * Roda UMA assinatura Realtime para toda a AppShell.
 * Sidebar e MobileHeader consomem via useRealtimeCtx() — sem double-fire de ascendia:levelup.
 */
export function AppShellRealtimeProvider({
  id,
  initial,
  children,
}: {
  id: string
  initial: ProfileSnapshot
  children: React.ReactNode
}) {
  const { profile, xpBump, leveledUp } = useRealtimeProfile(id, initial)
  const lastFiredLevel = useRef(0)
  const lastFiredTime  = useRef(0)

  // Dispara evento de level-up com dedup — mesmo nível nos últimos 3s é ignorado
  useEffect(() => {
    if (!leveledUp) return
    const now = Date.now()
    if (profile.level === lastFiredLevel.current && now - lastFiredTime.current < 3000) return
    lastFiredLevel.current = profile.level
    lastFiredTime.current  = now
    window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: profile.level } }))
  }, [leveledUp, profile.level])

  return (
    <RealtimeCtx.Provider value={{ profile, xpBump }}>
      {children}
    </RealtimeCtx.Provider>
  )
}

export function useRealtimeCtx(): RealtimeCtxValue {
  const ctx = useContext(RealtimeCtx)
  if (!ctx) throw new Error('useRealtimeCtx deve ser usado dentro de AppShellRealtimeProvider')
  return ctx
}
