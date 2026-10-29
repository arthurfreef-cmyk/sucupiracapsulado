import { Link } from "@tanstack/react-router";
import { Lock, Truck, ShieldCheck, LoaderCircle, Copy, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { useUpsellCheckout } from "@/hooks/use-upsell-checkout";
import { siteImages } from "@/lib/site-media";
import { cn } from "@/lib/utils";

export function UpsellPage() {
  const offer = useUpsellCheckout();
  const eligible = offer.original.data?.paid && offer.original.data.eligible;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <span className="font-bold text-primary">Sucupira Composta</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-checkout-success-strong"><Lock size={14} /> Checkout seguro</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <section className="text-center" aria-labelledby="offer-title">
          <p className="mb-3 text-xs font-bold uppercase text-primary">Oferta opcional para seu pedido</p>
          <h1 id="offer-title" className="text-3xl font-extrabold leading-tight tracking-normal md:text-4xl">Mais 5 frascos de Sucupira Composta</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Uma condição especial para complementar seu pedido. A compra é opcional e não altera o pedido que você já pagou.</p>
          <img src={siteImages.kit5} alt="Kit de cinco frascos de Sucupira Composta" width={320} height={320} className="mx-auto h-64 w-64 object-contain md:h-72 md:w-72" fetchPriority="high" />
          <p className="text-sm text-muted-foreground">Kit com 5 frascos</p>
          <p className="mt-1 text-4xl font-black text-primary">R$ 47,90</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <span className="flex items-center gap-2"><Truck size={18} className="text-checkout-success-strong" /> Frete grátis nesta oferta</span>
            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-checkout-success-strong" /> Pagamento por PIX</span>
          </div>
        </section>
        <section className="mt-8 border-t border-border pt-6" aria-labelledby="offer-checkout">
          <h2 id="offer-checkout" className="text-xl font-bold">Complete sua compra adicional</h2>
          <p className="mt-2 text-sm text-muted-foreground">Oferta complementar, cobrada separadamente do pedido inicial.</p>
          {offer.saved && <div className="mt-4 space-y-1 text-sm"><p className="font-semibold">{offer.saved.buyer.name}</p><p className="break-words text-muted-foreground">{offer.saved.address.street}, {offer.saved.address.number} · {offer.saved.address.city} / {offer.saved.address.state}</p><p className="text-muted-foreground">Entrega no mesmo endereço do pedido inicial.</p></div>}
          {!offer.pix ? (
            <div className="mt-5 space-y-3">
              {!offer.ready || (offer.saved && offer.original.isPending) ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" /> Conferindo seu pedido...</p> : !offer.saved ? <p role="status" className="text-sm text-muted-foreground">Não encontramos seu pedido nesta sessão. A oferta fica disponível após confirmar o pagamento no checkout original.</p> : !eligible ? <p role="status" className="text-sm text-muted-foreground">{offer.original.error ? "Não foi possível consultar seu pedido agora." : "Aguardando confirmação do pagamento do pedido inicial."}</p> : <p className="flex items-center gap-2 text-sm text-checkout-success-strong"><CheckCircle2 size={16} /> Pedido inicial confirmado</p>}
              <Button onClick={offer.createOffer} disabled={offer.busy || !eligible} aria-busy={offer.busy} className={cn("min-h-12 w-full text-base font-bold", "bg-checkout-success text-checkout-success-foreground hover:bg-checkout-success-strong")}>
                {offer.busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" /> Preparando oferta...</> : "COMPRAR AGORA"}
              </Button>
              {offer.saved && !eligible && <Button variant="outline" disabled={offer.original.isFetching} onClick={() => void offer.original.refetch()} className="min-h-11 w-full">Conferir pagamento inicial</Button>}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="text-center"><h3 className="text-xl font-bold">Pague com PIX</h3><p className="mt-1 text-sm text-muted-foreground">Total desta compra adicional: R$ 47,90</p>
                {offer.qr ? <img src={offer.qr} alt="QR Code PIX da oferta" width={208} height={208} className="mx-auto my-4 h-52 w-52" /> : <div className="mx-auto my-4 flex h-52 w-52 items-center justify-center"><QrCode size={56} /></div>}
              </div>
              <label htmlFor="upsell-pix-code" className="text-sm font-bold">PIX Copia e Cola</label>
              <textarea id="upsell-pix-code" readOnly value={offer.pix.pix.code} className="min-h-24 w-full rounded-lg border border-input bg-card p-3 font-mono text-xs" />
              <Button onClick={offer.copy} variant="outline" className="min-h-12 w-full"><Copy /> {offer.copied ? "Código copiado" : "Copiar código PIX"}</Button>
              <Button onClick={offer.confirm} disabled={offer.additional.isFetching} className="min-h-12 w-full">{offer.additional.isFetching ? "Verificando pagamento..." : "Já paguei esta oferta"}</Button>
              <p role="status" className="text-center text-sm text-muted-foreground">Aguardando confirmação do pagamento</p>
            </div>
          )}
          {offer.error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{offer.error}</p>}
          <Button asChild variant="link" className="mt-4 min-h-11 w-full text-muted-foreground"><Link to="/obrigado">Não, obrigado. Continuar</Link></Button>
          <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">A oferta é opcional. Se não quiser, basta escolher “Não, obrigado”. O pedido inicial continua válido normalmente.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}