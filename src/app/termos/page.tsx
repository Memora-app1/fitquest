import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso — FitQuest',
  description: 'Termos e condições de uso do FitQuest.',
}

export default function TermosPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto py-12 space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <Link href="/" className="inline-block heading-display text-2xl gradient-text">
            ⚡ FitQuest
          </Link>
          <h1 className="heading-display text-4xl">Termos de Uso</h1>
          <p className="text-text-secondary text-sm">
            Última atualização: 23 de maio de 2026
          </p>
          <p className="text-text-secondary">
            Leia com atenção antes de criar sua conta. Ao utilizar o FitQuest, você concorda com estes termos.
          </p>
        </div>

        <hr className="border-white/10" />

        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">1. Aceitação dos Termos</h2>
          <p className="text-text-secondary leading-relaxed">
            Ao acessar ou utilizar o FitQuest — disponível em fitquest-app1.vercel.app e domínios associados — você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa{' '}
            <Link href="/privacidade" className="text-brand-orange underline">Política de Privacidade</Link>.
            Se não concordar com qualquer parte destes termos, não utilize o serviço.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Estes termos constituem um contrato legal entre você (&ldquo;Usuário&rdquo;) e o FitQuest (&ldquo;nós&rdquo;, &ldquo;nos&rdquo; ou &ldquo;nosso&rdquo;), regido pelas leis da República Federativa do Brasil.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">2. Descrição do Serviço</h2>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest é um sistema de gestão de vida gamificado (&ldquo;Life OS&rdquo;) que integra em uma única plataforma:
          </p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li><strong className="text-white">Fitness:</strong> registro de hábitos saudáveis, treinos com séries/repetições e recordes pessoais</li>
            <li><strong className="text-white">Produtividade:</strong> gerenciamento de tarefas em Kanban e Matriz Eisenhower</li>
            <li><strong className="text-white">Finanças:</strong> controle de transações, contas e metas financeiras</li>
            <li><strong className="text-white">Coach IA:</strong> assistente de inteligência artificial contextualizado com seus dados, desenvolvido com tecnologia da Anthropic</li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            O sistema de gamificação atribui XP (pontos de experiência) por cada ação completada, evoluindo seu nível e desbloqueando conquistas. O FitQuest é fornecido &ldquo;como está&rdquo; e pode ser alterado, atualizado ou descontinuado a qualquer momento, com aviso prévio de 30 dias nos casos de descontinuação.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">3. Cadastro e Conta</h2>
          <p className="text-text-secondary leading-relaxed">
            Para utilizar o FitQuest, você deve:
          </p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li>Ter no mínimo <strong className="text-white">18 anos</strong> de idade</li>
            <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
            <li>Manter um endereço de email válido e acessível</li>
            <li>Manter a confidencialidade da sua senha</li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            Você é responsável por todas as atividades realizadas em sua conta. Notifique-nos imediatamente em caso de acesso não autorizado. Reservamo-nos o direito de encerrar contas que violem estes termos ou que contenham informações falsas.
          </p>
          <p className="text-text-secondary leading-relaxed">
            É permitida apenas uma conta por pessoa. A criação de contas falsas, múltiplas contas para circumventar restrições ou contas em nome de terceiros sem autorização é proibida.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">4. Planos e Pagamentos</h2>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest oferece os seguintes planos pagos, com preços em Reais (BRL):
          </p>
          <div className="card p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Mensal</span>
              <span className="text-brand-orange font-bold">R$ 37,00/mês</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Anual</span>
              <span className="text-brand-orange font-bold">R$ 306,60/ano (R$ 25,55/mês)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Vitalício</span>
              <span className="text-brand-orange font-bold">R$ 597,00 (pagamento único)</span>
            </div>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Os pagamentos são processados pela <strong className="text-white">Stripe</strong>, plataforma de pagamentos segura. Aceitamos cartão de crédito e outros métodos disponibilizados pela Stripe. O FitQuest não armazena dados de cartão — eles ficam exclusivamente com a Stripe.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Os planos mensais e anuais são cobrados automaticamente na data de renovação. O plano vitalício é uma compra única sem cobranças futuras. Os preços podem ser alterados com aviso prévio de 30 dias por email.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">5. Trial de 7 Dias e Cancelamento</h2>
          <p className="text-text-secondary leading-relaxed">
            Todo novo usuário recebe <strong className="text-white">7 dias de acesso gratuito</strong> a todas as funcionalidades do FitQuest. Após o período de trial, é necessário assinar um dos planos para continuar acessando.
          </p>
          <p className="text-text-secondary leading-relaxed">
            O cancelamento pode ser realizado a qualquer momento. Após o cancelamento, você mantém o acesso até o fim do período já pago. Não há cobrança de multa ou taxa de cancelamento. Para cancelar, entre em contato pelo email de suporte ou acesse as configurações da conta.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">6. Reembolsos</h2>
          <p className="text-text-secondary leading-relaxed">
            Em conformidade com o <strong className="text-white">Código de Defesa do Consumidor (Lei 8.078/90), Art. 49</strong>, compras realizadas pela internet têm direito a arrependimento e reembolso integral em até <strong className="text-white">7 dias corridos</strong> a partir da data da compra, sem necessidade de justificativa.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Para solicitar reembolso, envie um email para nosso suporte com o assunto &ldquo;Reembolso&rdquo; e o email da conta. O estorno é processado em até 7 dias úteis, dependendo do método de pagamento.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Após o período de 7 dias, não realizamos reembolsos proporcionais por cancelamento antecipado, exceto em caso de falha comprovada do serviço por períodos superiores a 24 horas.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">7. Direitos de Uso e Propriedade Intelectual</h2>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest concede a você uma licença limitada, não exclusiva, não transferível e revogável para usar o serviço para fins pessoais e não comerciais.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Todo o conteúdo do FitQuest — incluindo design, código, textos, logotipos, algoritmos de gamificação e sistema de IA — é de propriedade exclusiva do FitQuest ou de seus licenciantes e está protegido por leis de propriedade intelectual brasileiras e internacionais.
          </p>
          <p className="text-text-secondary leading-relaxed">
            É expressamente proibido: reproduzir, distribuir, modificar, criar obras derivadas, revender, sublicenciar ou explorar comercialmente qualquer parte do serviço sem autorização prévia por escrito.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">8. Conteúdo do Usuário</h2>
          <p className="text-text-secondary leading-relaxed">
            Todos os dados inseridos por você no FitQuest — incluindo hábitos, treinos, tarefas, transações financeiras, metas e conversas com o Coach IA — são de sua propriedade.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Ao usar o serviço, você nos concede uma licença limitada para processar e armazenar seus dados com a única finalidade de fornecer o serviço contratado. Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais, exceto conforme descrito na Política de Privacidade.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Você pode exportar ou solicitar a exclusão dos seus dados a qualquer momento, conforme seus direitos descritos na Política de Privacidade.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">9. Uso Aceitável</h2>
          <p className="text-text-secondary leading-relaxed">É <strong className="text-white">proibido</strong> utilizar o FitQuest para:</p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li>Realizar engenharia reversa, descompilar ou extrair o código-fonte</li>
            <li>Tentar obter acesso não autorizado a sistemas ou dados de outros usuários</li>
            <li>Enviar, armazenar ou transmitir conteúdo ilegal, abusivo ou difamatório</li>
            <li>Utilizar bots, scrapers ou automações para acessar o serviço</li>
            <li>Revender, sublicenciar ou oferecer o acesso a terceiros</li>
            <li>Sobrecarregar intencionalmente a infraestrutura do serviço</li>
            <li>Criar contas falsas ou se passar por outras pessoas</li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            Violações podem resultar em suspensão ou encerramento imediato da conta, sem direito a reembolso.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">10. Limitação de Responsabilidade</h2>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest é uma ferramenta de suporte à organização pessoal e não substitui orientação médica, nutricional, financeira ou psicológica profissional. As informações e funcionalidades do Coach IA são para fins informativos e motivacionais.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Na máxima extensão permitida por lei, o FitQuest não se responsabiliza por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso ou impossibilidade de uso do serviço. Nossa responsabilidade total não excederá o valor pago pelo usuário nos últimos 3 meses.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Não garantimos que o serviço estará disponível ininterruptamente. Realizamos manutenções programadas com aviso prévio e nos esforçamos para atingir 99,5% de uptime mensal.
          </p>
        </section>

        {/* 11 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">11. Suspensão e Encerramento</h2>
          <p className="text-text-secondary leading-relaxed">
            Podemos suspender ou encerrar sua conta imediatamente em caso de: violação destes termos, atividade fraudulenta, uso abusivo ou solicitação de autoridade competente.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Você pode encerrar sua conta a qualquer momento. Após o encerramento, seus dados serão mantidos por 30 dias (para possibilitar a recuperação) e então excluídos permanentemente, conforme nossa Política de Privacidade.
          </p>
        </section>

        {/* 12 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">12. Modificações dos Termos</h2>
          <p className="text-text-secondary leading-relaxed">
            Podemos atualizar estes Termos de Uso periodicamente. Mudanças significativas serão comunicadas por email com pelo menos <strong className="text-white">15 dias de antecedência</strong>. O uso continuado do serviço após essa data implica aceitação dos novos termos.
          </p>
          <p className="text-text-secondary leading-relaxed">
            A data da última atualização está sempre indicada no início deste documento.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">13. Lei Aplicável e Foro</h2>
          <p className="text-text-secondary leading-relaxed">
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Para resolução de conflitos, fica eleito o foro da comarca de <strong className="text-white">São Paulo/SP</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Tentaremos sempre resolver disputas de forma amigável antes de qualquer medida judicial.
          </p>
        </section>

        {/* 14 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">14. Contato</h2>
          <p className="text-text-secondary leading-relaxed">
            Para dúvidas, sugestões ou solicitações relacionadas a estes Termos:
          </p>
          <div className="card p-4 space-y-1 text-text-secondary">
            <p><strong className="text-white">FitQuest</strong></p>
            <p>Email: <a href="mailto:suporte@fitquest.app" className="text-brand-orange underline">suporte@fitquest.app</a></p>
            <p>Site: fitquest-app1.vercel.app</p>
          </div>
        </section>

        <hr className="border-white/10" />

        <div className="flex gap-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">← Voltar ao início</Link>
          <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade →</Link>
        </div>
      </div>
    </main>
  )
}
