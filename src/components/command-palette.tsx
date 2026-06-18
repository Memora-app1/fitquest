'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/use-scroll-lock';
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  CheckSquare,
  Dumbbell,
  Target,
  Wallet,
  LayoutDashboard,
  BarChart3,
  Bot,
  Calendar,
  Flag,
  User,
  Zap,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/app/api/search/route';

// ── Quick navigation items (always available) ──────────────────────────────────

interface QuickNav {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  rgb: string;
  shortcut?: string;
}

const QUICK_NAV: QuickNav[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: '#7C3AED',
    rgb: '124,58,237',
  },
  { label: 'Hábitos', href: '/habitos', icon: Target, color: '#FF4D00', rgb: '255,77,0' },
  { label: 'Tarefas', href: '/tarefas', icon: CheckSquare, color: '#7C3AED', rgb: '124,58,237' },
  { label: 'Treinos', href: '/treinos', icon: Dumbbell, color: '#00FF88', rgb: '0,255,136' },
  { label: 'Finanças', href: '/financas', icon: Wallet, color: '#3B82F6', rgb: '59,130,246' },
  { label: 'Coach IA', href: '/coach', icon: Bot, color: '#F5C842', rgb: '245,200,66' },
  { label: 'Calendário', href: '/calendario', icon: Calendar, color: '#3B82F6', rgb: '59,130,246' },
  { label: 'Score & XP', href: '/score', icon: BarChart3, color: '#F5C842', rgb: '245,200,66' },
  { label: 'Metas', href: '/metas', icon: Flag, color: '#00FF88', rgb: '0,255,136' },
  { label: 'Meu Perfil', href: '/perfil', icon: User, color: '#8899BB', rgb: '136,153,187' },
];

// ── Types ──────────────────────────────────────────────────────────────────────

type Item = { kind: 'nav'; data: QuickNav } | { kind: 'result'; data: SearchResult };

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Highlight matching text ────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-gold/25 px-0.5 text-brand-gold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Palette Content ────────────────────────────────────────────────────────────

function PaletteContent({ query, onClose }: { query: string; onClose: () => void }) {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { results: SearchResult[] }) => {
        setResults(data.results ?? []);
        setSelectedIdx(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debouncedQuery]);

  // Build flat list of items to navigate
  const filteredNav = QUICK_NAV.filter(
    (n) => !query || n.label.toLowerCase().includes(query.toLowerCase())
  );

  const items: Item[] = [
    ...(results.length > 0 ? results.map((r): Item => ({ kind: 'result', data: r })) : []),
    ...(filteredNav.length > 0 ? filteredNav.map((n): Item => ({ kind: 'nav', data: n })) : []),
  ];

  const totalItems = items.length;

  // Reset selection when list changes
  useEffect(() => setSelectedIdx(0), [query, results.length]);

  // Scroll selected item into view
  useEffect(() => {
    const selected = listRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const navigate = useCallback(
    (item: Item) => {
      if (item.kind === 'nav') {
        router.push(item.data.href);
      } else {
        router.push(item.data.href);
      }
      onClose();
    },
    [router, onClose]
  );

  // Keyboard navigation within the content
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % Math.max(totalItems, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
      } else if (e.key === 'Enter') {
        const item = items[selectedIdx];
        if (item) navigate(item);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, selectedIdx, navigate, totalItems]);

  // Empty state
  if (!query && results.length === 0) {
    return (
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
        <div className="px-3 py-2">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Navegação rápida
          </div>
          <div className="space-y-0.5">
            {QUICK_NAV.map((nav, i) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.href}
                  data-selected={i === selectedIdx}
                  onClick={() => navigate({ kind: 'nav', data: nav })}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                    i === selectedIdx ? 'bg-white/8' : 'hover:bg-white/5'
                  )}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `rgba(${nav.rgb},0.15)`,
                      border: `1px solid rgba(${nav.rgb},0.25)`,
                    }}
                  >
                    <Icon size={14} style={{ color: nav.color }} />
                  </div>
                  <span className="text-sm font-medium">{nav.label}</span>
                  <ArrowRight
                    size={12}
                    className="ml-auto text-text-muted opacity-0 group-hover:opacity-100"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-3 text-4xl">🔍</div>
        <p className="text-sm text-text-muted">
          Nenhum resultado para "<span className="text-white">{query}</span>"
        </p>
        <p className="mt-1 text-xs text-text-muted">Tente palavras-chave diferentes</p>
      </div>
    );
  }

  // Render results + nav
  const resultItems = items.filter(
    (i): i is { kind: 'result'; data: SearchResult } => i.kind === 'result'
  );
  const navItems = items.filter((i): i is { kind: 'nav'; data: QuickNav } => i.kind === 'nav');

  return (
    <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
      {/* Search results */}
      {resultItems.length > 0 && (
        <div className="px-3 py-2">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Resultados
          </div>
          <div className="space-y-0.5">
            {resultItems.map(({ data: result }, i) => {
              const globalIdx = i;
              return (
                <button
                  key={result.id}
                  data-selected={globalIdx === selectedIdx}
                  onClick={() => navigate({ kind: 'result', data: result })}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                    globalIdx === selectedIdx ? 'bg-white/8' : 'hover:bg-white/5'
                  )}
                >
                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{
                      background: `rgba(${colorRgb(result.color)},0.12)`,
                      border: `1px solid rgba(${colorRgb(result.color)},0.22)`,
                    }}
                  >
                    {result.icon}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      <Highlight text={result.title} query={query} />
                    </div>
                    {result.subtitle && (
                      <div className="mt-0.5 truncate text-xs text-text-muted">
                        {result.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  {result.meta && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: `rgba(${colorRgb(result.color)},0.1)`,
                        color: result.color,
                        border: `1px solid rgba(${colorRgb(result.color)},0.2)`,
                      }}
                    >
                      {result.meta}
                    </span>
                  )}

                  <ArrowRight
                    size={12}
                    className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav results (filtered by query) */}
      {navItems.length > 0 && (
        <div className="px-3 py-2">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Páginas
          </div>
          <div className="space-y-0.5">
            {navItems.map(({ data: nav }, i) => {
              const globalIdx = resultItems.length + i;
              const Icon = nav.icon;
              return (
                <button
                  key={nav.href}
                  data-selected={globalIdx === selectedIdx}
                  onClick={() => navigate({ kind: 'nav', data: nav })}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                    globalIdx === selectedIdx ? 'bg-white/8' : 'hover:bg-white/5'
                  )}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `rgba(${nav.rgb},0.15)`,
                      border: `1px solid rgba(${nav.rgb},0.25)`,
                    }}
                  >
                    <Icon size={14} style={{ color: nav.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      <Highlight text={nav.label} query={query} />
                    </div>
                    <div className="text-xs text-text-muted">{nav.href}</div>
                  </div>
                  <ArrowRight size={12} className="ml-auto text-text-muted" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Color helper ───────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  '#FF4D00': '255,77,0',
  '#7C3AED': '124,58,237',
  '#00FF88': '0,255,136',
  '#F5C842': '245,200,66',
  '#3B82F6': '59,130,246',
  '#EC4899': '236,72,153',
  '#EF4444': '239,68,68',
  '#8899BB': '136,153,187',
};

function colorRgb(hex: string): string {
  return COLOR_MAP[hex] ?? '136,153,187';
}

// ── Main CommandPalette ────────────────────────────────────────────────────────

interface CommandPaletteProps {
  /** 'bar': full search bar (sidebar), 'icon': icon-only button (mobile header) */
  variant?: 'bar' | 'icon';
}

export function CommandPalette({ variant = 'bar' }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useScrollLock(open);

  // Open on Cmd+K / Ctrl+K — register only once per variant='bar' to avoid double-firing
  useEffect(() => {
    if (variant !== 'bar') return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
    }
  }, [open]);

  if (!open) {
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-all hover:bg-white/10 hover:text-white"
          title="Buscar (Cmd+K)"
        >
          <Search size={16} />
        </button>
      );
    }
    return (
      <button
        onClick={() => setOpen(true)}
        className="hover:bg-white/8 flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-text-muted transition-all hover:text-white"
        title="Busca global (Cmd+K)"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar...</span>
        <div className="flex items-center gap-0.5 text-[10px] text-text-muted">
          <Command size={9} />
          <span>K</span>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10vh] z-50 animate-slide-up md:inset-x-auto md:left-1/2 md:w-[560px] md:-translate-x-1/2">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(13,24,41,0.98)',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(124,58,237,0.08)',
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <Search size={18} className="shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar hábitos, tarefas, treinos, transações..."
              className="flex-1 bg-transparent text-sm text-white placeholder-text-muted outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted transition-all hover:bg-white/10 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
            <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <PaletteContent query={query} onClose={() => setOpen(false)} />

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[10px] text-text-muted">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border px-1 py-0.5 font-mono">↑↓</kbd> navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border px-1 py-0.5 font-mono">↵</kbd> abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border px-1 py-0.5 font-mono">ESC</kbd> fechar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={9} className="text-brand-gold" />
              <span>Ascendia</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
