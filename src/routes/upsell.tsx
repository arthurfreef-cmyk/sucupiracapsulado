import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Clipboard, Clock3, LoaderCircle, LockKeyhole, QrCode, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pendingCheckoutKey, pendingCheckoutSchema } from "@/lib/checkout-pending";
import { useOrderPayment } from "@/hooks/use-order-payment";

const searchSchema = z.object({ kit: z.enum(["k1", "k3", "k5"]).optional() });
type UpsellPayment = {
  id: string; status: string; amount: number; orderProof: string;
  pix: { code: string; qrcode_base64: string; expires_at: string };
};
const upsellPaymentSchema = z.object({
  id: z.string(), status: z.string(), amount: z.number().int().min(1861).max(2100),
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
  const { kit = "k1" } = Route.useSearch();
  const navigate = useNavigate();
  const [pending, setPending] = useState<z.infer<typeof pendingCheckoutSchema> | null>(null);
  const [payment, setPayment] = useState<UpsellPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
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
    if (!upsellStatus.data?.paid || !payment) return;
    try {
      const marker = `sucupira_shipping_upsell_purchase_tracked_${payment.id}`;
      if (!sessionStorage.getItem(marker)) {
        const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
        if (typeof fbq === "function") fbq("track", "Purchase", {
          value: payment.amount / 100, currency: "BRL",
          content_ids: ["a324b199-a25a-4d9d-9aeb-57ba9745ca5b"], content_type: "product",
        });
        sessionStorage.setItem(marker, "1");
      }
    } catch { /* Tracking must never block the confirmed payment flow. */ }
    void navigate({ to: "/obrigado", replace: true });
  }, [upsellStatus.data?.paid, payment, navigate]);

  const canGenerate = Boolean(pending && originalStatus.data?.paid && originalStatus.data.eligible);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-4 py-4 text-center font-bold tracking-wide">SUCUPIRA COMPOSTA</header>
      <main className="mx-auto max-w-xl px-4 py-8 md:py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16}/> Voltar à loja</Link>
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="bg-emerald-800 px-6 py-7 text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Truck size={14}/> ETAPA DE PAGAMENTO LOGÍSTICO</div>
            <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">Complemento de frete</h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50">O pagamento do produto principal foi registrado. Para liberar a separação e o envio, conclua agora o pagamento do complemento logístico. O valor exato será mostrado antes do pagamento.</p>
          </div>
          <div className="space-y-6 p-6 md:p-8">
            {!pending && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Esta é a visualização da página. Para gerar um PIX real, acesse esta rota após concluir um pedido pago no checkout.</div>}
            {pending && !originalStatus.data?.paid && <div className="rounded-xl border p-4 text-sm text-slate-600">{originalStatus.isError ? "Não foi possível consultar o pedido principal. Atualize a página para tentar novamente." : "Validando a confirmação do pedido principal..."}</div>}
            {pending && originalStatus.data?.paid && !originalStatus.data.eligible && <div className="rounded-xl border p-4 text-sm text-slate-600">Este pedido não está elegível para gerar um novo complemento.</div>}

            {payment ? (
              <section className="space-y-4 text-center">
                <div className="rounded-2xl border-2 border-emerald-100 p-5">
                  <p className="text-sm text-slate-500">Complemento logístico para liberar o envio</p>
                  <p className="mt-1 text-4xl font-extrabold tabular-nums text-emerald-800">{money(payment.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500">PIX gerado pela Fruitfy • válido até {new Date(payment.pix.expires_at).toLocaleString("pt-BR")}</p>
                </div>
                {qrUrl ? <img src={qrUrl} alt="QR Code PIX do complemento" className="mx-auto h-56 w-56 rounded-lg border bg-white p-2"/> : <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border bg-slate-50"><QrCode size={48} className="text-slate-400"/></div>}
                <p className="flex items-center justify-center gap-2 text-sm text-slate-600"><Clock3 size={16}/> Consulte o prazo no aplicativo do seu banco.</p>
                <Button onClick={copyPix} className="h-12 w-full bg-emerald-700 hover:bg-emerald-800"><Clipboard size={17} className="mr-2"/>{copied ? "PIX copiado!" : "Copiar PIX para pagar e confirmar pedido"}</Button>
                <div className="rounded-xl bg-slate-50 p-3 text-left"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Código PIX copia e cola</p><textarea readOnly value={payment.pix.code} className="min-h-24 w-full resize-y break-all rounded-lg border bg-white p-3 text-xs text-slate-700"/></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">{upsellStatus.data?.paid ? "Pagamento logístico confirmado. O pedido pode seguir para separação e envio." : "Envio bloqueado: aguardando a confirmação deste pagamento pela Fruitfy. O pagamento do produto principal permanece registrado."}</div>
                {upsellStatus.isError && <p className="text-sm text-amber-700">Não foi possível consultar o status agora. A página continuará tentando quando for atualizada.</p>}
              </section>
            ) : (
              <section className="space-y-4">
                <div className="rounded-2xl border p-5">
                  <p className="text-sm font-semibold text-slate-600">Valor do complemento logístico</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">R$ 18,61 a R$ 21,00</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">O valor exato será exibido antes do pagamento. O produto principal já foi pago; esta cobrança é adicional e libera a separação e o envio. O pedido só será enviado após a confirmação do PIX.</p>
                </div>
                <Button onClick={generatePix} disabled={!canGenerate || loading} className="h-14 w-full bg-emerald-700 text-base font-bold hover:bg-emerald-800 disabled:opacity-50">
                  {loading ? <><LoaderCircle className="mr-2 animate-spin" size={18}/> Gerando PIX...</> : <><LockKeyhole className="mr-2" size={18}/> Pagar frete e confirmar pedido</>}
                </Button>
                {pending && !canGenerate && !originalStatus.isError && <p className="text-center text-xs text-slate-500">Após o pagamento principal ser validado, gere o PIX do complemento. O envio depende da confirmação deste segundo pagamento.</p>}
              </section>
            )}

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="shrink-0 text-emerald-700"/> Pagamento processado pela Fruitfy. O pedido principal continua registrado como pago; a separação e o envio ficam aguardando a confirmação deste complemento logístico.</div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Sucupira Composta • Atendimento e suporte ao cliente</p>
      </main>
    </div>
  );
}
