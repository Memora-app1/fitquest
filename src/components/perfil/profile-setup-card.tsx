import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

interface SetupStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  emoji: string;
}

interface Props {
  avatarSet: boolean;
  bioSet: boolean;
  habitsCreated: boolean;
  taskCompleted: boolean;
  workoutDone: boolean;
  onboardingCompleted: boolean;
  referralCount: number;
}

export function ProfileSetupCard({
  avatarSet,
  bioSet,
  habitsCreated,
  taskCompleted,
  workoutDone,
  onboardingCompleted,
  referralCount,
}: Props) {
  const steps: SetupStep[] = [
    {
      id: 'onboarding',
      label: 'Completar onboarding',
      description: 'Configure seus objetivos iniciais',
      done: onboardingCompleted,
      href: '/onboarding',
      emoji: '🎯',
    },
    {
      id: 'avatar',
      label: 'Adicionar foto de perfil',
      description: 'Coloque um avatar no seu perfil',
      done: avatarSet,
      href: '/perfil#foto',
      emoji: '📸',
    },
    {
      id: 'bio',
      label: 'Escrever bio',
      description: 'Conte um pouco sobre você',
      done: bioSet,
      href: '/perfil#bio',
      emoji: '✏️',
    },
    {
      id: 'habit',
      label: 'Criar um hábito',
      description: 'Adicione seu primeiro hábito diário',
      done: habitsCreated,
      href: '/habitos',
      emoji: '🔥',
    },
    {
      id: 'task',
      label: 'Concluir uma tarefa',
      description: 'Marque sua primeira tarefa como feita',
      done: taskCompleted,
      href: '/tarefas',
      emoji: '✅',
    },
    {
      id: 'workout',
      label: 'Registrar um treino',
      description: 'Complete sua primeira sessão de treino',
      done: workoutDone,
      href: '/treinos',
      emoji: '💪',
    },
    {
      id: 'referral',
      label: 'Convidar um amigo',
      description: 'Compartilhe seu código e ganhe +200 XP',
      done: referralCount > 0,
      href: '/perfil#referral',
      emoji: '🤝',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  // Se completo, não mostra o card
  if (doneCount === totalCount) return null;

  const pendingSteps = steps.filter((s) => !s.done);

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(124,58,237,0.25)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#9F5AF7' }}>
              Setup do Perfil
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              {doneCount}/{totalCount} etapas completas
            </p>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black"
            style={{
              background: pct >= 80 ? 'rgba(0,255,136,0.12)' : 'rgba(124,58,237,0.12)',
              color: pct >= 80 ? '#00FF88' : '#9F5AF7',
              border: `1px solid ${pct >= 80 ? 'rgba(0,255,136,0.3)' : 'rgba(124,58,237,0.3)'}`,
            }}
          >
            {pct}%
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background:
                pct >= 80
                  ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                  : 'linear-gradient(90deg, #7C3AED, #FF4D00)',
            }}
          />
        </div>
      </div>

      {/* Completed steps (collapsed) */}
      {doneCount > 0 && (
        <div className="px-5 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {steps
              .filter((s) => s.done)
              .map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: 'rgba(0,255,136,0.08)',
                    color: '#00FF88',
                    border: '1px solid rgba(0,255,136,0.2)',
                  }}
                >
                  <CheckCircle2 size={9} />
                  {s.emoji} {s.label}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Pending steps */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {pendingSteps.slice(0, 3).map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className="flex items-center gap-3 px-5 py-3 transition-all hover:bg-white/[0.03] active:bg-white/[0.05]"
          >
            <Circle size={18} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span>{step.emoji}</span>
                <span className="truncate">{step.label}</span>
              </div>
              <div className="text-xs text-text-muted">{step.description}</div>
            </div>
            <ChevronRight size={14} className="shrink-0 text-text-muted" />
          </Link>
        ))}
        {pendingSteps.length > 3 && (
          <div className="px-5 py-2.5 text-xs text-text-muted">
            + {pendingSteps.length - 3} etapa{pendingSteps.length - 3 !== 1 ? 's' : ''} restante
            {pendingSteps.length - 3 !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
