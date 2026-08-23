import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { generatePix } from "@/lib/mangofy.functions";



const KITS = {
  k1: { title: "1 Frasco", sub: "30 dias de tratamento", price: "R$ 27,00", priceCents: 2700, fromCents: 9700, image: "https://customer-assets.emergentagent.com/job_vida-sem-limites-1/artifacts/rq9lslj7_kit1frasco.png" },
  k3: { title: "3 Frascos", sub: "90 dias de tratamento", price: "R$ 97,00", priceCents: 9700, fromCents: 29100, image: "https://customer-assets.emergentagent.com/job_vida-sem-limites-1/artifacts/5kgkordi_sucupira%203%20frascos.png" },
  k5: { title: "5 Frascos", sub: "150 dias de tratamento", price: "R$ 147,00", priceCents: 14700, fromCents: 48500, image: "https://customer-assets.emergentagent.com/job_vida-sem-limites-1/artifacts/nf8gbzyx_kit5frasco.png" },
} as const;

type KitId = keyof typeof KITS;

// Order bump: adicione +1 frasco por R$ 37,00
const BUMP: Record<KitId, { addCents: number; label: string; sub: string } | null> = {
  k1: { addCents: 3700, label: "Adicione +1 frasco por apenas R$ 37,00", sub: "Reforce seu tratamento · oferta única" },
  k3: { addCents: 3700, label: "Adicione +1 frasco por apenas R$ 37,00", sub: "Reforce seu tratamento · oferta única" },
  k5: { addCents: 3700, label: "Adicione +1 frasco por apenas R$ 37,00", sub: "Reforce seu tratamento · oferta única" },
};




export const Route = createFileRoute("/checkout/$kit")({
  beforeLoad: ({ params }) => {
    if (!(params.kit in KITS)) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Checkout — Sucupira Composta" },
      { name: "description", content: "Finalize sua compra em 30 segundos com PIX." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type PixResult = {
  id: string;
  status: string;
  amount: number;
  pix: { code: string; qrcode_base64: string };
};

// ---------- máscaras ----------
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const maskCPF = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const maskPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};
const maskCEP = (s: string) => onlyDigits(s).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

// validação real de CPF (algoritmo oficial)
const isValidCPF = (raw: string) => {
  const d = onlyDigits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
};

// celular BR: 11 dígitos com DDD válido e nono dígito = 9
const isValidPhone = (raw: string) => {
  const d = onlyDigits(raw);
  if (d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  return d[2] === "9";
};

const expressShippingCents = (zip: string) => {
  const d = onlyDigits(zip);
  if (d.length !== 8) return 597;
  let sum = 0;
  for (let i = 0; i < d.length; i++) sum += Number(d[i]) * (i + 1);
  return 400 + (sum * 37) % 400;
};
const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


function CheckoutPage() {
  const { kit: kitId } = Route.useParams();
  const baseKitId = kitId as KitId;

  const effectiveKitId: KitId = baseKitId;
  const kit = KITS[effectiveKitId];


  useEffect(() => {
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", "ViewContent", {
        content_ids: [baseKitId],
        content_name: KITS[baseKitId].title,
        content_type: "product",
        value: KITS[baseKitId].priceCents / 100,
        currency: "BRL",
      });
    }
  }, [baseKitId]);

  const [form, setForm] = useState({
    name: "", email: "", document: "", phone: "",
    zip: "", number: "",
    street: "", neighborhood: "", city: "", state: "", complement: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);
  const [shipping, setShipping] = useState<"free" | "express">("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PixResult | null>(null);
  const [copied, setCopied] = useState(false);
  const cepTimer = useRef<number | null>(null);
  const expressCents = expressShippingCents(form.zip);
  const shippingCents = shipping === "express" ? expressCents : 0;
  const totalCents = kit.priceCents + shippingCents;

  const cpfValid = isValidCPF(form.document);
  const phoneValid = isValidPhone(form.phone);
  const cpfTouched = onlyDigits(form.document).length >= 11;
  const phoneTouched = onlyDigits(form.phone).length >= 10;
  const formValid =
    !!form.name.trim() &&
    !!form.email.trim() &&
    phoneValid &&
    cpfValid &&
    cepFilled &&
    !!form.number.trim();

  // Etapa do checkout para a barra de progresso
  const step: 1 | 2 | 3 = result ? 3 : (cepFilled && form.name && form.email && form.phone ? 2 : 1);

  // urgência (timer)
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  useEffect(() => {
    if (result) return;
    const t = window.setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [result]);

  // Ao gerar o PIX, leva o usuário direto pro QR Code (evita cair no rodapé)
  useEffect(() => {
    if (!result) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [result]);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");





  useEffect(() => {
    const cep = onlyDigits(form.zip);
    if (cep.length !== 8) { setCepFilled(false); return; }
    if (cepTimer.current) window.clearTimeout(cepTimer.current);
    cepTimer.current = window.setTimeout(async () => {
      setCepLoading(true);
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const d = await r.json();
        if (!d.erro) {
          setForm((f) => ({
            ...f,
            street: d.logradouro || f.street,
            neighborhood: d.bairro || f.neighborhood,
            city: d.localidade || f.city,
            state: d.uf || f.state,
          }));
          setCepFilled(true);
          const w = window as any;
          if (typeof w.fbq === "function") {
            w.fbq("track", "Lead", {
              content_ids: [effectiveKitId],
              content_name: kit.title,
              value: kit.priceCents / 100,
              currency: "BRL",
            });
          }
        }
      } catch { /* ignore */ }
      finally { setCepLoading(false); }
    }, 250);
  }, [form.zip, effectiveKitId, kit.title, kit.priceCents]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // evita cliques duplos
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("Nome");
    if (!form.email.trim()) missing.push("E-mail");
    if (!cpfValid) missing.push("CPF");
    if (!phoneValid) missing.push("Celular");
    if (!cepFilled) missing.push("CEP");
    if (!form.number.trim()) missing.push("Número");
    if (missing.length) {
      setError(`Preencha corretamente: ${missing.join(", ")}.`);
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      return;
    }
    setError(null);
    setLoading(true);
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", "InitiateCheckout", {
        content_ids: [effectiveKitId],
        content_name: kit.title,
        content_type: "product",
        value: kit.priceCents / 100,
        currency: "BRL",
        num_items: effectiveKitId === "k5" ? 5 : effectiveKitId === "k3" ? 3 : 1,
      });
    }
    try {
      const result = await generatePix({
        data: {
          name: form.name,
          email: form.email,
          document: form.document,
          phone: form.phone,
          amount: totalCents,
          kit: effectiveKitId,
        }
      });
      setResult(result);
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao processar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result?.pix?.code) return;
    await navigator.clipboard.writeText(result.pix.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-20">
        <div className="container mx-auto px-4 max-w-5xl py-3 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-[var(--brand)] transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Voltar
          </Link>
          <span className="font-semibold text-[var(--brand)] text-sm md:text-base tracking-tight">Sucupira Composta</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Compra segura
          </span>
        </div>
      </header>

      {/* Faixa de selos de confiança no topo */}
      {!result && (
        <div className="bg-white border-b border-[var(--border)]">
          <div className="container mx-auto max-w-5xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[11px] sm:text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><IconLock className="text-emerald-600" /> SSL 256 bits</span>
            <span className="inline-flex items-center gap-1.5"><IconPix className="text-emerald-600" /> PIX · Banco Central</span>
            <span className="inline-flex items-center gap-1.5"><IconTruck className="text-emerald-600" /> Envio rastreado</span>
            <span className="inline-flex items-center gap-1.5"><IconShield className="text-emerald-600" /> 30 dias de garantia</span>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 max-w-2xl py-6 md:py-10">
        <section className="bg-white rounded-2xl border border-[var(--border)] p-5 md:p-8 shadow-sm">
          {!result ? (
            <>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1">Finalize seu pedido</h1>
              <p className="text-sm text-muted-foreground mb-5">
                Pagamento via <strong className="text-foreground">PIX</strong> com aprovação imediata. Leva menos de 1 minuto.
              </p>

              {/* Resumo do pedido no topo */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--cream)] p-4 space-y-1.5 mb-5">
                <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
                  <img src={kit.image} alt={kit.title} loading="lazy" decoding="async" className="w-16 h-16 object-contain shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-tight">{kit.title}</div>
                    <div className="text-xs text-muted-foreground">{kit.sub}</div>
                  </div>
                  <span className="text-xs text-muted-foreground line-through shrink-0">{formatBRL(kit.fromCents)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700 font-semibold">
                  <span>Desconto</span>
                  <span>− {formatBRL(kit.fromCents - kit.priceCents)}</span>
                </div>
                {cepFilled && shippingCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frete (SEDEX)</span>
                    <span className="font-semibold">{formatBRL(shippingCents)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline border-t border-[var(--border)] pt-2 mt-1">
                  <span className="font-bold">Total</span>
                  <span className="text-[var(--brand)] font-extrabold text-xl">{formatBRL(totalCents)}</span>
                </div>
              </div>




              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1 · Seus dados</div>
                  <Field
                    label="Nome completo" required autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field
                      label="Celular" required autoComplete="tel" inputMode="numeric"
                      placeholder="(11) 99999-9999"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                      valid={phoneTouched ? phoneValid : null}
                      hint={phoneTouched && !phoneValid ? "Celular inválido — informe DDD + 9 dígitos" : phoneValid ? "Número válido" : undefined}
                    />
                    <Field
                      label="E-mail" type="email" required autoComplete="email" inputMode="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <Field
                    label="CPF (para emissão da nota)" required inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.document}
                    onChange={(e) => setForm((f) => ({ ...f, document: maskCPF(e.target.value) }))}
                    valid={cpfTouched ? cpfValid : null}
                    hint={cpfTouched && !cpfValid ? "CPF inválido — confira os números" : cpfValid ? "CPF válido" : undefined}
                  />
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2 · Endereço de entrega</div>
                  <div className="grid sm:grid-cols-[170px_1fr] gap-3">
                    <Field
                      label={cepLoading ? "CEP (buscando...)" : "CEP"}
                      required inputMode="numeric" autoComplete="postal-code"
                      placeholder="00000-000"
                      value={form.zip}
                      onChange={(e) => setForm((f) => ({ ...f, zip: maskCEP(e.target.value) }))}
                    />
                    <Field
                      label="Número" required inputMode="numeric"
                      value={form.number}
                      onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                    />
                  </div>

                  {cepFilled && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5">
                      ✓ Entrega para <strong>{form.street}</strong>, {form.neighborhood} — {form.city}/{form.state}
                    </div>
                  )}

                  {cepFilled && (
                    <div className="space-y-2">
                      <label className={`flex items-center justify-between gap-3 border rounded-xl p-3 cursor-pointer transition ${shipping === "free" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--border)] hover:bg-[var(--cream)]"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shipping" value="free" checked={shipping === "free"} onChange={() => setShipping("free")} className="accent-[var(--brand)]" />
                          <div>
                            <div className="text-sm font-semibold">Entrega Padrão — Correios</div>
                            <div className="text-xs text-muted-foreground">Chega em 3 a 5 dias úteis</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600">GRÁTIS</span>
                      </label>
                      <label className={`flex items-center justify-between gap-3 border rounded-xl p-3 cursor-pointer transition ${shipping === "express" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--border)] hover:bg-[var(--cream)]"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shipping" value="express" checked={shipping === "express"} onChange={() => setShipping("express")} className="accent-[var(--brand)]" />
                          <div>
                            <div className="text-sm font-semibold">Entrega Expressa — SEDEX</div>
                            <div className="text-xs text-muted-foreground">Chega em 1 a 3 dias úteis</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[var(--brand)]">{formatBRL(expressCents)}</span>
                      </label>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formValid}
                  aria-busy={loading}
                  aria-disabled={!formValid}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base md:text-lg py-4 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>Comprar agora — {formatBRL(totalCents)}</>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                  <IconLock className="text-emerald-600" />
                  Ambiente protegido · seus dados são criptografados
                </p>
              </form>
            </>

          ) : (
            <PixView result={result} kit={kit} totalCents={totalCents} onCopy={copy} copied={copied} />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>

  );
}

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-[var(--brand)] text-white" : "bg-[var(--border)] text-muted-foreground"}`}>
        {done ? "✓" : n}
      </span>
      <span className={`hidden sm:inline ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

function TrustBadge({ Icon, title, sub }: { Icon: React.FC<{ className?: string }>; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border)] bg-white">
      <Icon className="text-emerald-600 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold leading-tight truncate">{title}</div>
        <div className="text-[10px] text-muted-foreground leading-tight truncate">{sub}</div>
      </div>
    </div>
  );
}

function IconLock({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function IconShield({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconTruck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="14" height="11" rx="1" /><path d="M15 9h4l3 4v4h-7" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" />
    </svg>
  );
}
function IconPix({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l4 4-5 5-5-5 4-4a2 2 0 012 0z" /><path d="M3 12l4-4 5 5-5 5-4-4a2 2 0 010-2z" /><path d="M21 12l-4-4-5 5 5 5 4-4a2 2 0 000-2z" /><path d="M12 21l4-4-5-5-5 5 4 4a2 2 0 002 0z" />
    </svg>
  );
}


function PixView({
  result, kit, totalCents, onCopy, copied,
}: {
  result: PixResult;
  kit: (typeof KITS)[KitId];
  totalCents: number;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-3">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Aguardando pagamento
      </div>
      <h1 className="text-2xl font-bold mb-2">Pague com PIX para liberar o envio</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Escaneie o QR Code ou copie o código. Confirmação automática.
      </p>
      {result.pix.qrcode_base64 && (
        <img
          src={`data:image/png;base64,${result.pix.qrcode_base64}`}
          alt="QR Code PIX"
          className="mx-auto w-64 h-64 border border-[var(--border)] rounded-xl bg-white"
        />
      )}
      <div className="mt-6">
        <button
          onClick={onCopy}
          className={`w-full font-semibold text-base md:text-lg py-4 rounded-xl transition border ${copied ? "bg-emerald-600 text-white border-emerald-700" : "bg-[var(--brand)] text-white border-[var(--brand-dark)] hover:bg-[var(--brand-dark)]"}`}
        >
          {copied ? "✓ CÓDIGO COPIADO! ABRA O APP DO SEU BANCO" : "📋 COPIAR CÓDIGO PIX"}
        </button>
        <p className="text-xs text-muted-foreground mt-2">Toque no botão acima, abra seu app de banco e cole no PIX Copia e Cola.</p>
      </div>
      <div className="mt-5 text-left">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ou copie manualmente:</label>
        <textarea
          readOnly
          value={result.pix.code}
          className="w-full mt-1 p-3 border border-[var(--border)] rounded-lg text-xs font-mono bg-[var(--cream)]"
          rows={3}
        />
      </div>
      <div className="mt-5 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-sm text-left">
        <div className="font-bold mb-1 flex items-center gap-2">✅ Confirmação automática</div>
        <p className="leading-snug">Assim que você pagar, nosso sistema identificará automaticamente e você receberá o <strong>código de rastreio por e-mail</strong> em até 24h.</p>
      </div>
      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
        🚚 Seu tratamento será enviado em até 24h após a confirmação do pagamento
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Pedido #{result.id.slice(0, 8)} — Total {formatBRL(totalCents)}
      </p>
    </div>
  );
}

function Field({
  label, valid, hint, className, ...props
}: { label: string; valid?: boolean | null; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const borderClass =
    valid === true
      ? "border-emerald-400 focus:ring-emerald-300/40"
      : valid === false
        ? "border-red-400 focus:ring-red-300/40"
        : "border-[var(--border)] focus:ring-[var(--brand)]/30";
  return (
    <label className="block">
      <span className="text-sm font-medium flex items-center gap-1.5">
        {label}{props.required && " *"}
        {valid === true && <span className="text-emerald-600 text-xs">✓</span>}
      </span>
      <div className="relative">
        <input
          {...props}
          className={`mt-1 w-full h-11 px-3 rounded-lg border bg-white focus:outline-none focus:ring-2 transition-colors ${borderClass} ${className ?? ""}`}
        />
      </div>
      {hint && (
        <span className={`block mt-1 text-[11px] ${valid === false ? "text-red-600" : "text-emerald-700"}`}>
          {hint}
        </span>
      )}
    </label>
  );
}
