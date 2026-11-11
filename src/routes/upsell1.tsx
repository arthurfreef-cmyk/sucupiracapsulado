import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BadgeCheck, Clipboard, LoaderCircle, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pendingCheckoutKey, pendingCheckoutSchema } from "@/lib/checkout-pending";
import { SHIPPING_UPSELL_CENTS } from "@/lib/fruitfy";
import { useOrderPayment } from "@/hooks/use-order-payment";
import { siteImages } from "@/lib/site-media";

const searchSchema = z.object({ kit: z.enum(["k1", "k3", "k5"]).optional(), preview: z.boolean().optional() });
const shippingSchema = z.object({
  id: z.string(), status: z.string(), amount: z.literal(SHIPPING_UPSELL_CENTS), orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string(), expires_at: z.string().datetime({ offset: true }) }),
});
const continuitySchema = z.object({
  id: z.string(), status: z.string(), amount: z.literal(3987), orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string(), expires_at: z.string().datetime({ offset: true }) }),
});
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/upsell1")({
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
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<z.infer<typeof pendingCheckoutSchema> | null>(null);
  const [shipping, setShipping] = useState<z.infer<typeof shippingSchema> | null>(null);
  const [payment, setPayment] = useState<z.infer<typeof continuitySchema> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const shippingStatus = useOrderPayment(shipping?.orderProof);
  const continuityStatus = useOrderPayment(payment?.orderProof);

  useEffect(() => {
    try {
      const p = pendingCheckoutSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCheckoutKey(kit)) || "null"));
      if (p.success && p.data.kit === kit) setPending(p.data);
      const s = shippingSchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_shipping_upsell_${kit}`) || "null"));
      if (s.success) setShipping(s.data);
      const saved = continuitySchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_continuity_upsell_${kit}`) || "null"));
      if (saved.success) setPayment(saved.data);
    } catch { /* Invalid browser state never grants access to the offer. */ }
    setLoaded(true);
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
    if (!pending || !shipping || !shippingStatus.data?.paid || loading || payment || preview) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/fruitfy-protection-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingProof: shipping.orderProof, buyer: pending.original.buyer, utm: pending.original.utm }),
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

  if (!loaded) {
    return <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-center text-sm text-slate-600">Conferindo os dados do seu pedido...</main>;
  }

  if (!pending || !shipping) {
    return <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-center text-sm text-slate-600">Não foi possível localizar os dados da etapa anterior. <a className="ml-1 underline" href="/obrigado">Continuar</a></main>;
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] font-sans text-base leading-relaxed text-slate-900 antialiased">
      <header className="border-b border-stone-200 bg-white px-4 py-4 text-center font-bold tracking-wide">SUCUPIRA COMPOSTA</header>
      <main className="mx-auto max-w-xl px-4 py-7 md:py-10">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
          <div className="bg-gradient-to-br from-[#5b0808] via-[#7e1010] to-[#4a0505] px-5 py-7 text-white md:px-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold"><BadgeCheck size={15}/> CONDIÇÃO ESPECIAL PARA SEU PEDIDO</div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">Aproveite para garantir mais 3 frascos junto com seu pedido</h1>
            <p className="mt-3 text-base leading-relaxed text-white/90 md:text-lg">Você já escolheu a Sucupira Composta. Agora pode adicionar um kit extra de 3 frascos por um valor especial, sem precisar refazer o pedido.</p>
          </div>
          <div className="space-y-5 p-5 md:p-7">
            {!shippingStatus.data?.paid && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{shippingStatus.isError ? "Não foi possível validar o pagamento da etapa anterior. Atualize a página." : "Validando o pagamento da etapa anterior..."}</div>}
            <div className="rounded-2xl border border-stone-200 bg-[#fbfaf7] p-4">
              <img src={siteImages.kit3} alt="Kit Sucupira Composta com três frascos" width={420} height={320} className="mx-auto max-h-64 w-full object-contain" fetchPriority="high" decoding="async"/>
              <div className="mt-3 text-center">
                <p className="text-sm font-bold text-slate-800">KIT ADICIONAL • 3 FRASCOS</p>
                <p className="mt-1 text-xs text-slate-500">Para acrescentar ao pedido que você já fez</p>
              </div>
            </div>
            {payment ? (
              <section className="space-y-4 text-center">
                <div className="rounded-2xl border-2 border-emerald-100 p-5">
                  <p className="text-sm text-slate-500">Kit adicional • 3 frascos</p>
                  <p className="mt-1 text-4xl font-black tabular-nums text-emerald-800">{money(payment.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500">PIX • válido até {new Date(payment.pix.expires_at).toLocaleString("pt-BR")}</p>
                </div>
                {qrUrl ? <img src={qrUrl} alt="QR Code PIX do kit adicional" className="mx-auto h-56 w-56 rounded-lg border bg-white p-2"/> : <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border bg-slate-50"><QrCode size={48} className="text-slate-400"/></div>}
                <Button onClick={copyPix} className="h-14 w-full rounded-xl bg-emerald-700 text-base font-bold tracking-wide text-white shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 active:translate-y-0"><Clipboard size={17} className="mr-2"/>{copied ? "PIX copiado!" : "Copiar PIX e adicionar os 3 frascos"}</Button>
                <div className="rounded-xl bg-slate-50 p-3 text-left"><p className="mb-2 text-xs font-bold uppercase text-slate-500">PIX copia e cola</p><textarea readOnly value={payment.pix.code} className="min-h-24 w-full resize-y break-all rounded-lg border bg-white p-3 text-xs text-slate-700"/></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">{continuityStatus.data?.paid ? "Pagamento confirmado." : "Aguardando confirmação do PIX. A oferta será adicionada após a confirmação."}</div>
              </section>
            ) : (
              <>
                <div className="rounded-2xl border border-stone-200 p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Preço de referência do kit</p><p className="mt-1 text-lg text-slate-400 line-through">{money(19700)}</p></div>
                    <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Oferta adicional</p><p className="mt-1 text-4xl font-extrabold tracking-tight text-[#650b0b] md:text-5xl">{money(3987)}</p></div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">Pagamento único via PIX. O valor promocional é para este kit adicional de 3 frascos e não altera o pedido original.</p>
                </div>
                <Button onClick={generatePix} disabled={!shippingStatus.data?.paid || loading || preview} className="h-16 w-full rounded-xl bg-gradient-to-r from-[#650909] to-[#861414] text-lg font-extrabold tracking-wide text-white shadow-xl shadow-red-950/20 transition-all hover:-translate-y-0.5 hover:from-[#520707] hover:to-[#710e0e] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? <><LoaderCircle className="mr-2 animate-spin" size={18}/> Gerando PIX...</> : <><LockKeyhole className="mr-2" size={18}/> SIM, QUERO ADICIONAR OS 3 FRASCOS</>}
                </Button>
                <Button onClick={decline} variant="outline" className="h-12 w-full rounded-xl border-stone-300 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-stone-400 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200">Não, obrigado. Continuar sem o kit adicional</Button>
              </>
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {preview && <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">Modo de visualização: nenhuma cobrança PIX será iniciada.</p>}
            <div className="flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="shrink-0 text-emerald-700"/> Oferta opcional. A compra adicional só é concluída após a confirmação do PIX. Seus direitos legais e a garantia do pedido original permanecem preservados.</div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">Sucupira Composta • Atendimento ao cliente</p>
      </main>
    </div>
  );
}
