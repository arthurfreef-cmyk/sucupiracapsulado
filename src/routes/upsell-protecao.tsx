import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BadgeCheck, Clipboard, LoaderCircle, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pendingCheckoutKey, pendingCheckoutSchema } from "@/lib/checkout-pending";
import { useOrderPayment } from "@/hooks/use-order-payment";
import { siteImages } from "@/lib/site-media";
import { KIT_PRICING } from "@/lib/kit-pricing";

const searchSchema = z.object({ kit: z.enum(["k1", "k3", "k5"]).optional(), preview: z.boolean().optional() });
const continuitySchema = z.object({
  id: z.string(), status: z.string(), amount: z.literal(3987), orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string(), expires_at: z.string().datetime({ offset: true }) }),
});
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/upsell-protecao")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Oferta especial — Kit extra Sucupira Composta" },
    { name: "description", content: "Adicione mais 3 frascos de Sucupira Composta ao seu pedido por uma condição especial." },
    { name: "robots", content: "noindex" },
  ] }),
  component: ContinuityUpsellPage,
});

function ContinuityUpsellPage() {
  const { kit = "k1", preview = false } = Route.useSearch();
  const navigate = useNavigate();
  const [pending, setPending] = useState<z.infer<typeof pendingCheckoutSchema> | null>(null);

  const [payment, setPayment] = useState<z.infer<typeof continuitySchema> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const originalStatus = useOrderPayment(pending?.original.proof);
  const continuityStatus = useOrderPayment(payment?.orderProof);

  useEffect(() => {
    try {
      const p = pendingCheckoutSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCheckoutKey(kit)) || "null"));
      if (p.success && p.data.kit === kit) setPending(p.data);
      const saved = continuitySchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_continuity_upsell_${kit}`) || "null"));
      if (saved.success) setPayment(saved.data);
    } catch { /* Invalid browser state never grants access to the offer. */ }
  }, [kit]);

  useEffect(() => {
    if (!payment?.pix.code) return;
    let active = true;
    let objectUrl: string | null = null;
    void import("uqr").then(({ renderSVG }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(new Blob([renderSVG(payment.pix.code, { ecc: "M", border: 4 })], { type: "image/svg+xml" }));
      setQrUrl(objectUrl);
    }).catch(() => setQrUrl(null));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [payment?.pix.code]);

  useEffect(() => {
    if (!continuityStatus.data?.paid || !payment) return;
    try {
      const marker = `sucupira_continuity_purchase_tracked_${payment.id}`;
      if (!sessionStorage.getItem(marker)) {
        const tracker = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
        if (typeof tracker === "function") {
          tracker("track", "Purchase", {
            value: payment.amount / 100, currency: "BRL",
            content_ids: ["sucupira-kit-3-extra"], content_type: "product",
            content_name: "Kit adicional Sucupira Composta - 3 frascos", num_items: 3,
          }, { eventID: `purchase_continuity_${payment.id}` });
          sessionStorage.setItem(marker, "1");
        }
      }
    } catch { /* Tracking must never block the confirmed payment flow. */ }
    void navigate({ to: "/obrigado", replace: true });
  }, [continuityStatus.data?.paid, payment, navigate]);

  const generatePix = async () => {
    if (!pending || loading || payment || preview) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/fruitfy-protection-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalProof: pending.original.proof, buyer: pending.original.buyer, utm: pending.original.utm }),
      });
      const json: unknown = await response.json().catch(() => null);
      const parsed = continuitySchema.safeParse(json);
      if (!response.ok || !parsed.success) {
        const message = json && typeof json === "object" && "error" in json && typeof json.error === "string" ? json.error : "Não foi possível gerar o PIX.";
        throw new Error(message);
      }
      setPayment(parsed.data);
      try { sessionStorage.setItem(`sucupira_continuity_upsell_${kit}`, JSON.stringify(parsed.data)); } catch { /* Current screen remains usable. */ }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PIX. Tente novamente.");
    } finally { setLoading(false); }
  };

  const copyPix = async () => {
    if (!payment) return;
    try {
      await navigator.clipboard.writeText(payment.pix.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setError("Não foi possível copiar automaticamente. Selecione e copie o código PIX."); }
  };

  const decline = () => void navigate({ to: "/obrigado", replace: true });

  return (
    <div className="min-h-screen bg-[#f7f5ef] font-sans text-[15px] leading-relaxed text-slate-900 antialiased">
      <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#fbf7f2] via-white to-[#f3e9e4] px-5 py-10 animate-[protection-screen-out_3s_linear_forwards]" role="status" aria-live="polite">
        <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-red-100"><div className="h-full w-1/3 animate-[protection-loading_1.4s_ease-in-out_infinite] rounded-full bg-[#741111]"/></div>
        <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white/95 p-8 text-center shadow-2xl shadow-red-950/10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/70"><ShieldCheck size={36} className="text-[#741111]"/></div>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#741111]">Sucupira Composta</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Preparando sua oferta especial</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Estamos organizando os detalhes da condição especial para você adicionar mais 3 frascos de Sucupira Composta ao seu pedido.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#741111]"><LoaderCircle size={17} className="animate-spin"/> Carregando sua condição especial...</div>
        </div>
        <style>{`@keyframes protection-loading { 0% { transform: translateX(-110%); } 100% { transform: translateX(330%); } } @keyframes protection-screen-out { 0%, 92% { opacity: 1; visibility: visible; } 100% { opacity: 0; visibility: hidden; pointer-events: none; } }`}</style>
      </div>

      <header className="border-b border-stone-200 bg-white px-3 py-3 sm:px-4 sm:py-4 text-center text-sm sm:text-base font-bold tracking-wide">SUCUPIRA COMPOSTA</header>
      <main className="mx-auto max-w-xl px-3 py-4 sm:px-4 sm:py-7 md:py-10">
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-lg sm:shadow-xl shadow-stone-900/5">
          <div className="bg-gradient-to-br from-[#5b0808] via-[#7e1010] to-[#4a0505] px-4 py-5 text-white sm:px-5 sm:py-7 md:px-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold"><BadgeCheck size={15}/> OFERTA DE DESCULPAS PELO TRANSTORNO</div>
            <h1 className="text-xl font-black leading-tight sm:text-2xl md:text-3xl">Temos uma condição especial para adicionar mais 3 frascos ao seu pedido</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/90">Pedimos desculpas pelo transtorno na etapa anterior. Como agradecimento pela sua compreensão, liberamos uma condição especial: acrescente mais 3 frascos por R$ 39,87. É uma oferta opcional e não altera o pedido que você já realizou.</p>
          </div>
          <div className="space-y-4 sm:space-y-5 p-3.5 sm:p-5 md:p-7">
            {preview && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Pré-visualização: a página está aberta sem pagamento. A geração de PIX permanece desativada neste modo.</div>}
            {!preview && pending && !originalStatus.data?.paid && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{originalStatus.isError ? "Não foi possível consultar o pedido principal. A geração em modo de teste depende da configuração do servidor." : "Pedido principal ainda não confirmado. A geração de teste depende da configuração do servidor."}</div>}
            <div className="rounded-2xl border border-stone-200 bg-[#fbfaf7] p-4">
              <img src={siteImages.kit3} alt="Kit Sucupira Composta com três frascos" width={420} height={320} className="mx-auto max-h-64 w-full object-contain" fetchPriority="high" decoding="async"/>
              <div className="mt-3 text-center">
                <p className="text-sm font-extrabold tracking-wide text-[#650b0b]">SUCUPIRA COMPOSTA • KIT COM 3 FRASCOS</p>
                <p className="mt-1 text-xs text-slate-600">Mais 3 frascos para complementar seu pedido</p>
              </div>
            </div>
            {payment ? (
              <section className="space-y-4 text-center">
                <div className="rounded-2xl border-2 border-emerald-100 p-5">
                  <p className="text-sm text-slate-500">Kit adicional • 3 frascos</p>
                  <p className="mt-1 text-4xl font-black tabular-nums text-emerald-800">{money(payment.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500">PIX • válido até {new Date(payment.pix.expires_at).toLocaleString("pt-BR")}</p>
                </div>
                {qrUrl ? <img src={qrUrl} alt="QR Code PIX do kit adicional" className="mx-auto h-48 w-48 max-w-full rounded-lg border bg-white p-2 sm:h-56 sm:w-56"/> : <div className="mx-auto flex h-48 w-48 max-w-full items-center justify-center rounded-lg border bg-slate-50 sm:h-56 sm:w-56"><QrCode size={48} className="text-slate-400"/></div>}
                <Button onClick={copyPix} className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center text-sm font-bold leading-tight bg-emerald-700 hover:bg-emerald-800"><Clipboard size={17} className="mr-2"/>{copied ? "PIX copiado!" : "Copiar PIX e adicionar os 3 frascos"}</Button>
                <div className="rounded-xl bg-slate-50 p-3 text-left"><p className="mb-2 text-xs font-bold uppercase text-slate-500">PIX copia e cola</p><textarea readOnly value={payment.pix.code} className="min-h-24 w-full resize-y break-all rounded-lg border bg-white p-3 text-xs text-slate-700"/></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">{continuityStatus.data?.paid ? "Pagamento confirmado." : "Aguardando confirmação do PIX. A oferta será adicionada após a confirmação."}</div>
              </section>
            ) : (
              <>
                <div className="rounded-2xl border border-stone-200 p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Preço do kit de 3 na loja</p><p className="mt-1 text-lg font-semibold text-slate-500">{money(KIT_PRICING.k3.priceCents)}</p></div>
                    <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Sua condição especial</p><p className="mt-1 text-4xl font-black tracking-tight text-[#650b0b]">{money(3987)}</p></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm"><span className="font-semibold text-emerald-900">Você paga menos nesta oferta</span><strong className="text-emerald-900">{money(KIT_PRICING.k3.priceCents - 3987)} de diferença</strong></div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">Pagamento único via PIX. São 3 frascos adicionais por R$ 39,87. O pedido original permanece exatamente como foi realizado.</p>
                </div>
                <Button onClick={generatePix} disabled={!pending || loading || preview} className="flex h-auto min-h-14 w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 whitespace-normal px-3 py-3 text-center text-sm font-extrabold leading-snug sm:text-base bg-[#6b0d0d] hover:bg-[#510909] disabled:opacity-50">
                  {loading ? <><LoaderCircle className="h-[18px] w-[18px] shrink-0 animate-spin"/> <span className="min-w-0 flex-1 break-words">Gerando PIX...</span></> : <><LockKeyhole className="h-[18px] w-[18px] shrink-0"/> <span className="min-w-0 flex-1 break-words">ADICIONAR 3 FRASCOS POR R$ 39,87</span></>}
                </Button>
                <Button onClick={decline} variant="outline" className="h-auto min-h-11 w-full whitespace-normal px-3 py-3 text-center text-sm font-semibold leading-tight border-stone-300 text-slate-600">Não, obrigado. Continuar sem o kit adicional</Button>
              </>
            )}
            {!preview && pending && !originalStatus.data?.paid && !originalStatus.isError && <p className="text-center text-xs text-slate-500">Esta oferta adicional pode ser paga separadamente, mesmo enquanto o pedido principal estiver pendente.</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {preview && <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">Modo de visualização: nenhuma cobrança PIX será iniciada.</p>}
            <div className="flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="shrink-0 text-emerald-700"/> Oferta opcional. A compra adicional só é concluída após a confirmação do PIX. Seus direitos legais e a garantia do pedido original permanecem preservados.</div>
          </div>
        </div>
        <footer className="mt-5 border-t border-stone-200 px-3 py-4 text-center text-xs sm:text-sm leading-relaxed text-slate-500"><p className="font-semibold text-slate-600">Sucupira Composta</p><p className="mt-1 text-xs">Atendimento ao cliente • Informações e suporte sobre seu pedido</p></footer>
      </main>
    </div>
  );
}
