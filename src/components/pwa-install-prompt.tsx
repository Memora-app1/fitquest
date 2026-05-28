'use client'

/**
 * PwaInstallPrompt — captura o evento beforeinstallprompt (Android Chrome)
 * e mostra um banner premium "Adicionar à tela inicial".
 * No iOS Safari, mostra instrução manual com ícone de compartilhamento.
 *
 * Dismiss por 30 dias via localStorage.
 */

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'

const DISMISS_KEY  = 'asc_pwa_dismissed'
const DISMISS_DAYS = 30

function wasDismissedRecently(): boolean {
  try {
    const stored = localStorage.getItem(DISMISS_KEY)
    if (!stored) return false
    const diff = Date.now() - Number(stored)
    return diff < DISMISS_DAYS * 86400000
  } catch { return false }
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* noop */ }
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (wasDismissedRecently() || isInStandaloneMode()) return

    const ios = isIOS()
    setIsIos(ios)

    if (ios) {
      // iOS: mostra instrução depois de 3s (sem evento nativo)
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }

    // Android/Chrome: captura evento
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handlePrompt(e: any) {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  function dismiss() {
    markDismissed()
    setShow(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
    >
      <div
        className="rounded-2xl p-4 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(13,24,41,0.98) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(255,77,0,0.3)',
          boxShadow: '0 -4px 40px rgba(255,77,0,0.12), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <X size={13} className="text-text-muted" />
        </button>

        <div className="flex items-center gap-3 mb-3 pr-8">
          {/* App icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
              boxShadow: '0 4px 16px rgba(255,77,0,0.3)',
            }}
          >
            ⚡
          </div>
          <div>
            <div className="font-bold text-sm">Adicionar Ascendia</div>
            <div className="text-xs text-text-secondary">
              {isIos
                ? 'Instale na tela inicial para acesso rápido'
                : 'Instale como app — mais rápido e offline'}
            </div>
          </div>
        </div>

        {isIos ? (
          <div
            className="rounded-xl p-3 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Share size={16} className="text-brand-orange shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Toque em <strong className="text-white">Compartilhar</strong> no Safari e depois em{' '}
              <strong className="text-white">Adicionar à Tela de Início</strong>
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
              boxShadow: '0 4px 20px rgba(255,77,0,0.25)',
            }}
          >
            <Download size={16} />
            Instalar app grátis
          </button>
        )}
      </div>
    </div>
  )
}
