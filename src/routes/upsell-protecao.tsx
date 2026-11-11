import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  kit: z.enum(["k1", "k3", "k5"]).optional(),
  preview: z.boolean().optional(),
});

export const Route = createFileRoute("/upsell-protecao")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Uma condição especial para seu pedido — Sucupira Composta" },
      { name: "description", content: "Veja uma condição especial disponível para complementar seu pedido." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresellPage,
});

function PresellPage() {
  const { kit = "k1", preview = false } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-4 py-10 text-slate-900">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
        <header className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <PackageCheck size={32} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Atualização do seu pedido</p>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight md:text-3xl">Seu pedido está seguindo para a próxima etapa</h1>
          <p className="mt-3 text-sm leading-relaxed text-emerald-50">A etapa de regularização do frete foi concluída. Antes de finalizar, queremos apresentar uma condição especial que pode ser adicionada ao seu pedido.</p>
        </header>
        <div className="space-y-6 px-6 py-7 md:px-8">
          {preview && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Pré-visualização: esta página é apenas demonstrativa.</div>}
          <div className="rounded-2xl border border-stone-200 bg-[#fbfaf7] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-800"><BadgeCheck size={20} /></div>
              <div>
                <h2 className="font-bold">Uma condição especial está disponível</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">Você poderá conhecer uma oferta adicional de 3 frascos por um valor promocional. A decisão é sua: o pedido original permanece válido mesmo que não queira adicionar o kit.</p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <ShieldCheck size={16} className="shrink-0 text-emerald-700" />
            A oferta adicional será apresentada com preço e condições antes de qualquer pagamento. Nenhuma compra extra será realizada sem sua confirmação.
          </div>
          <Button onClick={() => void navigate({ to: "/upsell1", search: { kit, ...(preview ? { preview: true } : {}) } })} className="h-14 w-full bg-[#6b0d0d] text-base font-extrabold hover:bg-[#510909]">
            VER CONDIÇÃO ESPECIAL <ArrowRight size={18} className="ml-2" />
          </Button>
          <p className="text-center text-xs text-slate-500">Sucupira Composta • Atendimento ao cliente</p>
        </div>
      </section>
    </main>
  );
}
