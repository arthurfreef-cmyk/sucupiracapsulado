
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckCircle2, Package, Truck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pedido Confirmado — Sucupira Composta" },
      { name: "description", content: "Obrigado por sua compra! Seu pedido foi recebido com sucesso." },
      { property: "og:title", content: "Pedido Confirmado — Sucupira Composta" },
      { property: "og:description", content: "Obrigado por sua compra! Seu pedido foi recebido com sucesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b p-4 text-center font-bold text-[var(--brand)]">
        Sucupira Composta
      </header>
      
      <main className="container mx-auto max-w-2xl p-4 md:p-8 pt-12 md:pt-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm text-center space-y-8 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Pedido Recebido!</h1>
            <p className="text-gray-600 mt-4 text-lg">
              Obrigado por confiar na <strong>Sucupira Composta</strong>. Seu tratamento está a caminho!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-gray-100">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Package size={24} />
              </div>
              <span className="text-xs font-bold uppercase text-gray-400">Preparação</span>
              <p className="text-sm font-medium">1-2 dias úteis</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <Truck size={24} />
              </div>
              <span className="text-xs font-bold uppercase text-gray-400">Entrega</span>
              <p className="text-sm font-medium">Correios/Transportadora</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <span className="text-xs font-bold uppercase text-gray-400">Garantia</span>
              <p className="text-sm font-medium">30 dias incondicional</p>
            </div>
          </div>

          <div className="bg-[var(--cream)] rounded-2xl p-6 text-left space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Próximos Passos
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-emerald-600">01.</span>
                <span>Você receberá a confirmação do pagamento e detalhes do pedido por <strong>e-mail</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-600">02.</span>
                <span>Assim que o produto for postado, enviaremos o <strong>código de rastreio</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-600">03.</span>
                <span>Prepare-se para viver uma vida livre de dores!</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg"
            >
              Voltar para a Loja
            </Link>
          </div>
          
          <p className="text-xs text-gray-400 italic">
            Dúvidas? Entre em contato com nosso suporte pelo e-mail ou WhatsApp.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
