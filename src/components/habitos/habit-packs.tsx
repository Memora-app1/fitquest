'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface HabitTemplate {
  name: string;
  icon: string;
  color: string;
  category: string;
  frequency_per_week: number;
  xp_per_completion: number;
}

interface Pack {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  rgb: string;
  habits: HabitTemplate[];
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
      {
        name: 'Beber água ao acordar',
        icon: '💧',
        color: '#00D9FF',
        category: 'nutrition',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Meditação 10min',
        icon: '🧘',
        color: '#7C3AED',
        category: 'mindfulness',
        frequency_per_week: 5,
        xp_per_completion: 50,
      },
      {
        name: 'Exercícios matinais',
        icon: '💪',
        color: '#FF4D00',
        category: 'strength',
        frequency_per_week: 4,
        xp_per_completion: 50,
      },
      {
        name: 'Planejar o dia',
        icon: '📋',
        color: '#00FF88',
        category: 'custom',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Ler 20 minutos',
        icon: '📖',
        color: '#3B82F6',
        category: 'custom',
        frequency_per_week: 5,
        xp_per_completion: 50,
      },
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
      {
        name: 'Treinar',
        icon: '🏋️',
        color: '#FF4D00',
        category: 'strength',
        frequency_per_week: 5,
        xp_per_completion: 50,
      },
      {
        name: 'Proteína nas refeições',
        icon: '🍗',
        color: '#F59E0B',
        category: 'nutrition',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Dormir 8h',
        icon: '😴',
        color: '#7C3AED',
        category: 'sleep',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Beber 3L de água',
        icon: '💧',
        color: '#00D9FF',
        category: 'nutrition',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
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
      {
        name: 'Deep work 2h',
        icon: '⚡',
        color: '#FF4D00',
        category: 'custom',
        frequency_per_week: 5,
        xp_per_completion: 50,
      },
      {
        name: 'Sem redes sociais manhã',
        icon: '📵',
        color: '#EF4444',
        category: 'custom',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Revisar tarefas',
        icon: '✅',
        color: '#7C3AED',
        category: 'custom',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Revisão semanal',
        icon: '📊',
        color: '#00FF88',
        category: 'custom',
        frequency_per_week: 1,
        xp_per_completion: 50,
      },
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
      {
        name: 'Registrar gastos',
        icon: '💰',
        color: '#00FF88',
        category: 'custom',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Revisar extrato',
        icon: '📊',
        color: '#F5C842',
        category: 'custom',
        frequency_per_week: 1,
        xp_per_completion: 50,
      },
      {
        name: 'Poupar R$X hoje',
        icon: '🐷',
        color: '#00D9FF',
        category: 'custom',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
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
      {
        name: 'Caminhar 30min',
        icon: '🚶',
        color: '#00FF88',
        category: 'cardio',
        frequency_per_week: 5,
        xp_per_completion: 50,
      },
      {
        name: 'Sem tela 1h antes dormir',
        icon: '🌙',
        color: '#7C3AED',
        category: 'sleep',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Gratidão 3 coisas',
        icon: '🙏',
        color: '#F5C842',
        category: 'mindfulness',
        frequency_per_week: 7,
        xp_per_completion: 50,
      },
      {
        name: 'Alongamento 10min',
        icon: '🧘',
        color: '#00D9FF',
        category: 'flexibility',
        frequency_per_week: 5,
        xp_per_completion: 50,
      },
    ],
  },
];

export function HabitPacksModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  useScrollLock(true);

  async function handleInstall() {
    if (!selectedPack || loading) return;
    setLoading(true);
    setInstallError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

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
    }));

    const { error } = await supabase.from('habits').insert(rows);
    if (error) {
      console.error('[habit-packs] insert failed:', error.message);
      setInstallError('Erro ao instalar pacote. Tente novamente.');
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.refresh();
      onCreated();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center">
      <div
        className="relative w-full max-w-lg animate-slide-up overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
          style={{ background: 'rgba(124,58,237,0.15)' }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-purple" />
            <span className="font-bold">Pacotes de Hábitos</span>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted transition-colors hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="relative z-10 space-y-3 overflow-y-auto p-5"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          <p className="text-sm text-text-secondary">
            Escolha um pacote e adicione vários hábitos de uma vez. Você pode editar depois.
          </p>

          {PACKS.map((pack) => {
            const isSelected = selectedPack?.id === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(isSelected ? null : pack)}
                className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{
                      background: `rgba(${pack.rgb},0.12)`,
                      border: `1px solid rgba(${pack.rgb},0.2)`,
                    }}
                  >
                    {pack.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{pack.name}</span>
                      {isSelected && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
                          style={{ background: `rgba(${pack.rgb},0.2)`, color: pack.color }}
                        >
                          ✓ SELECIONADO
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">{pack.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pack.habits.map((h) => (
                        <span
                          key={h.name}
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: '#8899BB',
                          }}
                        >
                          {h.icon} {h.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-border p-5">
          {installError && (
            <p className="mb-2 text-center text-sm font-medium text-brand-red">{installError}</p>
          )}
          {done ? (
            <div className="flex items-center justify-center gap-2 py-3 font-bold text-brand-green">
              <Check size={18} />
              {selectedPack?.habits.length} hábitos adicionados!
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={!selectedPack || loading}
              className="btn-primary flex w-full items-center justify-center gap-2"
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
  );
}
