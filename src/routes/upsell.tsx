import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Clipboard, Clock3, LoaderCircle, LockKeyhole, QrCode, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pendingCheckoutKey, pendingCheckoutSchema } from "@/lib/checkout-pending";
import { SHIPPING_UPSELL_CENTS } from "@/lib/fruitfy";
import { useOrderPayment } from "@/hooks/use-order-payment";

const searchSchema = z.object({ kit: z.enum(["k1", "k3", "k5"]).optional(), preview: z.boolean().optional() });
type UpsellPayment = {
  id: string; status: string; amount: number; orderProof: string;
  pix: { code: string; qrcode_base64: string; expires_at: string };
};
const upsellPaymentSchema = z.object({
  id: z.string(), status: z.string(), amount: z.literal(SHIPPING_UPSELL_CENTS),
  orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string(), expires_at: z.string().datetime({ offset: true }) }),
});
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/upsell")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Complemento de Frete — Sucupira Composta" },
    { name: "description", content: "Pague o complemento logístico por PIX para liberar a separação e o envio do pedido." },
    { name: "robots", content: "noindex" },
  ] }),
  component: ShippingUpsellPage,
});

function ShippingUpsellPage() {
  const { kit = "k1", preview = false } = Route.useSearch();
  const navigate = useNavigate();
  const [pending, setPending] = useState<z.infer<typeof pendingCheckoutSchema> | null>(null);
  const [payment, setPayment] = useState<UpsellPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [transitioningToProtection, setTransitioningToProtection] = useState(false);
  const originalStatus = useOrderPayment(pending?.original.proof);
  const upsellStatus = useOrderPayment(payment?.orderProof);

  useEffect(() => {
    try {
      const stored = pendingCheckoutSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCheckoutKey(kit)) || "null"));
      if (stored.success && stored.data.kit === kit) setPending(stored.data);
      const saved = upsellPaymentSchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_shipping_upsell_${kit}`) || "null"));
      if (saved.success) setPayment(saved.data);
    } catch { /* Preview remains available when browser storage is unavailable. */ }
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
    if (preview || !upsellStatus.data?.paid || !payment) return;
    try {
      const marker = `sucupira_shipping_upsell_purchase_tracked_${payment.id}`;
      if (!sessionStorage.getItem(marker)) {
        const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
        if (typeof fbq === "function") {
          fbq("track", "Purchase", {
            value: payment.amount / 100, currency: "BRL",
            content_ids: ["shipping-addon"], content_type: "product",
            content_name: "Complemento logístico",
          }, { eventID: `purchase_shipping_${payment.id}` });
          sessionStorage.setItem(marker, "1");
        }
      }
    } catch { /* Tracking must never block the confirmed payment flow. */ }
    setTransitioningToProtection(true);
    const timer = window.setTimeout(() => {
      void navigate({ to: "/upsell-protecao", search: { kit }, replace: true });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [upsellStatus.data?.paid, payment, navigate, kit]);

  const individualAmount = SHIPPING_UPSELL_CENTS;
  const canGenerate = !preview && Boolean(pending) && originalStatus.data?.paid === true && originalStatus.data.eligible === true;

  const generatePix = async () => {
    if (!pending || !canGenerate || loading || payment) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/fruitfy-upsell-pix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalProof: pending.original.proof,
          buyer: pending.original.buyer,
          utm: pending.original.utm,
        }),
      });
      const json: unknown = await response.json().catch(() => null);
      const parsed = upsellPaymentSchema.safeParse(json);
      if (!response.ok || !parsed.success) {
        const message = json && typeof json === "object" && "error" in json && typeof json.error === "string" ? json.error : "Não foi possível gerar o PIX.";
        throw new Error(message);
      }
      setPayment(parsed.data);
      try { sessionStorage.setItem(`sucupira_shipping_upsell_${kit}`, JSON.stringify(parsed.data)); } catch { /* Payment screen still works. */ }
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

  if (transitioningToProtection) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-5 py-12 text-center" role="status" aria-live="polite">
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-emerald-100"><div className="h-full w-1/3 animate-[checkout-progress_1.4s_ease-in-out_infinite] rounded-full bg-emerald-700" /></div>
        <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-7 shadow-xl shadow-emerald-950/5 sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60"><ShieldCheck size={38} className="text-emerald-700" aria-hidden="true" /></div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800"><ShieldCheck size={14} /> Pagamento aprovado</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pedido atualizado com sucesso!</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">Estamos confirmando as informações e preparando a próxima etapa. Não feche esta página.</p>
          <div className="mt-7 flex items-center justify-center gap-3 rounded-xl bg-emerald-50/70 px-4 py-3 text-left">
            <LoaderCircle size={20} className="shrink-0 animate-spin text-emerald-700" aria-hidden="true" />
            <div><p className="text-sm font-bold text-slate-900">Preparando a próxima etapa</p><p className="text-xs text-slate-600">Só mais alguns instantes</p></div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-500"><LockKeyhole size={13} /> Ambiente seguro • Sucupira Composta</div>
        </div>
        <style>{`@keyframes checkout-progress { 0% { transform: translateX(-110%); } 100% { transform: translateX(330%); } }`}</style>
      </main>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 font-sans text-[15px] leading-relaxed text-slate-900 antialiased">
      <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f3f8f4] via-white to-[#e7f1e9] px-5 py-10 animate-[upsell-screen-out_3s_linear_forwards]" role="status" aria-live="polite">
        <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-emerald-100"><div className="h-full w-1/3 animate-[upsell-loading_1.4s_ease-in-out_infinite] rounded-full bg-emerald-700"/></div>
        <div className="w-full max-w-sm rounded-3xl border border-emerald-100 bg-white/95 p-8 text-center shadow-2xl shadow-emerald-950/10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/70"><Truck size={36} className="text-emerald-800"/></div>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-emerald-800">Sucupira Composta</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Confirmando seu pedido</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Estamos conferindo as informações do seu pedido e preparando os próximos detalhes. Aguarde só um instante.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800"><LoaderCircle size={17} className="animate-spin"/> Conferindo os dados do pedido...</div>
        </div>
        <style>{`@keyframes upsell-loading { 0% { transform: translateX(-110%); } 100% { transform: translateX(330%); } } @keyframes upsell-screen-out { 0%, 92% { opacity: 1; visibility: visible; } 100% { opacity: 0; visibility: hidden; pointer-events: none; } }`}</style>
      </div>

      <header className="border-b bg-white px-3 py-3 sm:px-4 sm:py-4 text-center text-sm sm:text-base font-bold tracking-wide">SUCUPIRA COMPOSTA</header>
      <main className="mx-auto max-w-xl px-3 py-4 sm:px-4 sm:py-8 md:py-12">
        {preview && <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-900">Pré-visualização: esta tela abre sem validar pagamento e não permite gerar cobranças.</div>}
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border bg-white shadow-lg sm:shadow-xl shadow-slate-900/5">
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4 py-5 text-white sm:px-6 sm:py-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Truck size={14}/> ATUALIZAÇÃO DO FRETE</div>
            <h1 className="text-xl font-extrabold leading-tight sm:text-2xl md:text-3xl">Encontramos uma divergência no cálculo do frete.</h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50">O valor apresentado nesta etapa é de R$ 6,78, referente ao complemento logístico para o envio. Confira o valor e as condições antes de pagar.</p>
          </div>
          <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
            {!preview && pending && !originalStatus.data?.paid && <div className="rounded-xl border p-4 text-sm text-slate-600">{originalStatus.isError ? "Não foi possível consultar o pedido principal. A geração em modo de teste depende da configuração do servidor." : "Pedido principal ainda não confirmado. A geração de teste depende da configuração do servidor."}</div>}
            {!preview && pending && originalStatus.data?.paid && !originalStatus.data.eligible && <div className="rounded-xl border p-4 text-sm text-slate-600">Este pedido não está elegível para gerar um novo complemento.</div>}

            <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              <p className="font-semibold">INFORMAÇÃO SOBRE O FRETE</p>
              <p className="mt-1">A regularização de R$ 6,78 corresponde à diferença do frete necessária para concluir a expedição. Confira o valor antes de realizar o pagamento.</p>
            </div>

            {payment ? (
              <section className="space-y-4 text-center">
                <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-100 p-4 sm:p-5">
                  <p className="text-sm text-slate-500">Complemento logístico para liberar o envio</p>
                  <p className="mt-1 text-4xl font-extrabold tabular-nums text-emerald-800">{money(payment.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500">PIX gerado pela Fruitfy • válido até {new Date(payment.pix.expires_at).toLocaleString("pt-BR")}</p>
                </div>
                {qrUrl ? <img src={qrUrl} alt="QR Code PIX do complemento" className="mx-auto h-48 w-48 max-w-full rounded-lg border bg-white p-2 sm:h-56 sm:w-56"/> : <div className="mx-auto flex h-48 w-48 max-w-full items-center justify-center rounded-lg border bg-slate-50 sm:h-56 sm:w-56"><QrCode size={48} className="text-slate-400"/></div>}
                <p className="flex items-center justify-center gap-2 text-sm text-slate-600"><Clock3 size={16}/> Consulte o prazo no aplicativo do seu banco.</p>
                <Button onClick={copyPix} className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center text-sm font-bold leading-tight bg-emerald-700 hover:bg-emerald-800"><Clipboard size={17} className="mr-2"/>{copied ? "PIX copiado!" : "Copiar PIX para pagar e confirmar pedido"}</Button>
                <div className="rounded-xl bg-slate-50 p-3 text-left"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Código PIX copia e cola</p><textarea readOnly value={payment.pix.code} className="min-h-24 w-full resize-y break-all rounded-lg border bg-white p-3 text-xs text-slate-700"/></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">{upsellStatus.data?.paid ? "Complemento logístico confirmado." : "Aguardando a confirmação do PIX pela Fruitfy. O pedido principal permanece registrado."}</div>
                
                {upsellStatus.isError && <p className="text-sm text-amber-700">Não foi possível consultar o status agora. A página continuará tentando quando for atualizada.</p>}
              </section>
            ) : (
              <section className="space-y-4">
                {individualAmount !== null && <div className="rounded-xl sm:rounded-2xl border p-4 sm:p-5">
                  <p className="text-sm font-semibold text-slate-600">Valor informado para esta etapa logística</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">{money(individualAmount)}</p>
                </div>}
                <Button onClick={generatePix} disabled={!canGenerate || loading} className="h-auto min-h-14 w-full whitespace-normal px-3 py-3 text-center text-sm font-extrabold leading-tight sm:text-base bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50">
                  {loading ? <><LoaderCircle className="mr-2 animate-spin" size={18}/> Gerando PIX...</> : <><LockKeyhole className="mr-2" size={18}/> PAGAR E LIBERAR ENVIO</>}
                </Button>
                {pending && !canGenerate && !originalStatus.isError && <p className="text-center text-xs text-slate-500">A geração do PIX será liberada após a confirmação do pagamento principal.</p>}
                
              </section>
            )}

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="shrink-0 text-emerald-700"/> Pagamento processado pela Fruitfy. A regularização do saldo de frete é necessária para liberar a expedição do pedido.</div>
          </div>
        </div>
        <footer className="mt-5 border-t border-slate-200 px-3 py-4 text-center text-xs sm:text-sm leading-relaxed text-slate-500"><p className="font-semibold text-slate-600">Sucupira Composta</p><p className="mt-1 text-xs">Atendimento ao cliente • Informações e suporte sobre seu pedido</p></footer>
      </main>
    </div>
  );
}
