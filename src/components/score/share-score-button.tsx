'use client'

/**
 * ShareScoreButton — botão que usa a Web Share API nativa no mobile.
 * No desktop copia o texto para a área de transferência.
 * Texto formatado para parecer bonito no WhatsApp/Instagram.
 */

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'

interface Props {
  level:        number
  levelTitle:   string
  xpTotal:      number
  streak:       number
  achievements: number
}

export function ShareScoreButton({ level, levelTitle, xpTotal, streak, achievements }: Props) {
  const [copied, setCopied] = useState(false)

  const LEVEL_EMOJIS: Record<number, string> = {
    1: '🌱', 2: '🥉', 3: '🥈', 4: '🥇', 5: '⚔️', 6: '🛡️', 7: '🏛️', 8: '👑',
  }
  const emoji = LEVEL_EMOJIS[level] ?? '⚡'

  const shareText = [
    `${emoji} Nível ${level} — ${levelTitle} no Ascendia`,
    ``,
    `⚡ ${xpTotal.toLocaleString('pt-BR')} XP acumulados`,
    streak > 0 ? `🔥 ${streak} dias de sequência` : null,
    achievements > 0 ? `🏆 ${achievements} conquista${achievements !== 1 ? 's' : ''} desbloqueada${achievements !== 1 ? 's' : ''}` : null,
    ``,
    `Gamifiquei minha academia, produtividade e finanças no mesmo app.`,
    `👉 ascendia.app`,
  ].filter(Boolean).join('\n')

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meu score no Ascendia — Nível ${level}`,
          text:  shareText,
        })
      } catch {
        // Usuário cancelou — silencioso
      }
      return
    }

    // Fallback: copiar para clipboard
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
      style={{
        background: 'rgba(124,58,237,0.12)',
        border:     '1px solid rgba(124,58,237,0.3)',
        color:      '#9F5AF7',
      }}
      title="Compartilhar seu progresso"
    >
      {copied
        ? <><Check size={13} style={{ color: '#00FF88' }} /><span style={{ color: '#00FF88' }}>Copiado!</span></>
        : <><Share2 size={13} />Compartilhar</>
      }
    </button>
  )
}
