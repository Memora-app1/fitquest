import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OperacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'support')) redirect('/admin');

  const db = createServiceClient();

  const [campaignsRes, activeBannersRes, flagsRes] = await Promise.all([
    db
      .from('broadcast_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent'),
    db.from('app_banners').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('feature_flags').select('id', { count: 'exact', head: true }).eq('enabled', true),
  ]);

  const cards = [
    {
      label: 'Notificações Push',
      href: '/admin/operacoes/notificacoes',
      icon: '🔔',
      color: '#7C3AED',
      description: 'Enviar notificações push segmentadas para usuários. Histórico de campanhas.',
      stat: (campaignsRes.count ?? 0) + ' campanhas enviadas',
    },
    {
      label: 'Banners In-App',
      href: '/admin/operacoes/banners',
      icon: '📣',
      color: '#FF4D00',
      description: 'Criar e gerenciar banners exibidos dentro do aplicativo.',
      stat: (activeBannersRes.count ?? 0) + ' banners ativos',
    },
    {
      label: 'Feature Flags',
      href: '/admin/operacoes/feature-flags',
      icon: '🚩',
      color: '#00FF88',
      description: 'Habilitar ou desabilitar funcionalidades para segmentos de usuários.',
      stat: (flagsRes.count ?? 0) + ' flags ligadas',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <Megaphone size={22} style={{ color: '#FF4D00' }} /> Operações
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          Comunicação, banners e feature flags — ferramentas de produto para o dia a dia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col gap-3 rounded-xl p-5 transition-all hover:scale-[1.01]"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{
                background: `rgba(${hexToRgb(card.color)},0.1)`,
                border: `1px solid rgba(${hexToRgb(card.color)},0.2)`,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div className="mb-1 text-sm font-bold" style={{ color: '#fff' }}>
                {card.label}
              </div>
              <div className="mb-3 text-xs" style={{ color: '#8899BB' }}>
                {card.description}
              </div>
              <span
                className="rounded-full px-2 py-1 text-xs font-bold"
                style={{ background: `rgba(${hexToRgb(card.color)},0.1)`, color: card.color }}
              >
                {card.stat}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
