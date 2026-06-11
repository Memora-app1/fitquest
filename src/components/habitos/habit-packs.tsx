'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Sparkles, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useScrollLock } from '@/hooks/use-scroll-lock'

interface HabitTemplate {
  name: string
  icon: string
  color: string
  category: string
  frequency_per_week: number
  xp_per_completion: number
}

interface Pack {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  rgb: string
  habits: HabitTemplate[]
}

const PACKS: Pack[] = [
  {
    id: 'morning',
    name: 'Rotina Matinal',
    description: '5 hábitos para começar o dia com energia e clareza mental.',
    emoji: '🌅',
    color: '#F5C842',
    rgb: '245,200,66',
    habits: [
      { name: 'Beber água ao acordar', icon: '💧', color: '#00D9FF', category: 'nutrition',     frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Meditação 10min',       icon: '🧘', color: '#7C3AED', category: 'mindfulness',  frequency_per_week: 5, xp_per_completion: 50 },
      { name: 'Exercícios matinais',   icon: '💪', color: '#FF4D00', category: 'strength',      frequency_per_week: 4, xp_per_completion: 50 },
      { name: 'Planejar o dia',        icon: '📋', color: '#00FF88', category: 'custom',        frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Ler 20 minutos',        icon: '📖', color: '#3B82F6', category: 'custom',        frequency_per_week: 5, xp_per_completion: 50 },
    ],
  },
  {
    id: 'athlete',
    name: 'Atleta',
    description: '4 hábitos para maximizar resultados físicos e recuperação.',
    emoji: '💪',
    color: '#FF4D00',
    rgb: '255,77,0',
    habits: [
      { name: 'Treinar',              icon: '🏋️', color: '#FF4D00', category: 'strength',   frequency_per_week: 5, xp_per_completion: 50 },
      { name: 'Proteína nas refeições',icon: '🍗', color: '#F59E0B', category: 'nutrition',  frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Dormir 8h',            icon: '😴', color: '#7C3AED', category: 'sleep',       frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Beber 3L de água',     icon: '💧', color: '#00D9FF', category: 'nutrition',   frequency_per_week: 7, xp_per_completion: 50 },
    ],
  },
  {
    id: 'productive',
    name: 'Produtivo',
    description: 'Hábitos para foco total, menos distrações e mais resultado.',
    emoji: '⚡',
    color: '#7C3AED',
    rgb: '124,58,237',
    habits: [
      { name: 'Deep work 2h',         icon: '⚡', color: '#FF4D00', category: 'custom',       frequency_per_week: 5, xp_per_completion: 50 },
      { name: 'Sem redes sociais manhã',icon: '📵', color: '#EF4444', category: 'custom',     frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Revisar tarefas',       icon: '✅', color: '#7C3AED', category: 'custom',       frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Revisão semanal',       icon: '📊', color: '#00FF88', category: 'custom',       frequency_per_week: 1, xp_per_completion: 50 },
    ],
  },
  {
    id: 'finance',
    name: 'Controle Financeiro',
    description: 'Hábitos para organizar as finanças e construir riqueza.',
    emoji: '💰',
    color: '#00FF88',
    rgb: '0,255,136',
    habits: [
      { name: 'Registrar gastos',      icon: '💰', color: '#00FF88', category: 'custom',       frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Revisar extrato',       icon: '📊', color: '#F5C842', category: 'custom',       frequency_per_week: 1, xp_per_completion: 50 },
      { name: 'Poupar R$X hoje',       icon: '🐷', color: '#00D9FF', category: 'custom',       frequency_per_week: 7, xp_per_completion: 50 },
    ],
  },
  {
    id: 'wellness',
    name: 'Bem-estar',
    description: 'Cuide da saúde física e mental com estes hábitos essenciais.',
    emoji: '❤️',
    color: '#00D9FF',
    rgb: '0,217,255',
    habits: [
      { name: 'Caminhar 30min',        icon: '🚶', color: '#00FF88', category: 'cardio',       frequency_per_week: 5, xp_per_completion: 50 },
      { name: 'Sem tela 1h antes dormir',icon: '🌙', color: '#7C3AED', category: 'sleep',      frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Gratidão 3 coisas',     icon: '🙏', color: '#F5C842', category: 'mindfulness', frequency_per_week: 7, xp_per_completion: 50 },
      { name: 'Alongamento 10min',     icon: '🧘', color: '#00D9FF', category: 'flexibility', frequency_per_week: 5, xp_per_completion: 50 },
    ],
  },
]

export function HabitPacksModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const router = useRouter()
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  useScrollLock(true)

  async function handleInstall() {
    if (!selectedPack || loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const rows = selectedPack.habits.map((h, i) => ({
      user_id: user.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      category: h.category,
      target_type: 'count',
      target_value: h.frequency_per_week,
      target_period: 'week',
      target_unit: 'vez',
      frequency_per_week: h.frequency_per_week,
      xp_per_completion: h.xp_per_completion,
      display_order: 100 + i,
    }))

    await supabase.from('habits').insert(rows)

    setDone(true)
    setTimeout(() => {
      router.refresh()
      onCreated()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div
        className="w-full max-w-lg animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(124,58,237,0.15)' }} />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-purple" />
            <span className="font-bold">Pacotes de Hábitos</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-3 relative z-10" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <p className="text-sm text-text-secondary">
            Escolha um pacote e adicione vários hábitos de uma vez. Você pode editar depois.
          </p>

          {PACKS.map((pack) => {
            const isSelected = selectedPack?.id === pack.id
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(isSelected ? null : pack)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, rgba(${pack.rgb},0.15) 0%, rgba(13,24,41,0.98) 100%)`
                    : 'rgba(255,255,255,0.025)',
                  border: isSelected
                    ? `1px solid rgba(${pack.rgb},0.4)`
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: `rgba(${pack.rgb},0.12)`,
                      border: `1px solid rgba(${pack.rgb},0.2)`,
                    }}
                  >
                    {pack.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{pack.name}</span>
                      {isSelected && (
                        <span
                          className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: `rgba(${pack.rgb},0.2)`, color: pack.color }}
                        >
                          ✓ SELECIONADO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{pack.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pack.habits.map((h) => (
                        <span
                          key={h.name}
                          className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#8899BB' }}
                        >
                          {h.icon} {h.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border relative z-10">
          {done ? (
            <div className="flex items-center justify-center gap-2 text-brand-green font-bold py-3">
              <Check size={18} />
              {selectedPack?.habits.length} hábitos adicionados!
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={!selectedPack || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Adicionando…
                </>
              ) : selectedPack ? (
                `Adicionar ${selectedPack.habits.length} hábitos do pack "${selectedPack.name}"`
              ) : (
                'Selecione um pacote'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
