import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BadgeCheck, Clipboard, LoaderCircle, LockKeyhole, QrCode, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pendingCheckoutKey, pendingCheckoutSchema } from "@/lib/checkout-pending";
import { PROTECTION_UPSELL_CENTS, SHIPPING_UPSELL_CENTS } from "@/lib/fruitfy";
import { useOrderPayment } from "@/hooks/use-order-payment";

const searchSchema = z.object({ kit: z.enum(["k1", "k3", "k5"]).optional(), preview: z.boolean().optional() });
const shippingSchema = z.object({
  id: z.string(), status: z.string(), amount: z.literal(SHIPPING_UPSELL_CENTS), orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string(), expires_at: z.string().datetime({ offset: true }) }),
});
const protectionSchema = z.object({
  id: z.string(), status: z.string(), amount: z.literal(PROTECTION_UPSELL_CENTS), orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), qrcode_base64: z.string(), expires_at: z.string().datetime({ offset: true }) }),
});
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/upsell1")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Proteção comercial opcional — Sucupira Composta" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ProtectionUpsellPage,
});

function ProtectionUpsellPage() {
  const { kit = "k1", preview = false } = Route.useSearch();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<z.infer<typeof pendingCheckoutSchema> | null>(null);
  const [shipping, setShipping] = useState<z.infer<typeof shippingSchema> | null>(null);
  const [payment, setPayment] = useState<z.infer<typeof protectionSchema> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const shippingStatus = useOrderPayment(shipping?.orderProof);
  const protectionStatus = useOrderPayment(payment?.orderProof);

  useEffect(() => {
    try {
      const p = pendingCheckoutSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCheckoutKey(kit)) || "null"));
      if (p.success && p.data.kit === kit) setPending(p.data);
      const s = shippingSchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_shipping_upsell_${kit}`) || "null"));
      if (s.success) setShipping(s.data);
      const saved = protectionSchema.safeParse(JSON.parse(sessionStorage.getItem(`sucupira_protection_upsell_${kit}`) || "null"));
      if (saved.success) setPayment(saved.data);
    } catch { /* Invalid local state never grants access to the offer. */ }
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
    if (protectionStatus.data?.paid) void navigate({ to: "/obrigado", replace: true });
  }, [protectionStatus.data?.paid, navigate]);

  const generatePix = async () => {
    if (!pending || !shipping || !shippingStatus.data?.paid || loading || payment) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/fruitfy-protection-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingProof: shipping.orderProof, buyer: pending.original.buyer, utm: pending.original.utm }),
      });
      const json: unknown = await response.json().catch(() => null);
      const parsed = protectionSchema.safeParse(json);
      if (!response.ok || !parsed.success) {
        const message = json && typeof json === "object" && "error" in json && typeof json.error === "string" ? json.error : "Não foi possível gerar o PIX.";
        throw new Error(message);
      }
      setPayment(parsed.data);
      try { sessionStorage.setItem(`sucupira_protection_upsell_${kit}`, JSON.stringify(parsed.data)); } catch { /* Current screen remains usable. */ }
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

  if (!loaded) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-sm text-slate-600">Carregando oferta...</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-4 py-4 text-center font-bold tracking-wide">SUCUPIRA COMPOSTA</header>
      <main className="mx-auto max-w-xl px-4 py-8 md:py-12">
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-700 px-6 py-8 text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><ShieldCheck size={15}/> OFERTA OPCIONAL</div>
            <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">NÃO DEIXE SEU PEDIDO DESPROTEGIDO!</h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50">Ative uma proteção extra por apenas R$ 15,90 e tenha a possibilidade de solicitar reembolso se ocorrer uma situação coberta com seu pedido.</p>
          </div>
          <div className="space-y-6 p-6 md:p-8">
            {payment ? (
              <section className="space-y-4 text-center">
                <div className="rounded-2xl border-2 border-emerald-100 p-5">
                  <p className="text-sm text-slate-500">Proteção comercial opcional</p>
                  <p className="mt-1 text-4xl font-extrabold tabular-nums text-emerald-800">{money(payment.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500">Pagamento único via PIX • válido até {new Date(payment.pix.expires_at).toLocaleString("pt-BR")}</p>
                </div>
                {qrUrl ? <img src={qrUrl} alt="QR Code PIX da proteção comercial" className="mx-auto h-56 w-56 rounded-lg border bg-white p-2"/> : <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border bg-slate-50"><QrCode size={48} className="text-slate-400"/></div>}
                <Button onClick={copyPix} className="h-12 w-full bg-emerald-700 hover:bg-emerald-800"><Clipboard size={17} className="mr-2"/>{copied ? "PIX copiado!" : "Copiar PIX e contratar proteção"}</Button>
                <div className="rounded-xl bg-slate-50 p-3 text-left"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Código PIX copia e cola</p><textarea readOnly value={payment.pix.code} className="min-h-24 w-full resize-y break-all rounded-lg border bg-white p-3 text-xs text-slate-700"/></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">{protectionStatus.data?.paid ? "Pagamento confirmado." : "Aguardando confirmação do PIX pela Fruitfy. A contratação só será concluída após a confirmação."}</div>
              </section>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-start gap-3"><Truck className="mt-0.5 shrink-0 text-emerald-700" size={21}/><p className="text-sm leading-relaxed"><strong>Mais tranquilidade até a entrega:</strong> em caso de extravio, avaria ou divergência comprovada no produto recebido, você poderá solicitar reembolso conforme as condições da proteção.</p></div>
                  <div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 shrink-0 text-emerald-700" size={21}/><p className="text-sm leading-relaxed"><strong>Até 120% do valor elegível:</strong> nos casos cobertos e aprovados, o reembolso comercial poderá chegar a 120% do total elegível pago pelo produto e pelo complemento logístico.</p></div>
                </div>
                <div className="rounded-2xl border p-5">
                  <p className="text-sm font-semibold text-slate-600">ATIVE AGORA — PAGAMENTO ÚNICO</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">{money(PROTECTION_UPSELL_CENTS)}</p>
                  <p className="mt-1 text-xs text-slate-500">Apenas R$ 15,90. Sem mensalidade e sem cobrança recorrente.</p>
                </div>
                <Button onClick={generatePix} disabled={!pending || !shipping || !shippingStatus.data?.paid || loading || preview} className="h-14 w-full bg-emerald-700 text-base font-bold hover:bg-emerald-800 disabled:opacity-50">
                  {loading ? <><LoaderCircle className="mr-2 animate-spin" size={18}/> Gerando PIX...</> : <><LockKeyhole className="mr-2" size={18}/> SIM! QUERO ADICIONAR PROTEÇÃO</>}
                </Button>
              </>
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {preview && <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">Modo de visualização: esta é uma prévia da oferta. Nenhuma cobrança PIX pode ser iniciada.</p>}
            <div className="flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="shrink-0 text-emerald-700"/> Pagamento opcional processado pela Fruitfy. A contratação só é efetivada após confirmação do PIX.</div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Sucupira Composta • Atendimento e suporte ao cliente</p>
      </main>
    </div>
  );
}
