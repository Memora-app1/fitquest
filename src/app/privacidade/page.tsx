import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade — FitQuest',
  description: 'Como o FitQuest coleta, usa e protege seus dados, em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto py-12 space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <Link href="/" className="inline-block heading-display text-2xl gradient-text">
            ⚡ FitQuest
          </Link>
          <h1 className="heading-display text-4xl">Política de Privacidade</h1>
          <p className="text-text-secondary text-sm">
            Última atualização: 23 de maio de 2026 · Em conformidade com a LGPD (Lei 13.709/2018)
          </p>
          <p className="text-text-secondary leading-relaxed">
            Esta Política descreve como o FitQuest coleta, utiliza, armazena e protege seus dados pessoais. Sua privacidade é fundamental para nós.
          </p>
        </div>

        <hr className="border-white/10" />

        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">1. Quem Somos (Controlador dos Dados)</h2>
          <p className="text-text-secondary leading-relaxed">
            O <strong className="text-white">FitQuest</strong> é o controlador dos seus dados pessoais, responsável pelas decisões sobre o tratamento dessas informações.
          </p>
          <div className="card p-4 space-y-1 text-text-secondary">
            <p><strong className="text-white">FitQuest</strong></p>
            <p>Email de contato: <a href="mailto:privacidade@fitquest.app" className="text-brand-orange underline">privacidade@fitquest.app</a></p>
            <p>Site: fitquest-app1.vercel.app</p>
          </div>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">2. Dados que Coletamos</h2>

          <h3 className="font-semibold text-white">2.1 Dados de Cadastro</h3>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li>Nome (fornecido no cadastro)</li>
            <li>Endereço de email</li>
            <li>Senha (armazenada em formato criptografado — nunca em texto puro)</li>
            <li>Data de criação da conta</li>
          </ul>

          <h3 className="font-semibold text-white">2.2 Dados de Uso do Aplicativo</h3>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li><strong>Fitness:</strong> hábitos registrados, frequência, histórico de treinos, exercícios, séries, pesos e recordes pessoais</li>
            <li><strong>Produtividade:</strong> tarefas criadas, listas, status (pendente/em andamento/concluído), datas e prioridades</li>
            <li><strong>Finanças:</strong> contas bancárias (nome e saldo), categorias de gastos, transações (valor, descrição, data), metas financeiras</li>
            <li><strong>Gamificação:</strong> XP acumulado, nível, streak de dias ativos, conquistas desbloqueadas</li>
          </ul>

          <h3 className="font-semibold text-white">2.3 Dados de Pagamento</h3>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest <strong className="text-white">não armazena dados de cartão de crédito</strong>. Os pagamentos são processados integralmente pela <strong className="text-white">Stripe</strong> (stripe.com). Recebemos apenas confirmações de pagamento e identificadores de assinatura.
          </p>

          <h3 className="font-semibold text-white">2.4 Coach IA (Dados de Conversas)</h3>
          <p className="text-text-secondary leading-relaxed">
            As conversas com o Coach IA são processadas pela <strong className="text-white">Anthropic</strong> (anthropic.com) e armazenadas em nosso banco de dados para histórico de contexto. O contexto enviado à Anthropic inclui seus dados de hábitos, tarefas e finanças para personalizar as respostas.
          </p>

          <h3 className="font-semibold text-white">2.5 Dados Técnicos</h3>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li>Endereço IP (para segurança e prevenção de fraudes)</li>
            <li>Tipo de dispositivo e navegador</li>
            <li>Logs de acesso (datas e horários de login)</li>
            <li>Dados de notificações push (se habilitadas)</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">3. Finalidades do Tratamento</h2>
          <p className="text-text-secondary leading-relaxed">Utilizamos seus dados para:</p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li>Criar e gerenciar sua conta de usuário</li>
            <li>Fornecer todas as funcionalidades do FitQuest (hábitos, tarefas, finanças, coach IA)</li>
            <li>Processar pagamentos e gerenciar sua assinatura</li>
            <li>Enviar notificações de lembretes e conquistas (com seu consentimento)</li>
            <li>Personalizar a experiência de gamificação (XP, nível, streak)</li>
            <li>Detectar e prevenir fraudes e acessos não autorizados</li>
            <li>Cumprir obrigações legais e regulatórias</li>
            <li>Melhorar o serviço com base em dados agregados e anonimizados</li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            <strong className="text-white">Não utilizamos</strong> seus dados para publicidade de terceiros ou para vender informações a outras empresas.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">4. Base Legal (LGPD, Art. 7º)</h2>
          <p className="text-text-secondary leading-relaxed">O tratamento dos seus dados se baseia em:</p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li><strong className="text-white">Execução de contrato</strong> (Art. 7º, V) — para fornecer o serviço contratado</li>
            <li><strong className="text-white">Consentimento</strong> (Art. 7º, I) — para notificações push e personalização via Coach IA</li>
            <li><strong className="text-white">Legítimo interesse</strong> (Art. 7º, IX) — para segurança, prevenção de fraudes e melhoria do serviço</li>
            <li><strong className="text-white">Obrigação legal</strong> (Art. 7º, II) — para cumprir exigências fiscais e regulatórias</li>
          </ul>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">5. Compartilhamento com Terceiros</h2>
          <p className="text-text-secondary leading-relaxed">
            Compartilhamos dados apenas com os seguintes parceiros, estritamente necessários para o funcionamento do serviço:
          </p>
          <div className="space-y-3">
            <div className="card p-4">
              <p className="font-medium text-white">Supabase (supabase.com)</p>
              <p className="text-text-secondary text-sm">Banco de dados, autenticação e armazenamento. Dados podem ser processados em servidores nos EUA. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Política de Privacidade</a></p>
            </div>
            <div className="card p-4">
              <p className="font-medium text-white">Vercel (vercel.com)</p>
              <p className="text-text-secondary text-sm">Hospedagem e infraestrutura do aplicativo. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Política de Privacidade</a></p>
            </div>
            <div className="card p-4">
              <p className="font-medium text-white">Stripe (stripe.com)</p>
              <p className="text-text-secondary text-sm">Processamento de pagamentos. Recebem email e dados de pagamento para processar assinaturas. <a href="https://stripe.com/br/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Política de Privacidade</a></p>
            </div>
            <div className="card p-4">
              <p className="font-medium text-white">Anthropic (anthropic.com)</p>
              <p className="text-text-secondary text-sm">Processamento das conversas com o Coach IA. Dados de contexto são enviados para gerar respostas personalizadas. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Política de Privacidade</a></p>
            </div>
            <div className="card p-4">
              <p className="font-medium text-white">Google (google.com) — Opcional</p>
              <p className="text-text-secondary text-sm">Sincronização com Google Agenda, apenas se você ativar essa integração. Dados de calendário são acessados com sua permissão explícita. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Política de Privacidade</a></p>
            </div>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Todos esses parceiros têm políticas de privacidade próprias e são responsáveis pelo tratamento dos dados que recebem. Não permitimos que usem seus dados para fins além do serviço prestado ao FitQuest.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">6. Armazenamento e Transferência Internacional</h2>
          <p className="text-text-secondary leading-relaxed">
            Seus dados são armazenados nos servidores do Supabase, que podem estar localizados nos Estados Unidos ou em outros países. Essas transferências são realizadas com garantias adequadas de segurança e em conformidade com a LGPD (Art. 33).
          </p>
          <p className="text-text-secondary leading-relaxed">
            Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são mantidos por 30 dias e então excluídos permanentemente, exceto quando a retenção for exigida por lei.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">7. Seus Direitos como Titular (LGPD, Art. 18)</h2>
          <p className="text-text-secondary leading-relaxed">
            Você tem os seguintes direitos em relação aos seus dados pessoais:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary pl-4">
            <li><strong className="text-white">Confirmação e acesso:</strong> saber se tratamos seus dados e receber uma cópia</li>
            <li><strong className="text-white">Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
            <li><strong className="text-white">Anonimização ou bloqueio:</strong> para dados tratados com base em consentimento</li>
            <li><strong className="text-white">Portabilidade:</strong> receber seus dados em formato estruturado e legível por máquina</li>
            <li><strong className="text-white">Eliminação:</strong> solicitar a exclusão dos seus dados, sujeito às obrigações legais de retenção</li>
            <li><strong className="text-white">Revogação do consentimento:</strong> retirar o consentimento a qualquer momento, sem prejuízo do tratamento anterior</li>
            <li><strong className="text-white">Oposição:</strong> se opor ao tratamento realizado com base em legítimo interesse</li>
            <li><strong className="text-white">Informação:</strong> saber com quais entidades compartilhamos seus dados</li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            Para exercer qualquer um desses direitos, envie um email para <a href="mailto:privacidade@fitquest.app" className="text-brand-orange underline">privacidade@fitquest.app</a>. Responderemos em até 15 dias úteis.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">8. Cookies e Tecnologias Similares</h2>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest utiliza cookies essenciais para manter sua sessão autenticada (via Supabase Auth). Não utilizamos cookies de rastreamento publicitário ou ferramentas de analytics de terceiros que identifiquem você pessoalmente.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Você pode configurar seu navegador para recusar cookies, mas isso pode impedir o funcionamento correto do aplicativo, incluindo o login.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">9. Segurança dos Dados</h2>
          <p className="text-text-secondary leading-relaxed">
            Adotamos medidas técnicas e organizacionais para proteger seus dados:
          </p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-4">
            <li>Comunicações criptografadas via HTTPS/TLS</li>
            <li>Senhas armazenadas com hash bcrypt (nunca em texto puro)</li>
            <li>Row Level Security (RLS) no banco de dados — cada usuário acessa apenas seus próprios dados</li>
            <li>Chaves de API e secrets nunca expostos no frontend</li>
            <li>Acesso ao banco de dados restrito via service role server-side</li>
          </ul>
          <p className="text-text-secondary leading-relaxed">
            Em caso de incidente de segurança que afete seus dados, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">10. Crianças e Adolescentes</h2>
          <p className="text-text-secondary leading-relaxed">
            O FitQuest é destinado exclusivamente a <strong className="text-white">maiores de 18 anos</strong>. Não coletamos conscientemente dados de menores de idade. Se identificarmos que um menor criou uma conta, excluiremos os dados imediatamente.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Se você acredita que um menor forneceu dados ao FitQuest, entre em contato pelo email de privacidade.
          </p>
        </section>

        {/* 11 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">11. Encarregado de Proteção de Dados (DPO)</h2>
          <p className="text-text-secondary leading-relaxed">
            Nos termos da LGPD (Art. 41), o responsável pelo tratamento de dados pessoais do FitQuest pode ser contactado em:
          </p>
          <div className="card p-4 space-y-1 text-text-secondary">
            <p><strong className="text-white">DPO — FitQuest</strong></p>
            <p>Email: <a href="mailto:privacidade@fitquest.app" className="text-brand-orange underline">privacidade@fitquest.app</a></p>
            <p className="text-sm text-text-muted">Prazo de resposta: até 15 dias úteis</p>
          </div>
        </section>

        {/* 12 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">12. Mudanças nesta Política</h2>
          <p className="text-text-secondary leading-relaxed">
            Podemos atualizar esta Política de Privacidade periodicamente. Mudanças significativas serão comunicadas por email com antecedência mínima de <strong className="text-white">15 dias</strong>. O uso continuado do serviço após a data de vigência implica aceitação da nova política.
          </p>
          <p className="text-text-secondary leading-relaxed">
            A versão mais recente estará sempre disponível nesta página com a data de última atualização.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-brand-orange">13. Contato</h2>
          <p className="text-text-secondary leading-relaxed">
            Para qualquer questão relacionada a privacidade, proteção de dados ou exercício dos seus direitos:
          </p>
          <div className="card p-4 space-y-1 text-text-secondary">
            <p><strong className="text-white">FitQuest — Privacidade</strong></p>
            <p>Email: <a href="mailto:privacidade@fitquest.app" className="text-brand-orange underline">privacidade@fitquest.app</a></p>
            <p className="text-sm text-text-muted">Respondemos em até 15 dias úteis conforme a LGPD</p>
          </div>
          <p className="text-text-secondary leading-relaxed text-sm">
            Você também pode registrar reclamações junto à <strong className="text-white">ANPD (Autoridade Nacional de Proteção de Dados)</strong> em gov.br/anpd.
          </p>
        </section>

        <hr className="border-white/10" />

        <div className="flex gap-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">← Voltar ao início</Link>
          <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso →</Link>
        </div>
      </div>
    </main>
  )
}
