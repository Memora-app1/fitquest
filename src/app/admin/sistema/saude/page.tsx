import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Activity,
  Database,
  Mail,
  CreditCard,
  Bot,
  Key,
  Globe,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Check {
  label: string;
  ok: boolean;
  detail: string;
  icon: React.ReactNode;
  category: string;
}

export default async function SistemaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin');

  // ── Verificar conectividade com o banco ──────────────────────────────────
  const db = createServiceClient();
  let dbOk = false;
  let dbDetail = '';
  let userCount = 0;

  try {
    const { count, error } = await db.from('profiles').select('id', { count: 'exact', head: true });
    if (error) throw error;
    dbOk = true;
    userCount = count ?? 0;
    dbDetail = `${userCount.toLocaleString('pt-BR')} usuários no banco`;
  } catch (e) {
    dbDetail = e instanceof Error ? e.message : 'Erro de conexão';
  }

  // ── Verificar variáveis de ambiente ──────────────────────────────────────
  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
    mp: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    cronSecret: !!process.env.CRON_SECRET,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const checks: Check[] = [
    {
      label: 'Supabase — Conexão',
      ok: dbOk,
      detail: dbOk ? dbDetail : dbDetail,
      icon: <Database size={14} />,
      category: 'Banco de Dados',
    },
    {
      label: 'Supabase — URL',
      ok: env.supabaseUrl,
      detail: env.supabaseUrl
        ? process.env.NEXT_PUBLIC_SUPABASE_URL!.slice(0, 40) + '…'
        : 'NEXT_PUBLIC_SUPABASE_URL ausente',
      icon: <Database size={14} />,
      category: 'Banco de Dados',
    },
    {
      label: 'Supabase — Anon Key',
      ok: env.supabaseAnon,
      detail: env.supabaseAnon ? 'Configurado' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY ausente',
      icon: <Key size={14} />,
      category: 'Banco de Dados',
    },
    {
      label: 'Supabase — Service Role Key',
      ok: env.supabaseService,
      detail: env.supabaseService ? 'Configurado' : 'SUPABASE_SERVICE_ROLE_KEY ausente',
      icon: <Key size={14} />,
      category: 'Banco de Dados',
    },
    {
      label: 'Anthropic — API Key',
      ok: env.anthropic,
      detail: env.anthropic ? 'Configurado' : 'ANTHROPIC_API_KEY ausente — Coach IA inativo',
      icon: <Bot size={14} />,
      category: 'Integrações',
    },
    {
      label: 'Resend — API Key',
      ok: env.resend,
      detail: env.resend ? 'Configurado' : 'RESEND_API_KEY ausente — emails desativados',
      icon: <Mail size={14} />,
      category: 'Integrações',
    },
    {
      label: 'Mercado Pago — Access Token',
      ok: env.mp,
      detail: env.mp ? 'Configurado' : 'MERCADOPAGO_ACCESS_TOKEN ausente',
      icon: <CreditCard size={14} />,
      category: 'Pagamentos',
    },
    {
      label: 'Stripe — Secret Key',
      ok: env.stripe,
      detail: env.stripe ? 'Configurado' : 'STRIPE_SECRET_KEY ausente',
      icon: <CreditCard size={14} />,
      category: 'Pagamentos',
    },
    {
      label: 'CRON_SECRET',
      ok: env.cronSecret,
      detail: env.cronSecret ? 'Configurado' : 'CRON_SECRET ausente — crons sem autenticação',
      icon: <Key size={14} />,
      category: 'Automações',
    },
    {
      label: 'NEXT_PUBLIC_APP_URL',
      ok: env.appUrl,
      detail: env.appUrl
        ? process.env.NEXT_PUBLIC_APP_URL!
        : 'NEXT_PUBLIC_APP_URL ausente — links de email quebrados',
      icon: <Globe size={14} />,
      category: 'Automações',
    },
  ];

  const okCount = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct = Math.round((okCount / total) * 100);
  const status = okCount === total ? 'healthy' : okCount >= total * 0.8 ? 'degraded' : 'critical';

  const statusColor =
    status === 'healthy' ? '#00FF88' : status === 'degraded' ? '#F5C842' : '#FF4D00';
  const statusLabel =
    status === 'healthy' ? 'Tudo OK' : status === 'degraded' ? 'Degradado' : 'Crítico';

  const categories = [...new Set(checks.map((c) => c.category))];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
            <Activity size={20} style={{ color: '#00FF88' }} /> Saúde do Sistema
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
            Conectividade, variáveis de ambiente e integrações
          </p>
        </div>
        <Link
          href="/admin/sistema/saude"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: '#8899BB',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <RefreshCw size={12} /> Atualizar
        </Link>
      </div>

      {/* Status geral */}
      <div
        className="flex items-center gap-4 rounded-xl p-4"
        style={{
          background: `rgba(${status === 'healthy' ? '0,255,136' : status === 'degraded' ? '245,200,66' : '255,77,0'},0.06)`,
          border: `1px solid rgba(${status === 'healthy' ? '0,255,136' : status === 'degraded' ? '245,200,66' : '255,77,0'},0.2)`,
        }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{
            background: `rgba(${status === 'healthy' ? '0,255,136' : status === 'degraded' ? '245,200,66' : '255,77,0'},0.1)`,
          }}
        >
          {status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '🔴'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-black" style={{ color: statusColor }}>
            {statusLabel}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: '#8899BB' }}>
            {okCount}/{total} verificações passando ({pct}%)
          </div>
        </div>
        {/* Mini progress bar */}
        <div
          className="h-2 w-24 shrink-0 overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: statusColor }}
          />
        </div>
      </div>

      {/* Checks por categoria */}
      {categories.map((category) => {
        const catChecks = checks.filter((c) => c.category === category);
        const catOk = catChecks.filter((c) => c.ok).length;

        return (
          <div key={category}>
            <div className="mb-2 flex items-center justify-between">
              <h2
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: '#8899BB' }}
              >
                {category}
              </h2>
              <span
                className="text-xs"
                style={{ color: catOk === catChecks.length ? '#00FF88' : '#F5C842' }}
              >
                {catOk}/{catChecks.length}
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {catChecks.map((check, i) => (
                <div
                  key={check.label}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom:
                      i < catChecks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: check.ok ? 'transparent' : 'rgba(255,77,0,0.03)',
                  }}
                >
                  <span style={{ color: check.ok ? '#00FF88' : '#FF4D00', flexShrink: 0 }}>
                    {check.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  </span>
                  <span style={{ color: check.ok ? '#8899BB' : '#8899BB', flexShrink: 0 }}>
                    {check.icon}
                  </span>
                  <span className="min-w-0 flex-1 text-sm" style={{ color: '#fff' }}>
                    {check.label}
                  </span>
                  <span
                    className="max-w-[200px] shrink-0 truncate text-right text-xs"
                    style={{ color: check.ok ? '#00FF88' : '#FF4D00' }}
                  >
                    {check.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
