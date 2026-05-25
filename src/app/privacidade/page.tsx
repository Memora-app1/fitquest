import Link from 'next/link'
import { Shield, Eye, Database, Share2, Lock, UserCheck, Mail, Scale } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade — FitQuest',
  description: 'Como o FitQuest coleta, usa e protege seus dados, em conformidade com a LGPD.',
}

const SECTIONS = [
  { id: 'controlador', num: '01', title: 'Quem Somos (Controlador)' },
  { id: 'dados', num: '02', title: 'Dados que Coletamos' },
  { id: 'finalidades', num: '03', title: 'Finalidades do Tratamento' },
  { id: 'base-legal', num: '04', title: 'Base Legal (LGPD, Art. 7º)' },
  { id: 'compartilhamento', num: '05', title: 'Compartilhamento com Terceiros' },
  { id: 'armazenamento', num: '06', title: 'Armazenamento e Transferência' },
  { id: 'direitos', num: '07', title: 'Seus Direitos como Titular' },
  { id: 'cookies', num: '08', title: 'Cookies e Tecnologias' },
  { id: 'seguranca', num: '09', title: 'Segurança dos Dados' },
  { id: 'criancas', num: '10', title: 'Crianças e Adolescentes' },
  { id: 'dpo', num: '11', title: 'Encarregado de Dados (DPO)' },
  { id: 'mudancas', num: '12', title: 'Mudanças nesta Política' },
  { id: 'contato', num: '13', title: 'Contato' },
]

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <div
        className="relative py-16 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050914 0%, #0D1829 100%)' }}
      >
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-brand-purple/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-brand-green/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <Link href="/" className="inline-block heading-display text-2xl gradient-text mb-6">
            ⚡ FitQuest
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center shrink-0">
              <Shield size={24} className="text-brand-purple" />
            </div>
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Política de Privacidade</h1>
              <p className="text-text-secondary mt-2">
                Última atualização: <strong className="text-white">23 de maio de 2026</strong>
                {' '}·{' '}
                <span className="text-brand-green text-sm">Em conformidade com a LGPD (Lei 13.709/2018)</span>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-brand-green/20 bg-brand-green/5 text-sm text-text-secondary leading-relaxed">
            <span className="text-white font-semibold">Sua privacidade é fundamental para nós.</span>{' '}
            Esta Política descreve como o FitQuest coleta, utiliza, armazena e protege seus dados pessoais.
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Table of contents */}
        <div className="card p-5 mb-10">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Índice</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-purple transition-colors py-1 group"
              >
                <span className="font-mono text-[10px] text-text-muted group-hover:text-brand-purple/60">{s.num}</span>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-12">

          {/* 1 */}
          <section id="controlador" className="scroll-mt-6">
            <SectionHeader num="01" title="Quem Somos (Controlador dos Dados)" icon={<UserCheck size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                O <strong className="text-white">FitQuest</strong> é o controlador dos seus dados pessoais, responsável pelas decisões sobre o tratamento dessas informações nos termos da LGPD.
              </p>
              <div className="card p-4 space-y-2">
                <p className="font-bold text-white text-lg">⚡ FitQuest</p>
                <p>Email: <a href="mailto:privacidade@fitquest.app" className="text-brand-purple underline hover:text-brand-purple/80 transition-colors">privacidade@fitquest.app</a></p>
                <p>Site: fitquest-app1.vercel.app</p>
              </div>
            </div>
          </section>

          {/* 2 */}
          <section id="dados" className="scroll-mt-6">
            <SectionHeader num="02" title="Dados que Coletamos" icon={<Database size={18} />} />
            <div className="space-y-5 text-text-secondary leading-relaxed">

              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] flex items-center justify-center font-bold">a</span>
                  Dados de Cadastro
                </h3>
                <ul className="space-y-1 pl-4">
                  {['Nome (fornecido no cadastro)', 'Endereço de email', 'Senha (armazenada com hash bcrypt — nunca em texto puro)', 'Data de criação da conta'].map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <span className="text-brand-purple mt-0.5 shrink-0">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] flex items-center justify-center font-bold">b</span>
                  Dados de Uso do Aplicativo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { emoji: '💪', title: 'Fitness', desc: 'Hábitos, treinos, séries, pesos, recordes pessoais' },
                    { emoji: '✅', title: 'Produtividade', desc: 'Tarefas, listas, status, datas, prioridades' },
                    { emoji: '💰', title: 'Finanças', desc: 'Contas, transações, categorias, metas financeiras' },
                    { emoji: '⚡', title: 'Gamificação', desc: 'XP, nível, streak, conquistas desbloqueadas' },
                  ].map((item) => (
                    <div key={item.title} className="card p-3 flex gap-2.5 items-start text-sm">
                      <span className="text-lg">{item.emoji}</span>
                      <div>
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] flex items-center justify-center font-bold">c</span>
                  Dados de Pagamento
                </h3>
                <div className="flex gap-3 p-4 rounded-xl bg-brand-green/5 border border-brand-green/20">
                  <Lock size={18} className="text-brand-green shrink-0 mt-0.5" />
                  <p className="text-sm">
                    O FitQuest <strong className="text-white">não armazena dados de cartão de crédito</strong>. Os pagamentos são processados integralmente pelo <strong className="text-white">Mercado Pago</strong> (mercadopago.com.br), certificado pelo Banco Central do Brasil. Recebemos apenas confirmações de pagamento e identificadores de assinatura.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] flex items-center justify-center font-bold">d</span>
                  Coach IA (Dados de Conversas)
                </h3>
                <p className="text-sm">
                  As conversas com o Coach IA são processadas pela <strong className="text-white">Anthropic</strong> (anthropic.com) e armazenadas em nosso banco de dados para contexto histórico. O contexto enviado à Anthropic inclui seus dados de hábitos, tarefas e finanças para personalizar as respostas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] flex items-center justify-center font-bold">e</span>
                  Dados Técnicos
                </h3>
                <ul className="space-y-1 pl-4">
                  {[
                    'Endereço IP (para segurança e prevenção de fraudes)',
                    'Tipo de dispositivo e navegador',
                    'Logs de acesso (datas e horários de login)',
                    'Dados de notificações push (se habilitadas)',
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <span className="text-brand-purple mt-0.5 shrink-0">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section id="finalidades" className="scroll-mt-6">
            <SectionHeader num="03" title="Finalidades do Tratamento" icon={<Eye size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>Utilizamos seus dados para:</p>
              <ul className="space-y-2 pl-4">
                {[
                  'Criar e gerenciar sua conta de usuário',
                  'Fornecer todas as funcionalidades do FitQuest (hábitos, tarefas, finanças, coach IA)',
                  'Processar pagamentos e gerenciar sua assinatura',
                  'Enviar notificações de lembretes e conquistas (com seu consentimento)',
                  'Personalizar a experiência de gamificação (XP, nível, streak)',
                  'Detectar e prevenir fraudes e acessos não autorizados',
                  'Cumprir obrigações legais e regulatórias',
                  'Melhorar o serviço com base em dados agregados e anonimizados',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <span className="text-brand-purple mt-0.5 shrink-0">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/20">
                <Shield size={18} className="text-brand-purple shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong className="text-white">Não utilizamos</strong> seus dados para publicidade de terceiros ou para vender informações a outras empresas. Jamais.
                </p>
              </div>
            </div>
          </section>

          {/* 4 */}
          <section id="base-legal" className="scroll-mt-6">
            <SectionHeader num="04" title="Base Legal (LGPD, Art. 7º)" icon={<Scale size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>O tratamento dos seus dados se baseia em:</p>
              <div className="space-y-2">
                {[
                  { base: 'Execução de contrato (Art. 7º, V)', desc: 'Para fornecer o serviço contratado' },
                  { base: 'Consentimento (Art. 7º, I)', desc: 'Para notificações push e personalização via Coach IA' },
                  { base: 'Legítimo interesse (Art. 7º, IX)', desc: 'Para segurança, prevenção de fraudes e melhoria do serviço' },
                  { base: 'Obrigação legal (Art. 7º, II)', desc: 'Para cumprir exigências fiscais e regulatórias' },
                ].map((item) => (
                  <div key={item.base} className="card p-3 flex gap-3 items-start text-sm">
                    <span className="text-brand-purple mt-0.5 shrink-0">⚖️</span>
                    <div>
                      <span className="font-semibold text-white">{item.base}</span>
                      <span className="text-text-muted"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5 */}
          <section id="compartilhamento" className="scroll-mt-6">
            <SectionHeader num="05" title="Compartilhamento com Terceiros" icon={<Share2 size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Compartilhamos dados apenas com os seguintes parceiros, estritamente necessários para o funcionamento do serviço:
              </p>
              <div className="space-y-2">
                {[
                  {
                    name: 'Supabase',
                    url: 'supabase.com',
                    desc: 'Banco de dados, autenticação e armazenamento. Dados podem ser processados em servidores nos EUA.',
                    policyUrl: 'https://supabase.com/privacy',
                    emoji: '🗄️',
                  },
                  {
                    name: 'Vercel',
                    url: 'vercel.com',
                    desc: 'Hospedagem e infraestrutura do aplicativo.',
                    policyUrl: 'https://vercel.com/legal/privacy-policy',
                    emoji: '▲',
                  },
                  {
                    name: 'Mercado Pago',
                    url: 'mercadopago.com.br',
                    desc: 'Processamento de pagamentos. Recebem email e dados de pagamento para processar assinaturas. Certificado pelo Banco Central do Brasil.',
                    policyUrl: 'https://www.mercadopago.com.br/privacidade',
                    emoji: '💳',
                  },
                  {
                    name: 'Anthropic',
                    url: 'anthropic.com',
                    desc: 'Processamento das conversas com o Coach IA. Dados de contexto são enviados para gerar respostas personalizadas.',
                    policyUrl: 'https://www.anthropic.com/privacy',
                    emoji: '🤖',
                  },
                  {
                    name: 'Google (Opcional)',
                    url: 'google.com',
                    desc: 'Sincronização com Google Agenda, apenas se você ativar essa integração. Dados acessados com sua permissão explícita.',
                    policyUrl: 'https://policies.google.com/privacy',
                    emoji: '📅',
                  },
                ].map((p) => (
                  <div key={p.name} className="card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="font-semibold text-white">{p.name}</span>
                      <span className="text-[10px] text-text-muted">({p.url})</span>
                    </div>
                    <p className="text-sm text-text-secondary">{p.desc}</p>
                    <a
                      href={p.policyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-purple underline hover:text-brand-purple/80 mt-1 inline-block transition-colors"
                    >
                      Ver Política de Privacidade →
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Todos esses parceiros têm políticas de privacidade próprias e são responsáveis pelo tratamento dos dados que recebem. Não permitimos que usem seus dados para fins além do serviço prestado ao FitQuest.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section id="armazenamento" className="scroll-mt-6">
            <SectionHeader num="06" title="Armazenamento e Transferência Internacional" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Seus dados são armazenados nos servidores do Supabase, que podem estar localizados nos Estados Unidos ou em outros países. Essas transferências são realizadas com garantias adequadas de segurança e em conformidade com a LGPD (Art. 33).
              </p>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são mantidos por <strong className="text-white">30 dias</strong> (para possibilitar a recuperação) e então excluídos permanentemente, exceto quando a retenção for exigida por lei.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section id="direitos" className="scroll-mt-6">
            <SectionHeader num="07" title="Seus Direitos como Titular (LGPD, Art. 18)" icon={<UserCheck size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { right: 'Confirmação e acesso', desc: 'Saber se tratamos seus dados e receber uma cópia' },
                  { right: 'Correção', desc: 'Solicitar correção de dados incompletos ou inexatos' },
                  { right: 'Anonimização ou bloqueio', desc: 'Para dados tratados com base em consentimento' },
                  { right: 'Portabilidade', desc: 'Receber seus dados em formato estruturado' },
                  { right: 'Eliminação', desc: 'Solicitar exclusão dos dados, sujeito a retenções legais' },
                  { right: 'Revogação do consentimento', desc: 'Retirar consentimento a qualquer momento' },
                  { right: 'Oposição', desc: 'Opor-se ao tratamento por legítimo interesse' },
                  { right: 'Informação', desc: 'Saber com quais entidades compartilhamos seus dados' },
                ].map((r) => (
                  <div key={r.right} className="card p-3 text-sm">
                    <div className="font-semibold text-white">{r.right}</div>
                    <div className="text-text-muted text-xs mt-0.5">{r.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Para exercer qualquer um desses direitos, envie um email para{' '}
                <a href="mailto:privacidade@fitquest.app" className="text-brand-purple underline hover:text-brand-purple/80 transition-colors">privacidade@fitquest.app</a>.
                Responderemos em até <strong className="text-white">15 dias úteis</strong>.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section id="cookies" className="scroll-mt-6">
            <SectionHeader num="08" title="Cookies e Tecnologias Similares" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                O FitQuest utiliza cookies <strong className="text-white">essenciais</strong> para manter sua sessão autenticada (via Supabase Auth). Não utilizamos cookies de rastreamento publicitário ou ferramentas de analytics de terceiros que identifiquem você pessoalmente.
              </p>
              <p>
                Você pode configurar seu navegador para recusar cookies, mas isso pode impedir o funcionamento correto do aplicativo, incluindo o login.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section id="seguranca" className="scroll-mt-6">
            <SectionHeader num="09" title="Segurança dos Dados" icon={<Lock size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <div className="space-y-2">
                {[
                  { icon: '🔒', item: 'Comunicações criptografadas via HTTPS/TLS' },
                  { icon: '🔑', item: 'Senhas armazenadas com hash bcrypt (nunca em texto puro)' },
                  { icon: '🛡️', item: 'Row Level Security (RLS) no banco de dados — cada usuário acessa apenas seus próprios dados' },
                  { icon: '🔐', item: 'Chaves de API e secrets nunca expostos no frontend' },
                  { icon: '🖥️', item: 'Acesso ao banco restrito via service role exclusivamente server-side' },
                ].map((s) => (
                  <div key={s.item} className="flex gap-3 items-center text-sm p-3 rounded-xl bg-bg-elevated">
                    <span className="text-lg shrink-0">{s.icon}</span>
                    {s.item}
                  </div>
                ))}
              </div>
              <p className="text-sm">
                Em caso de incidente de segurança que afete seus dados, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section id="criancas" className="scroll-mt-6">
            <SectionHeader num="10" title="Crianças e Adolescentes" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                O FitQuest é destinado exclusivamente a <strong className="text-white">maiores de 18 anos</strong>. Não coletamos conscientemente dados de menores de idade. Se identificarmos que um menor criou uma conta, excluiremos os dados imediatamente.
              </p>
              <p className="text-sm">
                Se você acredita que um menor forneceu dados ao FitQuest, entre em contato pelo email de privacidade.
              </p>
            </div>
          </section>

          {/* 11 */}
          <section id="dpo" className="scroll-mt-6">
            <SectionHeader num="11" title="Encarregado de Proteção de Dados (DPO)" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Nos termos da LGPD (Art. 41), o responsável pelo tratamento de dados pessoais do FitQuest pode ser contactado em:
              </p>
              <div className="card p-4 space-y-2">
                <p className="font-bold text-white">DPO — FitQuest</p>
                <p>Email: <a href="mailto:privacidade@fitquest.app" className="text-brand-purple underline hover:text-brand-purple/80 transition-colors">privacidade@fitquest.app</a></p>
                <p className="text-xs text-text-muted">Prazo de resposta: até 15 dias úteis</p>
              </div>
            </div>
          </section>

          {/* 12 */}
          <section id="mudancas" className="scroll-mt-6">
            <SectionHeader num="12" title="Mudanças nesta Política" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Podemos atualizar esta Política periodicamente. Mudanças significativas serão comunicadas por email com antecedência mínima de <strong className="text-white">15 dias</strong>.
              </p>
              <p>
                O uso continuado do serviço após a data de vigência implica aceitação da nova política. A versão mais recente estará sempre disponível nesta página.
              </p>
            </div>
          </section>

          {/* 13 */}
          <section id="contato" className="scroll-mt-6">
            <SectionHeader num="13" title="Contato" icon={<Mail size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>Para qualquer questão relacionada a privacidade, proteção de dados ou exercício dos seus direitos:</p>
              <div className="card p-5 space-y-2">
                <p className="font-bold text-white text-lg">🛡️ FitQuest — Privacidade</p>
                <p>Email: <a href="mailto:privacidade@fitquest.app" className="text-brand-purple underline hover:text-brand-purple/80 transition-colors">privacidade@fitquest.app</a></p>
                <p className="text-xs text-text-muted">Respondemos em até 15 dias úteis conforme a LGPD</p>
              </div>
              <p className="text-sm">
                Você também pode registrar reclamações junto à <strong className="text-white">ANPD (Autoridade Nacional de Proteção de Dados)</strong> em gov.br/anpd.
              </p>
            </div>
          </section>

        </div>

        <hr className="border-white/10 my-10" />

        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">← Voltar ao início</Link>
          <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso →</Link>
        </div>
      </div>
    </main>
  )
}

function SectionHeader({ num, title, icon }: { num: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-xs text-brand-purple/60 font-bold shrink-0">{num}</span>
      <div
        className="h-px flex-1"
        style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.4) 0%, transparent 100%)' }}
      />
      <h2 className="text-lg font-bold flex items-center gap-2 shrink-0">
        {icon && <span className="text-brand-purple">{icon}</span>}
        {title}
      </h2>
    </div>
  )
}
