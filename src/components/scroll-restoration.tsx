'use client';

/**
 * ScrollRestoration — preserva posição de scroll por rota.
 * Salva no sessionStorage ao sair, restaura ao voltar.
 * Colocado uma vez no app-shell, funciona em todas as páginas.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const KEY_PREFIX = 'asc_scroll_';

export function ScrollRestoration() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const isRestoring = useRef(false);

  // Salva scroll ao mudar de rota
  useEffect(() => {
    const prev = prevPath.current;
    if (prev !== pathname) {
      // Salva a posição da rota anterior
      try {
        sessionStorage.setItem(KEY_PREFIX + prev, String(window.scrollY));
      } catch {
        /* noop */
      }
      prevPath.current = pathname;
    }
  }, [pathname]);

  // Restaura scroll ao entrar numa rota
  useEffect(() => {
    if (isRestoring.current) return;
    isRestoring.current = true;

    try {
      const saved = sessionStorage.getItem(KEY_PREFIX + pathname);
      if (saved && Number(saved) > 0) {
        // Pequeno delay para o conteúdo renderizar
        const t = setTimeout(() => {
          window.scrollTo({ top: Number(saved), behavior: 'instant' });
          isRestoring.current = false;
        }, 80);
        return () => clearTimeout(t);
      }
    } catch {
      /* noop */
    }

    isRestoring.current = false;
  }, [pathname]);

  // Limpa scroll salvo ao fechar aba
  useEffect(() => {
    function handleUnload() {
      try {
        // Remove posições antigas para não acumular
        const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(KEY_PREFIX));
        if (keys.length > 20) {
          keys.slice(0, keys.length - 20).forEach((k) => sessionStorage.removeItem(k));
        }
      } catch {
        /* noop */
      }
    }
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, []);

  return null;
}
