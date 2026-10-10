export function SiteFooter() {
  return (
    <footer className="bg-[var(--brand-dark)] text-white/80 py-12 text-sm">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        {/* Trust badges */}
        <div className="text-center border-b border-white/15 pb-6">
          <p className="font-bold text-white text-base tracking-wide">
            🔒 COMPRA SEGURA &nbsp;|&nbsp; 🛡️ AMBIENTE PROTEGIDO &nbsp;|&nbsp; 🚚 FRETE GRÁTIS
          </p>
          <p className="mt-3 max-w-3xl mx-auto text-white/75">
            Seus dados financeiros estão totalmente seguros. O processamento do pagamento é
            criptografado e certificado pelos maiores padrões de segurança online.
          </p>
        </div>

        {/* Company info */}
        <div className="text-center space-y-1 border-b border-white/15 pb-6">
          <p className="font-extrabold text-white text-lg">Sucupira Composta</p>
          <p>©️ 2025 – Todos os direitos reservados.</p>
          <p>MJA – CNPJ: 17.797.109/0001-02</p>
          <p>Rua Cinco, N 112, Jardim Lucinda, Itaquaquecetuba - SP, 08593-289</p>
        </div>

        {/* Useful links + customer service */}
        <div className="grid md:grid-cols-2 gap-6 border-b border-white/15 pb-6">
          <div className="text-center md:text-left">
            <p className="font-bold text-white mb-2">LINKS ÚTEIS:</p>
            <p className="space-x-2">
              <a href="#" className="hover:text-[var(--gold)]">Políticas de Privacidade</a>
              <span>|</span>
              <a href="#" className="hover:text-[var(--gold)]">Termos de Uso</a>
              <span>|</span>
              <a href="#" className="hover:text-[var(--gold)]">Políticas de Reembolso</a>
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="font-bold text-white mb-2">ATENDIMENTO AO CLIENTE:</p>
            <p>E-mail: contato@sucupiracompostaspt.com.br</p>
            <p>Horário: Segunda a Sexta, das 08h às 18h</p>
          </div>
        </div>

        {/* Legal disclaimers */}
        <div className="space-y-3 text-xs text-white/60 max-w-4xl mx-auto leading-relaxed">
          <p className="font-bold text-white/80 text-center">
            AVISOS LEGAIS E ISENÇÃO DE RESPONSABILIDADE:
          </p>
          <p>
            Este produto é 100% natural e isento de registro de acordo com a Resolução RDC nº
            240/2018 da Agência Nacional de Vigilância Sanitária (ANVISA).
          </p>
          <p>
            As informações e sugestões contidas neste site têm caráter meramente informativo e
            não substituem o aconselhamento, diagnóstico ou tratamento de profissionais de
            saúde. Os resultados podem variar de acordo com o organismo de cada pessoa.
          </p>
          <p>
            Este site não faz parte do site do Facebook ou da Meta Platforms, Inc. Além disso,
            este site NÃO é endossado pelo Facebook de forma alguma. FACEBOOK é uma marca
            comercial da META PLATFORMS, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
