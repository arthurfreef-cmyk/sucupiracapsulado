import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { Copy, Lock, PackageCheck, ShieldCheck, Truck, QrCode, LoaderCircle } from "lucide-react";

type SavedOrder = {
  proof: string;
  buyer: { name: string; email: string; document: string; phone: string };
  address: { zip: string; street: string; number: string; complement?: string; neighborhood: string; city: string; state: string };
  utm?: string;
};
type PixResult = { id: string; amount: number; orderProof: string; pix: { code: string; expires_at?: string } };

export const Route = createFileRoute("/oferta")({
  head: () => ({ meta: [
    { title: "Oferta Especial — Sucupira Composta" },
    { name: "description", content: "Oferta opcional para complementar seu pedido." },
    { name: "robots", content: "noindex" },
  ] }),
  component: OfferPage,
});

function OfferPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedOrder | null>(null);
  const [pix, setPix] = useState<PixResult | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sucupira_original_order");
      if (raw) {
        const parsed = JSON.parse(raw) as SavedOrder;
        if (parsed.proof && parsed.buyer && parsed.address) setSaved(parsed);
      }
    } catch { /* Invalid or unavailable session storage means no offer checkout. */ }
  }, []);

  useEffect(() => {
    if (!pix?.pix.code) return;
    let active = true;
    let objectUrl: string | null = null;
    void import("uqr").then(({ renderSVG }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(new Blob([renderSVG(pix.pix.code, { ecc: "M", border: 4 })], { type: "image/svg+xml" }));
      setQr(objectUrl);
    }).catch(() => setQr(null));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [pix?.pix.code]);

  const createOffer = async () => {
    if (!saved) { setError("Não encontramos os dados do pedido nesta sessão. Volte ao checkout original e confirme o pagamento por lá."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/fruitfy-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kit: "upsell5",
          originalOrderProof: saved.proof,
          buyer: saved.buyer,
          address: saved.address,
          shipping: { method: "free", amount: 0 },
          utm: saved.utm,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.pix?.code || !data?.orderProof) throw new Error(data?.error || "Não foi possível gerar o PIX da oferta.");
      setPix({ id: data.id, amount: data.amount, orderProof: data.orderProof, pix: data.pix });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PIX. Tente novamente.");
    } finally { setBusy(false); }
  };

  const confirmPayment = async () => {
    if (!pix) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/fruitfy-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof: pix.orderProof }),
      });
      const status = await response.json().catch(() => null);
      if (!response.ok) throw new Error(status?.error || "Não foi possível consultar o pagamento.");
      if (!status?.paid) { setError("O pagamento ainda não foi confirmado. Aguarde alguns instantes e confira novamente."); return; }
      try { sessionStorage.removeItem("sucupira_original_order"); } catch { /* Non-critical cleanup. */ }
      navigate({ to: "/obrigado" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao consultar o pagamento.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] text-gray-900">
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <span className="font-bold text-[var(--brand)]">Sucupira Composta</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Lock size={14} /> Checkout seguro</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="mb-6 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">Oferta opcional para seu pedido</p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">Uma condição especial para adicionar 5 frascos</h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">Se fizer sentido para você, aproveite esta oferta única antes de concluir. A compra é opcional e não altera o pedido que você já pagou.</p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-emerald-800 px-6 py-5 text-center text-white">
            <p className="text-sm font-semibold text-emerald-100">Condição especial de pós-compra</p>
            <p className="mt-1 text-4xl font-black">R$ 47,90</p>
            <p className="mt-1 text-sm text-emerald-100">Kit com 5 frascos · frete grátis</p>
          </div>
          <div className="space-y-5 p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><PackageCheck size={24} /></div>
              <div><h2 className="font-bold">5 frascos adicionais</h2><p className="mt-1 text-sm text-gray-600">Oferta complementar, cobrada separadamente do pedido inicial.</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm"><Truck size={18} className="text-emerald-700" /> Frete grátis nesta oferta</div>
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm"><ShieldCheck size={18} className="text-emerald-700" /> Pagamento por PIX</div>
            </div>

            {!pix ? (
              <>
                <Button onClick={createOffer} disabled={busy || !saved} className="min-h-12 w-full bg-emerald-700 text-base font-bold hover:bg-emerald-800">
                  {busy ? <><LoaderCircle className="mr-2 animate-spin" size={18} /> Preparando oferta...</> : "Quero aproveitar por R$ 47,90"}
                </Button>
                {!saved && <p className="text-center text-xs text-gray-500">Carregando os dados do pedido...</p>}
                <button type="button" onClick={() => navigate({ to: "/obrigado" })} className="w-full py-2 text-sm font-semibold text-gray-500 underline underline-offset-4">Não, obrigado. Continuar</button>
              </>
            ) : (
              <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold">Pague com PIX</h2>
                  <p className="mt-1 text-sm text-gray-600">Total desta compra adicional: R$ {(pix.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  {qr ? <img src={qr} alt="QR Code PIX da oferta" className="mx-auto my-4 h-52 w-52" /> : <div className="mx-auto my-4 flex h-52 w-52 items-center justify-center"><QrCode size={56} /></div>}
                </div>
                <label htmlFor="upsell-pix-code" className="text-sm font-bold">PIX Copia e Cola</label>
                <textarea id="upsell-pix-code" readOnly value={pix.pix.code} className="min-h-24 w-full rounded-lg border p-3 font-mono text-xs" />
                <Button onClick={async () => { try { await navigator.clipboard.writeText(pix.pix.code); setCopied(true); } catch { setError("Não foi possível copiar automaticamente. Selecione e copie o código acima."); } }} className="w-full" variant="outline">
                  <Copy size={16} className="mr-2" /> {copied ? "Código copiado" : "Copiar código PIX"}
                </Button>
                <Button onClick={confirmPayment} disabled={busy} className="min-h-12 w-full bg-emerald-700 font-bold hover:bg-emerald-800">
                  {busy ? "Verificando pagamento..." : "Já paguei esta oferta"}
                </Button>
              </div>
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <p className="text-center text-xs leading-relaxed text-gray-500">A oferta é opcional. Se não quiser, basta escolher “Não, obrigado”. O pedido inicial continua válido normalmente.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
