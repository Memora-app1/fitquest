'use client';

/**
 * useRealtimeProfile — assina mudanças na tabela profiles via Supabase Realtime.
 * Atualiza XP, level e streak ao vivo sem router.refresh().
 * Dispara animação de +XP quando xp_total aumenta.
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileSnapshot {
  xp_total: number;
  level: number;
  streak_current: number;
}

interface XpBump {
  amount: number;
  timestamp: number;
}

export function useRealtimeProfile(userId: string, initial: ProfileSnapshot) {
  const [profile, setProfile] = useState<ProfileSnapshot>(initial);
  const [xpBump, setXpBump] = useState<XpBump | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);
  const prevXp = useRef(initial.xp_total);
  const prevLevel = useRef(initial.level);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as ProfileSnapshot;
          const gained = next.xp_total - prevXp.current;

          if (gained > 0) {
            setXpBump({ amount: gained, timestamp: Date.now() });
            // Limpa o bump após a animação
            setTimeout(() => setXpBump(null), 2200);
          }

          if (next.level > prevLevel.current) {
            setLeveledUp(true);
            setTimeout(() => setLeveledUp(false), 100);
          }

          prevXp.current = next.xp_total;
          prevLevel.current = next.level;
          setProfile({
            xp_total: next.xp_total,
            level: next.level,
            streak_current: next.streak_current,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { profile, xpBump, leveledUp };
}
