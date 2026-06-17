/**
 * RPG Character — card de classe RPG baseado na distribuição de XP do usuário.
 * Analisa as últimas 4 semanas de xp_transactions por source_type e determina a classe dominante.
 * Classes: Guerreiro (fitness), Monge (hábitos), Erudito (tarefas/coach), Mercador (finanças), Herói (equilibrado)
 */

import { createClient } from '@/lib/supabase/server';
import { Shield, Zap, Star, Target, TrendingUp, Crown } from 'lucide-react';

interface RpgClass {
  id: string;
  name: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
  rgb: string;
  gradient: string;
  skills: string[];
  lore: string;
  weaknesses: string;
}

const RPG_CLASSES: Record<string, RpgClass> = {
  guerreiro: {
    id: 'guerreiro',
    name: 'Guerreiro',
    emoji: '⚔️',
    title: 'Guerreiro do Fitness',
    description:
      'Você domina o treino. Força, resistência e consistência física são seus pontos fortes.',
    color: '#FF4D00',
    rgb: '255,77,0',
    gradient: 'from-orange-500/20 to-red-900/20',
    skills: ['Treinos intensos', 'Força máxima', 'Resistência'],
    lore: 'Nasceu nas academias, forjado pelo suor. Onde outros param, você avança.',
    weaknesses: 'Foco em finanças e planejamento',
  },
  monge: {
    id: 'monge',
    name: 'Monge',
    emoji: '🧘',
    title: 'Monge dos Hábitos',
    description: 'Sua consistência diária é lendária. Hábitos e disciplina são sua superpotência.',
    color: '#00FF88',
    rgb: '0,255,136',
    gradient: 'from-green-500/20 to-emerald-900/20',
    skills: ['Consistência diária', 'Autodisciplina', 'Mindset'],
    lore: 'A maestria vem da repetição. Cada dia é um tijolo no seu templo de hábitos.',
    weaknesses: 'Explosividade e fitness pesado',
  },
  erudito: {
    id: 'erudito',
    name: 'Erudito',
    emoji: '📚',
    title: 'Erudito da Produtividade',
    description: 'Sua mente é sua arma. Produtividade, foco e estratégia definem sua jornada.',
    color: '#7C3AED',
    rgb: '124,58,237',
    gradient: 'from-purple-500/20 to-violet-900/20',
    skills: ['Planejamento', 'Execução de tarefas', 'Estratégia'],
    lore: 'Enquanto outros reagem, você planeja. Seu próximo movimento já está calculado.',
    weaknesses: 'Saúde física e equilíbrio',
  },
  mercador: {
    id: 'mercador',
    name: 'Mercador',
    emoji: '💰',
    title: 'Mercador das Finanças',
    description: 'Dinheiro é sua área. Controle financeiro e metas monetárias são seu domínio.',
    color: '#F5C842',
    rgb: '245,200,66',
    gradient: 'from-yellow-500/20 to-amber-900/20',
    skills: ['Controle financeiro', 'Metas monetárias', 'Disciplina fiscal'],
    lore: 'Cada real conta. Você não apenas ganha — você multiplica. O mercado é seu campo de batalha.',
    weaknesses: 'Atividade física e hábitos corporais',
  },
  heroi: {
    id: 'heroi',
    name: 'Herói',
    emoji: '🌟',
    title: 'Herói Equilibrado',
    description:
      'Você é raro — equilibrado em todas as áreas. Fitness, hábitos, produtividade e finanças em harmonia.',
    color: '#00D9FF',
    rgb: '0,217,255',
    gradient: 'from-cyan-500/20 to-blue-900/20',
    skills: ['Equilíbrio total', 'Versatilidade', 'Adaptabilidade'],
    lore: 'A verdadeira força vem do equilíbrio. Você domina todas as dimensões da vida.',
    weaknesses: 'Ainda não identificada — você é completo',
  },
};

function determineClass(xpBySource: Record<string, number>): RpgClass {
  const fitness = (xpBySource['workout'] ?? 0) + (xpBySource['health'] ?? 0);
  const habits = xpBySource['habit'] ?? 0;
  const tasks = (xpBySource['task'] ?? 0) + (xpBySource['coach'] ?? 0);
  const finance = xpBySource['finance'] ?? 0;

  const total = fitness + habits + tasks + finance;
  if (total < 50) return RPG_CLASSES['heroi']!;

  const pcts = {
    fitness: fitness / total,
    habits: habits / total,
    tasks: tasks / total,
    finance: finance / total,
  };

  // Balanced if no category dominates (max < 40%)
  const maxPct = Math.max(...Object.values(pcts));
  if (maxPct < 0.4) return RPG_CLASSES['heroi']!;

  const dominant = Object.entries(pcts).sort((a, b) => b[1] - a[1])[0]![0];

  const classMap: Record<string, string> = {
    fitness: 'guerreiro',
    habits: 'monge',
    tasks: 'erudito',
    finance: 'mercador',
  };

  return RPG_CLASSES[classMap[dominant] ?? 'heroi'] ?? RPG_CLASSES['heroi']!;
}

export async function RpgCharacter({ userId }: { userId: string }) {
  const supabase = await createClient();
  const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();

  const [profileRes, xpRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('level, xp_total, streak_current, streak_longest, name')
      .eq('id', userId)
      .single(),
    supabase
      .from('xp_transactions')
      .select('amount, source_type')
      .eq('user_id', userId)
      .gte('created_at', fourWeeksAgo)
      .limit(2000),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const transactions = xpRes.data ?? [];
  if (transactions.length === 0) return null;

  const xpBySource: Record<string, number> = {};
  for (const tx of transactions) {
    const source = (tx.source_type as string) ?? 'other';
    xpBySource[source] = (xpBySource[source] ?? 0) + (tx.amount as number);
  }

  const rpgClass = determineClass(xpBySource);
  const totalXp = profile.xp_total as number;
  const level = profile.level as number;
  const streak = profile.streak_current as number;

  const sourceLabels: Record<string, string> = {
    workout: 'Treinos',
    habit: 'Hábitos',
    task: 'Tarefas',
    health: 'Saúde',
    finance: 'Finanças',
    coach: 'Coach IA',
  };

  const topSources = Object.entries(xpBySource)
    .filter(([k]) => k !== 'other')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const totalFromSources = topSources.reduce((s, [, v]) => s + v, 0);

  return (
    <div
      className="relative animate-fade-in overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background: `linear-gradient(135deg, rgba(${rpgClass.rgb},0.10) 0%, rgba(13,24,41,0.98) 55%, rgba(${rpgClass.rgb},0.05) 100%)`,
        border: `1px solid rgba(${rpgClass.rgb},0.25)`,
      }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full blur-3xl"
        style={{ background: `rgba(${rpgClass.rgb},0.08)` }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: `rgba(${rpgClass.rgb},0.15)`,
                  border: `1px solid rgba(${rpgClass.rgb},0.3)`,
                }}
              >
                <Shield size={12} style={{ color: rpgClass.color }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Classe RPG
              </span>
            </div>
            <h2 className="text-2xl font-black">{rpgClass.title}</h2>
            <p className="mt-1 max-w-xs text-sm text-text-secondary">{rpgClass.description}</p>
          </div>

          {/* Class emoji */}
          <div
            className="flex h-20 w-20 shrink-0 animate-float items-center justify-center rounded-2xl text-4xl"
            style={{
              background: `rgba(${rpgClass.rgb},0.12)`,
              border: `2px solid rgba(${rpgClass.rgb},0.3)`,
              boxShadow: `0 0 20px rgba(${rpgClass.rgb},0.15)`,
            }}
          >
            {rpgClass.emoji}
          </div>
        </div>

        {/* Lore */}
        <div
          className="mb-4 rounded-xl px-4 py-3 italic"
          style={{
            background: `rgba(${rpgClass.rgb},0.06)`,
            border: `1px solid rgba(${rpgClass.rgb},0.12)`,
          }}
        >
          <p className="text-sm" style={{ color: rpgClass.color, opacity: 0.85 }}>
            "{rpgClass.lore}"
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="text-center">
            <div className="heading-display text-2xl" style={{ color: rpgClass.color }}>
              Lv {level}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted">nível</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="heading-display text-2xl" style={{ color: rpgClass.color }}>
              {totalXp.toLocaleString('pt-BR')}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted">XP total</div>
          </div>
          {streak > 0 && (
            <>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="heading-display text-2xl" style={{ color: rpgClass.color }}>
                  🔥 {streak}d
                </div>
                <div className="text-[9px] uppercase tracking-wider text-text-muted">streak</div>
              </div>
            </>
          )}
        </div>

        {/* Skills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {rpgClass.skills.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: `rgba(${rpgClass.rgb},0.12)`,
                border: `1px solid rgba(${rpgClass.rgb},0.25)`,
                color: rpgClass.color,
              }}
            >
              <Star size={10} />
              {skill}
            </div>
          ))}
        </div>

        {/* XP Distribution */}
        {topSources.length > 0 && (
          <div className="space-y-2">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Distribuição de XP (4 semanas)
            </div>
            {topSources.map(([source, amount]) => {
              const pct = totalFromSources > 0 ? Math.round((amount / totalFromSources) * 100) : 0;
              return (
                <div key={source}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {sourceLabels[source] ?? source}
                    </span>
                    <span className="text-xs font-bold" style={{ color: rpgClass.color }}>
                      {pct}% · +{amount.toLocaleString('pt-BR')} XP
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full animate-progress-fill rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: rpgClass.color,
                        opacity: source === topSources[0]![0] ? 1 : 0.5,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Weakness hint */}
        <div
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Target size={14} className="shrink-0 text-text-muted" />
          <p className="text-xs text-text-muted">
            <strong className="text-white">Evolva sua classe:</strong> {rpgClass.weaknesses}
          </p>
        </div>
      </div>
    </div>
  );
}
