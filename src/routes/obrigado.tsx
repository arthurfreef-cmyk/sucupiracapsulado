import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckCircle2, Package, Truck, ShieldCheck, Clock3, Mail, FileText, CircleHelp } from "lucide-react";
import { pendingCheckoutKey, pendingCheckoutSchema } from "@/lib/checkout-pending";
import { useOrderPayment } from "@/hooks/use-order-payment";
import { SHIPPING_UPSELL_CENTS } from "@/lib/fruitfy";
import { z } from "zod";

const shippingSchema = z.object({ id: z.string(), status: z.string(), amount: z.literal(SHIPPING_UPSELL_CENTS), orderProof: z.string().min(1) });
const continuitySchema = z.object({ id: z.string(), status: z.string(), amount: z.literal(3987), orderProof: z.string().min(1) });

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Acompanhe seu pedido — Sucupira Composta" },
      { name: "description", content: "Confira as próximas etapas do seu pedido Sucupira Composta." },
      { property: "og:title", content: "Pedido recebido — Sucupira Composta" },
      { property: "og:description", content: "Acompanhe as próximas etapas do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  const [loaded, setLoaded] = useState(false);
  const [kit, setKit] = useState<"k1" | "k3" | "k5" | null>(null);
  const [mainProof, setMainProof] = useState<string>();
  const [shippingProof, setShippingProof] = useState<string>();
  const [continuityProof, setContinuityProof] = useState<string>();

  useEffect(() => {
    for (const candidate of ["k1", "k3", "k5"] as const) {
      try {
        const stored = pendingCheckoutSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCheckoutKey(candidate)) || "null"));
        if (!stored.success || stored.data.kit !== candidate) continue;
        setKit(candidate);
        setMainProof(stored.data.original.proof);
        const shipping = shippingSchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_shipping_upsell_${candidate}`) || "null"));
        if (shipping.success) setShippingProof(shipping.data.orderProof);
        const extra = continuitySchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_continuity_upsell_${candidate}`) || "null"));
        if (extra.success) setContinuityProof(extra.data.orderProof);
        break;
      } catch { /* Keep the page usable if browser storage is unavailable. */ }
    }
    setLoaded(true);
  }, []);

  const mainStatus = useOrderPayment(mainProof);
  const shippingStatus = useOrderPayment(shippingProof);
  const continuityStatus = useOrderPayment(continuityProof);
  const anyError = mainStatus.isError || shippingStatus.isError || continuityStatus.isError;

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="border-b border-[var(--brand)]/10 bg-white px-4 py-4 text-center font-bold tracking-wide text-[var(--brand)]">SUCUPIRA COMPOSTA</header>
      <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="relative space-y-7 overflow-hidden rounded-3xl border border-[var(--brand)]/10 bg-white p-6 text-center shadow-xl shadow-[var(--brand)]/5 md:p-10">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"/>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={46}/></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Sucupira Composta</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Obrigado pela sua compra!</h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">Estamos acompanhando as confirmações e preparando as próximas etapas do seu pedido.</p>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <h2 className="mb-4 flex items-center gap-2 font-extrabold text-slate-900"><Package size={19}/> Status das etapas</h2>
            <div className="space-y-3 text-sm">
              <StatusRow label="Pedido principal" loaded={loaded} paid={mainStatus.data?.paid}/>
              {shippingProof && <StatusRow label="Complemento logístico" loaded={loaded} paid={shippingStatus.data?.paid}/>}
              {continuityProof && <StatusRow label="Kit adicional de 3 frascos" loaded={loaded} paid={continuityStatus.data?.paid}/>}
            </div>
            {!kit && loaded && <p className="mt-3 text-xs leading-relaxed text-slate-500">Os detalhes do pedido não estão disponíveis neste navegador. Consulte o e-mail informado na compra para localizar a confirmação.</p>}
            {anyError && <p className="mt-3 text-xs text-amber-800">Não conseguimos atualizar um dos status agora. Atualize esta página em alguns instantes.</p>}
          </section>

          <section className="grid gap-3 text-left sm:grid-cols-3">
            <InfoCard icon={<Package size={21}/>} title="Preparação" text="Após a confirmação do pagamento, o pedido segue para separação."/>
            <InfoCard icon={<Truck size={21}/>} title="Entrega" text="O código de rastreio será enviado quando o pacote for postado."/>
            <InfoCard icon={<ShieldCheck size={21}/>} title="Garantia" text="Consulte as condições de garantia enviadas com a confirmação do pedido."/>
          </section>

          <section className="rounded-2xl bg-[var(--cream)] p-5 text-left">
            <h2 className="mb-3 font-extrabold text-slate-900">O que acontece agora?</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
              <li className="flex gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-emerald-700"/><span>Confira sua caixa de entrada e a pasta de spam para localizar os detalhes do pedido.</span></li>
              <li className="flex gap-3"><Truck size={17} className="mt-0.5 shrink-0 text-emerald-700"/><span>Quando o pedido for postado, você receberá as informações de rastreamento.</span></li>
              <li className="flex gap-3"><FileText size={17} className="mt-0.5 shrink-0 text-emerald-700"/><span>A nota fiscal e os documentos da compra serão disponibilizados conforme o processamento do pedido.</span></li>
            </ul>
          </section>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left text-sm text-blue-900">
            <div className="flex items-center gap-2 font-bold"><Clock3 size={17}/> Atualização do pagamento</div>
            <p className="mt-1">Se algum pagamento ainda estiver pendente, aguarde a confirmação do banco. Esta página consulta os status automaticamente enquanto estiver aberta.</p>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-slate-800">Voltar para a loja</Link>
            <p className="flex items-center justify-center gap-2 text-xs text-slate-500"><CircleHelp size={14}/> Precisa de ajuda? Utilize o canal de atendimento informado no e-mail do pedido.</p>
          </div>
        </div>
      </main>
      <SiteFooter/>
    </div>
  );
}

function StatusRow({ label, loaded, paid }: { label: string; loaded: boolean; paid?: boolean }) {
  const text = !loaded ? "Carregando..." : paid === true ? "Pagamento confirmado" : paid === false ? "Aguardando pagamento" : "Consultando status...";
  return <div className="flex items-center justify-between gap-3"><span className="text-slate-700">{label}</span><span className={paid ? "font-bold text-emerald-700" : "font-semibold text-amber-700"}>{text}</span></div>;
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl border border-slate-200 p-4"><div className="mb-2 text-emerald-700">{icon}</div><p className="font-bold text-slate-900">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p></div>;
}
