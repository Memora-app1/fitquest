import Link from 'next/link'
import { Shield, FileText, CreditCard, RefreshCw, AlertTriangle, Scale, Mail } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — Ascendia',
  description: 'Termos e condições de uso do Ascendia.',
}

const SECTIONS = [
  { id: 'aceitacao', num: '01', title: 'Aceitação dos Termos' },
  { id: 'servico', num: '02', title: 'Descrição do Serviço' },
  { id: 'cadastro', num: '03', title: 'Cadastro e Conta' },
  { id: 'pagamentos', num: '04', title: 'Planos e Pagamentos' },
  { id: 'trial', num: '05', title: 'Trial e Cancelamento' },
  { id: 'reembolsos', num: '06', title: 'Reembolsos' },
  { id: 'propriedade', num: '07', title: 'Propriedade Intelectual' },
  { id: 'conteudo', num: '08', title: 'Conteúdo do Usuário' },
  { id: 'uso', num: '09', title: 'Uso Aceitável' },
  { id: 'responsabilidade', num: '10', title: 'Limitação de Responsabilidade' },
  { id: 'suspensao', num: '11', title: 'Suspensão e Encerramento' },
  { id: 'modificacoes', num: '12', title: 'Modificações dos Termos' },
  { id: 'lei', num: '13', title: 'Lei Aplicável e Foro' },
  { id: 'contato', num: '14', title: 'Contato' },
]

export default function TermosPage() {
  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <div
        className="relative py-16 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050914 0%, #0D1829 100%)' }}
      >
        {/* Decorative glows */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-orange/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-purple/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <Link href="/" className="inline-block heading-display text-2xl gradient-text mb-6">
            ⚡ Ascendia
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-brand-orange" />
            </div>
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Termos de Uso</h1>
              <p className="text-text-secondary mt-2">
                Última atualização: <strong className="text-white">23 de maio de 2026</strong>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-brand-purple/20 bg-brand-purple/5 text-sm text-text-secondary leading-relaxed">
            <span className="text-white font-semibold">Leia com atenção.</span>{' '}
            Ao utilizar o Ascendia, você concorda com estes termos. Se não concordar, não utilize o serviço.
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Table of contents */}
        <div
          className="p-5 mb-10 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Índice</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-orange transition-colors py-1 group"
              >
                <span className="font-mono text-[10px] text-text-muted group-hover:text-brand-orange/60">{s.num}</span>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-12">

          {/* 1 */}
          <section id="aceitacao" className="scroll-mt-6">
            <SectionHeader num="01" title="Aceitação dos Termos" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Ao acessar ou utilizar o Ascendia — disponível em <span className="text-white">ascendia-app1.vercel.app</span> e domínios associados — você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa{' '}
                <Link href="/privacidade" className="text-brand-orange underline hover:text-brand-orange/80 transition-colors">Política de Privacidade</Link>.
              </p>
              <p>
                Estes termos constituem um contrato legal entre você (&ldquo;Usuário&rdquo;) e o Ascendia (&ldquo;nós&rdquo;, &ldquo;nos&rdquo; ou &ldquo;nosso&rdquo;), regido pelas leis da República Federativa do Brasil.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section id="servico" className="scroll-mt-6">
            <SectionHeader num="02" title="Descrição do Serviço" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>O Ascendia é um sistema de gestão de vida gamificado (&ldquo;Life OS&rdquo;) que integra em uma única plataforma:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                {[
                  { emoji: '💪', title: 'Fitness', desc: 'Hábitos, treinos com séries/repetições e recordes pessoais' },
                  { emoji: '✅', title: 'Produtividade', desc: 'Tarefas em Kanban e Matriz Eisenhower' },
                  { emoji: '💰', title: 'Finanças', desc: 'Controle de transações, contas e metas financeiras' },
                  { emoji: '🤖', title: 'Coach IA', desc: 'Assistente contextualizado, desenvolvido com tecnologia Anthropic' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-3 flex gap-3 items-start rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{item.title}</div>
                      <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p>
                O sistema de gamificação atribui XP (pontos de experiência) por cada ação completada, evoluindo seu nível e desbloqueando conquistas. O Ascendia é fornecido &ldquo;como está&rdquo; e pode ser alterado, atualizado ou descontinuado a qualquer momento, com aviso prévio de 30 dias nos casos de descontinuação.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section id="cadastro" className="scroll-mt-6">
            <SectionHeader num="03" title="Cadastro e Conta" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>Para utilizar o Ascendia, você deve:</p>
              <ul className="space-y-2 pl-4">
                {[
                  'Ter no mínimo 18 anos de idade',
                  'Fornecer informações verdadeiras, precisas e atualizadas',
                  'Manter um endereço de email válido e acessível',
                  'Manter a confidencialidade da sua senha',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brand-orange mt-1 shrink-0">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Você é responsável por todas as atividades realizadas em sua conta. Notifique-nos imediatamente em caso de acesso não autorizado. É permitida apenas uma conta por pessoa.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section id="pagamentos" className="scroll-mt-6">
            <SectionHeader num="04" title="Planos e Pagamentos" icon={<CreditCard size={18} />} />
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>O Ascendia oferece os seguintes planos pagos, com preços em Reais (BRL):</p>

              {/* Pricing table */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="grid grid-cols-3 text-center">
                  <div className="p-4 border-r border-border border-b">
                    <div className="text-sm font-semibold text-white">Mensal</div>
                    <div className="heading-display text-2xl text-brand-orange mt-1">R$ 37</div>
                    <div className="text-xs text-text-muted">por mês</div>
                  </div>
                  <div className="p-4 border-r border-border border-b relative bg-brand-purple/5">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-brand-purple text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                      MAIS POPULAR
                    </div>
                    <div className="text-sm font-semibold text-white">Anual</div>
                    <div className="heading-display text-2xl text-brand-purple mt-1">R$ 25,55</div>
                    <div className="text-xs text-text-muted">por mês · R$ 306,60/ano</div>
                  </div>
                  <div className="p-4 border-b">
                    <div className="text-sm font-semibold text-white">Vitalício</div>
                    <div className="heading-display text-2xl text-brand-gold mt-1">R$ 597</div>
                    <div className="text-xs text-text-muted">pagamento único</div>
                  </div>
                </div>
                <div className="p-4 bg-bg text-xs text-text-muted text-center">
                  Planos mensais e anuais são cobrados automaticamente na data de renovação.
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-brand-green/5 border border-brand-green/20">
                <Shield size={18} className="text-brand-green shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Os pagamentos são processados pelo <strong className="text-white">Stripe</strong>, plataforma de pagamentos segura e líder mundial certificada por PCI DSS. O Ascendia não armazena dados de cartão — eles ficam exclusivamente com o Stripe. Aceitamos cartão de crédito, débito e Pix conforme disponibilidade.
                </p>
              </div>

              <p>Os preços podem ser alterados com aviso prévio de 30 dias por email.</p>
            </div>
          </section>

          {/* 5 */}
          <section id="trial" className="scroll-mt-6">
            <SectionHeader num="05" title="Trial de 7 Dias e Cancelamento" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <div className="p-4 rounded-xl bg-brand-orange/5 border border-brand-orange/20">
                <p className="text-white font-semibold">🎁 7 dias grátis</p>
                <p className="text-sm mt-1 text-text-secondary">
                  Todo novo usuário recebe 7 dias de acesso gratuito a todas as funcionalidades. Após o período, é necessário assinar um plano para continuar.
                </p>
              </div>
              <p>
                O cancelamento pode ser realizado a qualquer momento. Após o cancelamento, você mantém o acesso até o fim do período já pago. <strong className="text-white">Não há cobrança de multa ou taxa de cancelamento.</strong>
              </p>
            </div>
          </section>

          {/* 6 */}
          <section id="reembolsos" className="scroll-mt-6">
            <SectionHeader num="06" title="Reembolsos" icon={<RefreshCw size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <div className="p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/20">
                <p className="font-semibold text-white">⚖️ Direito de Arrependimento — CDC Art. 49</p>
                <p className="text-sm mt-1">
                  Compras realizadas pela internet têm direito a reembolso integral em até <strong className="text-white">7 dias corridos</strong> a partir da data da compra, sem necessidade de justificativa.
                </p>
              </div>
              <p>
                Para solicitar reembolso, envie um email para nosso suporte com o assunto &ldquo;Reembolso&rdquo; e o email da conta. O estorno é processado em até 7 dias úteis, dependendo do método de pagamento.
              </p>
              <p>
                Após o período de 7 dias, não realizamos reembolsos proporcionais por cancelamento antecipado, exceto em caso de falha comprovada do serviço por períodos superiores a 24 horas.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section id="propriedade" className="scroll-mt-6">
            <SectionHeader num="07" title="Direitos de Uso e Propriedade Intelectual" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                O Ascendia concede a você uma licença limitada, não exclusiva, não transferível e revogável para usar o serviço para fins pessoais e não comerciais.
              </p>
              <p>
                Todo o conteúdo do Ascendia — incluindo design, código, textos, logotipos, algoritmos de gamificação e sistema de IA — é de propriedade exclusiva do Ascendia ou de seus licenciantes, protegido por leis de propriedade intelectual brasileiras e internacionais.
              </p>
              <div className="flex gap-3 p-4 rounded-xl bg-brand-red/5 border border-brand-red/20">
                <AlertTriangle size={18} className="text-brand-red shrink-0 mt-0.5" />
                <p className="text-sm">
                  É expressamente <strong className="text-white">proibido</strong> reproduzir, distribuir, modificar, revender ou explorar comercialmente qualquer parte do serviço sem autorização prévia por escrito.
                </p>
              </div>
            </div>
          </section>

          {/* 8 */}
          <section id="conteudo" className="scroll-mt-6">
            <SectionHeader num="08" title="Conteúdo do Usuário" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Todos os dados inseridos por você — hábitos, treinos, tarefas, transações financeiras, metas e conversas com o Coach IA — são de <strong className="text-white">sua propriedade</strong>.
              </p>
              <p>
                Ao usar o serviço, você nos concede uma licença limitada para processar e armazenar seus dados com a única finalidade de fornecer o serviço contratado. Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais.
              </p>
              <p>
                Você pode exportar ou solicitar a exclusão dos seus dados a qualquer momento, conforme seus direitos descritos na Política de Privacidade.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section id="uso" className="scroll-mt-6">
            <SectionHeader num="09" title="Uso Aceitável" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>É <strong className="text-white">proibido</strong> utilizar o Ascendia para:</p>
              <ul className="space-y-2 pl-4">
                {[
                  'Realizar engenharia reversa, descompilar ou extrair o código-fonte',
                  'Tentar obter acesso não autorizado a sistemas ou dados de outros usuários',
                  'Enviar, armazenar ou transmitir conteúdo ilegal, abusivo ou difamatório',
                  'Utilizar bots, scrapers ou automações para acessar o serviço',
                  'Revender, sublicenciar ou oferecer o acesso a terceiros',
                  'Sobrecarregar intencionalmente a infraestrutura do serviço',
                  'Criar contas falsas ou se passar por outras pessoas',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brand-red mt-1 shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm">
                Violações podem resultar em suspensão ou encerramento imediato da conta, sem direito a reembolso.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section id="responsabilidade" className="scroll-mt-6">
            <SectionHeader num="10" title="Limitação de Responsabilidade" icon={<AlertTriangle size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                O Ascendia é uma ferramenta de suporte à organização pessoal e <strong className="text-white">não substitui</strong> orientação médica, nutricional, financeira ou psicológica profissional. As informações do Coach IA são para fins informativos e motivacionais.
              </p>
              <p>
                Na máxima extensão permitida por lei, o Ascendia não se responsabiliza por danos indiretos, incidentais ou consequenciais. Nossa responsabilidade total não excederá o valor pago nos últimos 3 meses.
              </p>
              <p>
                Realizamos manutenções programadas com aviso prévio e nos esforçamos para atingir <strong className="text-white">99,5% de uptime mensal</strong>.
              </p>
            </div>
          </section>

          {/* 11 */}
          <section id="suspensao" className="scroll-mt-6">
            <SectionHeader num="11" title="Suspensão e Encerramento" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Podemos suspender ou encerrar sua conta imediatamente em caso de: violação destes termos, atividade fraudulenta, uso abusivo ou solicitação de autoridade competente.
              </p>
              <p>
                Você pode encerrar sua conta a qualquer momento. Após o encerramento, seus dados serão mantidos por <strong className="text-white">30 dias</strong> (para possibilitar a recuperação) e então excluídos permanentemente.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section id="modificacoes" className="scroll-mt-6">
            <SectionHeader num="12" title="Modificações dos Termos" />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Podemos atualizar estes Termos periodicamente. Mudanças significativas serão comunicadas por email com pelo menos <strong className="text-white">15 dias de antecedência</strong>.
              </p>
              <p>
                O uso continuado do serviço após a data de vigência implica aceitação dos novos termos. A data da última atualização está sempre indicada no início deste documento.
              </p>
            </div>
          </section>

          {/* 13 */}
          <section id="lei" className="scroll-mt-6">
            <SectionHeader num="13" title="Lei Aplicável e Foro" icon={<Scale size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Para resolução de conflitos, fica eleito o foro da comarca de <strong className="text-white">São Paulo/SP</strong>, com renúncia a qualquer outro, por mais privilegiado que seja.
              </p>
              <p>
                Tentaremos sempre resolver disputas de forma amigável antes de qualquer medida judicial.
              </p>
            </div>
          </section>

          {/* 14 */}
          <section id="contato" className="scroll-mt-6">
            <SectionHeader num="14" title="Contato" icon={<Mail size={18} />} />
            <div className="space-y-3 text-text-secondary leading-relaxed">
              <p>Para dúvidas, sugestões ou solicitações relacionadas a estes Termos:</p>
              <div
                className="p-5 space-y-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
                  border: '1px solid rgba(255,77,0,0.25)',
                }}
              >
                <p className="text-white font-bold text-lg">⚡ Ascendia</p>
                <p>
                  Email:{' '}
                  <a href="mailto:suporte@ascendia.app" className="text-brand-orange underline hover:text-brand-orange/80 transition-colors">
                    suporte@ascendia.app
                  </a>
                </p>
                <p>Site: ascendia-app1.vercel.app</p>
                <p className="text-text-muted text-xs">Respondemos em até 2 dias úteis.</p>
              </div>
            </div>
          </section>

        </div>

        <hr className="border-white/10 my-10" />

        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            ← Voltar ao início
          </Link>
          <Link href="/privacidade" className="hover:text-white transition-colors flex items-center gap-1">
            Política de Privacidade →
          </Link>
        </div>
      </div>
    </main>
  )
}

function SectionHeader({ num, title, icon }: { num: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-xs text-brand-orange/60 font-bold shrink-0">{num}</span>
      <div
        className="h-px flex-1"
        style={{ background: 'linear-gradient(90deg, rgba(255,77,0,0.4) 0%, transparent 100%)' }}
      />
      <h2 className="text-lg font-bold flex items-center gap-2 shrink-0">
        {icon && <span className="text-brand-orange">{icon}</span>}
        {title}
      </h2>
    </div>
  )
}
