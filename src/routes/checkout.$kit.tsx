import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, Copy, CheckCircle2, Clock, QrCode, AlertCircle, ArrowLeft, Lock, Truck, LoaderCircle } from "lucide-react";
import { decodeCampaignCookie, expressShippingCents, normalizeCheckoutPhone } from "@/lib/checkout-utils";
import { AddressLookupError, fetchCheckoutAddress as fetchAddress, normalizeCheckoutZip } from "@/lib/checkout-address";
import { useOrderPayment } from "@/hooks/use-order-payment";


import { siteImages } from "@/lib/site-media";
const imgKit1 = siteImages.kit1, imgKit3 = siteImages.kit3, imgKit5 = siteImages.kit5;
const KITS = {
  k1: { title: "1 Frasco", sub: "30 dias de tratamento", price: "R$ 27,00", priceCents: 2700, fromCents: 9700, image: imgKit1 },
  k3: { title: "3 Frascos", sub: "90 dias de tratamento", price: "R$ 97,00", priceCents: 9700, fromCents: 29100, image: imgKit3 },
  k5: { title: "5 Frascos", sub: "150 dias de tratamento", price: "R$ 147,00", priceCents: 14700, fromCents: 48500, image: imgKit5 },
} as const;

type KitId = keyof typeof KITS;

export const Route = createFileRoute("/checkout/$kit")({
  beforeLoad: ({ params }) => {
    if (!(params.kit in KITS)) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Checkout — Sucupira Composta" },
      { name: "description", content: "Finalize sua compra com PIX com aprovação instantânea." },
      { property: "og:title", content: "Checkout — Sucupira Composta" },
      { property: "og:description", content: "Finalize sua compra com PIX com aprovação instantânea." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type PaymentResult = {
  id: string;
  status: string;
  amount: number;
  pix: { code: string; qrcode_base64: string; expires_at?: string } | null;
  card: { card_flag?: string; card_token?: string } | null;
  orderProof?: string;
};

// Tracking is optional: a third-party error must never interrupt payment.
function trackCheckout(...args: unknown[]): void {
  try {
    const tracker = (window as typeof window & { fbq?: (...values: unknown[]) => void }).fbq;
    if (typeof tracker === "function") tracker(...args);
  } catch {
    // Keep the purchase flow available even when a tracker fails.
  }
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const maskCPF = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const maskPhone = (s: string) => {
  const d = normalizeCheckoutPhone(s);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};
const maskCEP = (s: string) => onlyDigits(s).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
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

const isValidPhone = (raw: string) => {
  const d = onlyDigits(raw);
  if (d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  return ddd >= 11 && ddd <= 99 && d[2] === "9";
};

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getCampaignQuery(): string {
  const current = new URLSearchParams(window.location.search);
  const cookieValues = new Map(
    document.cookie.split(";").map((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return [part.trim(), ""];
      return [part.slice(0, separator).trim(), decodeCampaignCookie(part.slice(separator + 1))];
    }),
  );
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "ttclid", "src", "sck"].forEach((key) => {
    if (!current.has(key)) {
      const stored = cookieValues.get(`lv_${key}`);
      if (stored) current.set(key, stored);
    }
  });
  const fbc = cookieValues.get("_fbc") ?? cookieValues.get("_lv_fbc");
  if (fbc && !current.has("fbc")) current.set("fbc", fbc);
  return current.toString();
}

function CheckoutPage() {
  const { kit: kitId } = Route.useParams();
  const navigate = useNavigate();
  const baseKitId = kitId as KitId;
  const kit = KITS[baseKitId];

  const [form, setForm] = useState({
    name: "", email: "", document: "", phone: "", zip: "", number: "", complement: "",
    street: "", neighborhood: "", city: "", state: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(false);
  const [shipping, setShipping] = useState<"free" | "express">("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const cepTimer = useRef<number | null>(null);
  const cepController = useRef<AbortController | null>(null);
  const checkoutForm = useRef<HTMLFormElement | null>(null);
  const submitInFlight = useRef(false);
  const resolvedCep = useRef<string | null>(null);
  const payment = useOrderPayment(result?.orderProof);

  useEffect(() => {
    if (payment.data?.paid) void navigate({ to: payment.data.eligible ? "/upsell" : "/obrigado" });
  }, [payment.data?.paid, payment.data?.eligible, navigate]);

  const nameValid = /^\S{2,}(\s+\S+)+$/.test(form.name.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim());
  const cpfValid = isValidCPF(form.document);
  const phoneValid = isValidPhone(form.phone);
  const zipValid = onlyDigits(form.zip).length === 8;

  // Frete expresso: valor entre R$ 5,00 e R$ 7,00 com centavos quebrados, estável por CEP.
  const cepDigits = onlyDigits(form.zip);
  const expressCents = expressShippingCents(cepDigits);
  const shippingCents = cepFilled && shipping === "express" ? expressCents : 0;
  const totalCents = kit.priceCents + shippingCents;

  useEffect(() => {
    const cep = cepDigits;
    setCepLoading(false);
    setCepError(null);
    resolvedCep.current = null;
    setCepFilled(false);
    setManualAddress(false);
    setForm(current => ({ ...current, street: "", neighborhood: "", city: "", state: "" }));
    if (cep.length !== 8) {
      setCepFilled(false);
      cepController.current?.abort();
      return;
    }
    if (cepTimer.current) window.clearTimeout(cepTimer.current);
    cepController.current?.abort();
    const controller = new AbortController();
    cepController.current = controller;
    cepTimer.current = window.setTimeout(async () => {
      setCepLoading(true);
      try {
        const d = await fetchAddress(cep, controller.signal);
        if (controller.signal.aborted) return;
        resolvedCep.current = cep;
        setForm(f => ({ ...f, ...d }));
        setManualAddress(!d.street || !d.neighborhood);
        setCepFilled(true);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setCepFilled(false);
        if (cause instanceof AddressLookupError && cause.reason === "not_found") {
          setCepError("CEP não encontrado");
        } else {
          resolvedCep.current = cep;
          setManualAddress(true);
          setCepError(null);
        }
      } finally {
        if (cepController.current === controller) setCepLoading(false);
      }
    }, 250);
    return () => {
      if (cepTimer.current) window.clearTimeout(cepTimer.current);
      controller.abort();
    };
  }, [cepDigits]);

  useEffect(() => {
    setError(null);
  }, [form.name, form.email, form.phone, form.document, form.zip, form.number]);

  // Meta Pixel: InitiateCheckout ao abrir o checkout
  useEffect(() => {
      trackCheckout("track", "InitiateCheckout", {
        content_ids: [baseKitId], content_type: "product", content_name: kit.title,
        value: kit.priceCents / 100, currency: "BRL", num_items: 1,
      });
  }, [baseKitId]);

  const submit = async () => {
    if (submitInFlight.current) return;
    const readValue = (name: string) => {
      const field = checkoutForm.current?.elements.namedItem(name);
      return field instanceof HTMLInputElement ? field.value : "";
    };
    const submittedForm = {
      ...form,
      name: readValue("name").trim(),
      email: readValue("email").trim(),
      phone: normalizeCheckoutPhone(readValue("phone")),
      document: readValue("document"),
      zip: normalizeCheckoutZip(readValue("zip")),
      number: readValue("number").trim(),
      complement: readValue("complement"),
      street: manualAddress ? readValue("street").trim() : form.street,
      neighborhood: manualAddress ? readValue("neighborhood").trim() : form.neighborhood,
      city: manualAddress ? readValue("city").trim() : form.city,
      state: manualAddress ? readValue("state").trim().toUpperCase() : form.state,
    };
    const submittedNameValid = /^\S{2,}(\s+\S+)+$/.test(submittedForm.name);
    const submittedEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(submittedForm.email);
    const submittedPhoneValid = isValidPhone(submittedForm.phone);
    const submittedCpfValid = isValidCPF(submittedForm.document);
    const submittedZipValid = onlyDigits(submittedForm.zip).length === 8;
    if (!submittedNameValid || !submittedEmailValid || !submittedPhoneValid || !submittedCpfValid || !submittedZipValid || !submittedForm.number) {
      setTouched({ name: true, email: true, phone: true, document: true, zip: true, number: true });
      const invalidField = !submittedNameValid ? "name" : !submittedEmailValid ? "email" : !submittedPhoneValid ? "phone" : !submittedCpfValid ? "document" : !submittedZipValid ? "zip" : "number";
      const messages: Record<string, string> = {
        name: "Informe seu nome e sobrenome.",
        email: "Confira o e-mail informado.",
        phone: "Informe um celular válido com DDD.",
        document: "Confira o CPF informado.",
        zip: cepError || "Informe um CEP válido e aguarde o endereço aparecer.",
        number: "Informe o número do endereço.",
      };
      setError(messages[invalidField]);
      window.requestAnimationFrame(() => document.getElementById(invalidField)?.focus());
      return;
    }
    submitInFlight.current = true;
    setLoading(true);
    setError(null);
    if (cepTimer.current) window.clearTimeout(cepTimer.current);
    cepController.current?.abort();
    setCepLoading(false);
    let submittedAddress = {
      street: submittedForm.street,
      neighborhood: submittedForm.neighborhood,
      city: submittedForm.city,
      state: submittedForm.state,
    };
    if (resolvedCep.current !== submittedForm.zip || (!manualAddress && (!submittedAddress.city || !submittedAddress.state))) {
      try {
        submittedAddress = await fetchAddress(submittedForm.zip);
        resolvedCep.current = submittedForm.zip;
        setForm((current) => ({ ...current, ...submittedForm, ...submittedAddress }));
        setCepFilled(true);
        setCepError(null);
        setManualAddress(!submittedAddress.street || !submittedAddress.neighborhood);
      } catch (cause) {
        // Never send an address belonging to the previous ZIP code.
        const missing = cause instanceof AddressLookupError && cause.reason === "not_found";
        setCepError(missing ? "CEP não encontrado" : null);
        setManualAddress(!missing);
        if (!missing) resolvedCep.current = submittedForm.zip;
        setForm(current => ({ ...current, zip: maskCEP(submittedForm.zip), street: "", neighborhood: "", city: "", state: "" }));
        setError(missing ? "CEP não encontrado" : "Preencha o endereço de entrega para continuar.");
        submitInFlight.current = false;
        setLoading(false);
        return;
      }
    }
    if (!submittedAddress.street || !submittedAddress.neighborhood || !submittedAddress.city || submittedAddress.state.length !== 2) {
      setManualAddress(true);
      setError("Preencha o endereço de entrega para continuar.");
      submitInFlight.current = false;
      setLoading(false);
      return;
    }
    const submittedExpressCents = expressShippingCents(submittedForm.zip);
    const submittedShippingCents = shipping === "express" ? submittedExpressCents : 0;
    const submittedShipping = submittedShippingCents > 0 ? "express" : "free";
    const submittedTotalCents = kit.priceCents + submittedShippingCents;
    const fbData = {
      content_ids: [baseKitId], content_type: "product", content_name: kit.title,
      value: submittedTotalCents / 100, currency: "BRL",
    };
    try {
      trackCheckout("trackCustom", "PixSolicitado", { ...fbData, payment_type: "pix" }, { eventID: `payment_${crypto.randomUUID()}` });
      const controller = new AbortController();
      const requestTimeout = window.setTimeout(() => controller.abort(), 25000);
      const r = await fetch("/api/fruitfy-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          kit: baseKitId,
          shipping: { method: submittedShipping, amount: submittedShippingCents },
          buyer: { name: submittedForm.name, email: submittedForm.email, document: submittedForm.document, phone: submittedForm.phone },
          address: {
            zip: submittedForm.zip, street: submittedAddress.street, number: submittedForm.number, complement: submittedForm.complement,
            neighborhood: submittedAddress.neighborhood, city: submittedAddress.city, state: submittedAddress.state,
          },
          utm: getCampaignQuery(),
        }),
      }).finally(() => window.clearTimeout(requestTimeout));
      const json = await r.json().catch(() => null);
      if (!r.ok || !json?.pix?.code) throw new Error(json?.error || "Falha ao gerar PIX.");
      setResult({ id: json.id, status: json.status, amount: json.amount, pix: json.pix, card: null, orderProof: json.orderProof });
      if (json.orderProof) {
        try {
          sessionStorage.setItem("sucupira_original_order", JSON.stringify({
            proof: json.orderProof,
            buyer: { name: submittedForm.name, email: submittedForm.email, document: submittedForm.document, phone: submittedForm.phone },
            address: { zip: submittedForm.zip, street: submittedAddress.street, number: submittedForm.number, complement: submittedForm.complement, neighborhood: submittedAddress.neighborhood, city: submittedAddress.city, state: submittedAddress.state },
            utm: getCampaignQuery(),
          }));
        } catch { /* Storage is optional; checkout remains usable. */ }
      }
      trackCheckout("track", "AddPaymentInfo", { ...fbData, payment_type: "pix" }, { eventID: `pix_${json.id}` });
      trackCheckout("trackCustom", "PixGerado", { ...fbData, order_id: json.id });
    } catch (err: unknown) {
      const message = err instanceof DOMException && err.name === "AbortError"
        ? "O pagamento demorou para responder. Tente novamente."
        : err instanceof Error ? err.message : "Não foi possível gerar o PIX. Tente novamente.";
      trackCheckout("trackCustom", "PixErro", { ...fbData, payment_type: "pix", error: message.slice(0, 100) });
      setError(message);
    } finally {
      submitInFlight.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result) {
      const expiresAt = result.pix?.expires_at ? Date.parse(result.pix.expires_at) : Date.now() + 15 * 60 * 1000;
      const updateTime = () => setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
      updateTime();
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [result]);

  useEffect(() => {
    const pixCode = result?.pix?.code;
    if (!pixCode) {
      setQrCodeUrl(null);
      setQrCodeError(false);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    setQrCodeUrl(null);
    setQrCodeError(false);

    void import("uqr")
      .then(({ renderSVG }) => {
        if (!active) return;
        const svg = renderSVG(pixCode, { ecc: "M", border: 4 });
        objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        setQrCodeUrl(objectUrl);
      })
      .catch(() => {
        if (active) setQrCodeError(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [result?.pix?.code]);

  const formatTime = (seconds: number) => {
    // Long provider expirations must read as hours, not thousands of minutes.
    const s = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = (s % 60).toString().padStart(2, '0');
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:${secs}` : `${mins}:${secs}`;
  };

  if (result) {
    if (result.pix) {
      return (
        <div className="min-h-screen bg-checkout-neutral-soft p-4 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="bg-checkout-success p-6 text-checkout-success-foreground text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-sans tracking-normal">PIX Gerado com Sucesso!</h1>
              <p className="text-checkout-success-foreground text-sm mt-1">Aguardando confirmação do pagamento</p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-card p-3 rounded-lg border border-border relative group">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl}
                      alt="PIX QR Code"
                      width={224}
                      height={224}
                      className="w-48 h-48 md:w-56 md:h-56 bg-card"
                    />
                  ) : (
                    <div className="w-48 h-48 md:w-56 md:h-56 flex flex-col items-center justify-center text-muted-foreground" role="status">
                      {qrCodeError ? <AlertCircle size={48} strokeWidth={1.5} /> : <QrCode size={64} strokeWidth={1} className="animate-pulse" />}
                      <p className="text-xs mt-2">{qrCodeError ? "Use o código PIX abaixo" : "Gerando QR Code..."}</p>
                    </div>
                  )}

                </div>
                
                <div className="flex items-center gap-2 text-checkout-assurance bg-checkout-assurance-soft px-4 py-2 rounded-full text-sm font-medium">
                  <Clock size={16} />
                  <span>Expira em: <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span></span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-bold"><span>Total</span><span>{formatBRL(result.amount)}</span></div>
                <p id="pix-code-label" className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Código PIX (Copia e Cola)</p>
                <div className="relative">
                  <textarea 
                    readOnly aria-labelledby="pix-code-label"
                    value={result.pix.code} 
                    className="w-full p-4 bg-checkout-neutral-soft border border-border rounded-lg text-sm font-mono resize-none focus-visible:outline-2 focus-visible:outline-ring h-24 mb-3"
                  />
                  <Button 
                    onClick={async () => {
                      const code = result.pix?.code;
                      if (!code) return;
                      let success = false;
                      try {
                        await navigator.clipboard.writeText(code);
                        success = true;
                      } catch {
                        const field = document.querySelector<HTMLTextAreaElement>("textarea[readonly]");
                        if (field) {
                          field.focus();
                          field.select();
                          field.setSelectionRange(0, code.length);
                          try { success = document.execCommand("copy"); } catch { success = false; }
                        }
                      }
                      setCopied(success);
                      if (success) setTimeout(() => setCopied(false), 2000);
                    }} 
                    aria-live="polite" className="w-full min-h-12 flex items-center gap-2 bg-checkout-success text-checkout-success-foreground px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-checkout-success-strong transition active:scale-95"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={14} />
                        COPIADO
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        COPIAR CÓDIGO
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-5 space-y-3">
                <h3 className="text-checkout-info font-bold text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Como finalizar o pagamento?
                </h3>
                <ol className="text-sm leading-relaxed text-foreground space-y-2 list-decimal list-inside">
                  <li>Abra o aplicativo do seu banco.</li>
                  <li>Escolha a opção <strong>PIX</strong> e depois <strong>PIX Copia e Cola</strong> ou <strong>Ler QR Code</strong>.</li>
                  <li>Cole o código ou aponte a câmera para o QR Code acima.</li>
                  <li>Confira os dados e confirme o pagamento.</li>
                </ol>
              </div>

              <Button
                onClick={async () => {
                  if (!result.orderProof) { setError("Não foi possível validar este pedido. Entre em contato com o suporte."); return; }
                  setLoading(true); setError(null);
                  try {
                    const response = await fetch("/api/fruitfy-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proof: result.orderProof }) });
                    const status = await response.json().catch(() => null);
                    if (!response.ok) throw new Error(status?.error || "Não foi possível confirmar o pagamento agora.");
                    if (!status?.paid) { setError("O pagamento ainda não foi confirmado pela instituição. Aguarde alguns instantes e tente novamente."); return; }
                    if (status.eligible) navigate({ to: "/upsell" }); else navigate({ to: "/obrigado" });
                  } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao consultar o pagamento."); }
                  finally { setLoading(false); }
                }}
                disabled={loading}
                className="w-full min-h-12 py-4 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-border transition"
              >
                {loading ? "Verificando pagamento..." : "Já realizei o pagamento"}
              </Button>
              {error && <p role="alert" className="text-sm text-destructive text-center">{error}</p>}
            </div>
            
            <div className="bg-checkout-neutral-soft p-4 border-t flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Compra Segura</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Pagamento 100% seguro via PIX</span>
            </div>
          </div>
        </div>
      );
    }
  }


  const err = (k: string, bad: boolean) => (touched[k] && bad ? true : false);

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="px-2 text-muted-foreground">
        <Link to="/" className="flex items-center gap-1 text-sm font-semibold">
          <ArrowLeft size={18} /> Voltar
        </Link>
        </Button>
        <div className="text-center min-w-0">
          <span className="block text-sm sm:text-base font-bold text-primary">Sucupira Composta</span>
          <span className="block text-xs text-muted-foreground">Checkout Seguro</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-checkout-success-strong shrink-0"><Lock size={14} aria-hidden="true" /> SSL</span>
      </header>
      <main className="container mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-8">
        <form
          ref={checkoutForm}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void submit();
          }}
          noValidate
          className="space-y-4"
        >
          <div>
            <h1 className="text-xl font-bold font-sans tracking-normal">Resumo do Pedido</h1>
            <p className="text-sm leading-relaxed text-muted-foreground mt-1">Finalize em menos de 1 minuto — seus dados ficam 100% protegidos</p>
          </div>
          <div className="flex gap-3 sm:gap-4 items-center rounded-lg border border-border bg-card p-4">
            <img src={kit.image} alt={kit.title} width={80} height={80} decoding="async" className="w-20 h-20 object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{kit.title}</div>
              <div className="text-xs text-muted-foreground">{kit.sub}</div>
              <div className="text-xs text-muted-foreground mt-1">De <span className="line-through">{formatBRL(kit.fromCents)}</span> por <span className="font-bold text-foreground">{kit.price}</span></div>
            </div>
            <div className="text-base sm:text-lg font-bold text-primary shrink-0 tabular-nums">{kit.price}</div>
          </div>


          <section className={STEP}>
            <StepTitle n={1}>Dados Pessoais</StepTitle>
            <Field id="name" name="name" label="Nome Completo" autoComplete="name" autoCapitalize="words" autoCorrect="off" spellCheck={false} enterKeyHint="next" placeholder="Nome e sobrenome" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch("name")}
              error={err("name", !nameValid) ? "Digite nome e sobrenome" : undefined} ok={nameValid} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="email" name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" placeholder="seu@email.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value.trim()})} onBlur={() => touch("email")}
                error={err("email", !emailValid) ? "E-mail inválido" : undefined} ok={emailValid} />
              <Field id="phone" name="phone" label="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" enterKeyHint="next" placeholder="(00) 00000-0000" value={form.phone}
                onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} onBlur={() => touch("phone")}
                error={err("phone", !phoneValid) ? "Celular inválido" : undefined} ok={phoneValid} />
            </div>
            <Field id="document" name="document" label="CPF" inputMode="numeric" autoComplete="off" enterKeyHint="next" placeholder="000.000.000-00" value={form.document}
              onChange={e => setForm({...form, document: maskCPF(e.target.value)})} onBlur={() => touch("document")}
              error={err("document", !cpfValid) ? "CPF inválido" : undefined} ok={cpfValid} />
            <p className="text-sm leading-relaxed text-muted-foreground flex items-start gap-2"><Lock size={15} className="shrink-0 mt-0.5" aria-hidden="true" />CPF e celular são exigidos pela operadora para gerar o PIX com segurança.</p>
          </section>

          <section className={STEP}>
            <StepTitle n={2}>Endereço de Entrega</StepTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field id="zip" name="zip" label="CEP" inputMode="numeric" autoComplete="postal-code" enterKeyHint="next" placeholder="00000-000" value={form.zip}
                onChange={e => setForm({...form, zip: maskCEP(e.target.value)})} onBlur={() => touch("zip")}
                error={cepError ?? (err("zip", onlyDigits(form.zip).length !== 8) ? "CEP incompleto" : undefined)} ok={cepFilled} />
              <Field id="number" name="number" label="Número" inputMode="numeric" autoComplete="off" enterKeyHint="done" placeholder="Nº" value={form.number}
                onChange={e => setForm({...form, number: e.target.value.slice(0, 10)})} onBlur={() => touch("number")}
                error={err("number", !form.number.trim()) ? "Informe o número" : undefined} ok={!!form.number.trim()} />
            </div>
            {cepLoading && <div role="status" className="text-xs text-muted-foreground flex items-center gap-2"><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Buscando endereço...</div>}
            {manualAddress && (
              <div className="space-y-4">
                {([
                  { name: "street", label: "Rua", autoComplete: "address-line1", max: 255 },
                  { name: "neighborhood", label: "Bairro", autoComplete: "address-level3", max: 100 },
                  { name: "city", label: "Cidade", autoComplete: "address-level2", max: 100 },
                  { name: "state", label: "UF", autoComplete: "address-level1", max: 2 },
                ] as const).map(field => (
                  <Field key={field.name} id={field.name} name={field.name} label={field.label} autoComplete={field.autoComplete}
                    maxLength={field.max} value={form[field.name]} onBlur={() => touch(field.name)}
                    onChange={e => setForm(current => ({ ...current, [field.name]: field.name === "state" ? e.target.value.toUpperCase().replace(/[^A-Z]/g, "") : e.target.value }))}
                    error={err(field.name, !form[field.name].trim()) ? `Informe ${field.label.toLowerCase()}` : undefined} />
                ))}
              </div>
            )}
            {(cepFilled || manualAddress) && (
              <>
                {cepFilled && !manualAddress && <div role="status" className="text-sm leading-relaxed bg-checkout-neutral-soft p-3 rounded-lg text-foreground flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
                  <span>{form.street || "Endereço"}{form.neighborhood ? `, ${form.neighborhood}` : ""} — {form.city}/{form.state}</span>
                </div>}
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer py-2 min-h-10 focus-visible:outline-2 focus-visible:outline-ring">Complemento (opcional)</summary>
                  <div className="mt-3">
                    <Field id="complement" name="complement" label="Complemento (opcional)" required={false} placeholder="Apto, bloco, referência" value={form.complement}
                      onChange={e => setForm({...form, complement: e.target.value.slice(0, 60)})} />
                  </div>
                </details>
              </>
            )}
          </section>
          <section className={STEP}>
              <StepTitle n={3}>Frete</StepTitle>
              {!cepFilled ? <p className="text-sm text-muted-foreground flex items-center gap-2"><Truck size={16} aria-hidden="true" />Informe o CEP para ver as opções de entrega.</p> : (
              <RadioGroup aria-label="Frete" orientation="vertical" value={shipping} onValueChange={value => { if (value === "free" || value === "express") setShipping(value); }}>
                {([
                  { id: "free", title: "Frete Grátis", eta: "3 a 5 dias úteis", cents: 0 },
                  { id: "express", title: "Entrega Expressa", eta: "1 a 2 dias úteis", cents: expressCents },
                ] as const).map(o => (
                  <label key={o.id} htmlFor={`shipping-${o.id}`} className={cn("w-full p-4 rounded-lg border flex items-center justify-between text-left transition-colors cursor-pointer gap-3 focus-within:ring-2 focus-within:ring-ring", shipping === o.id ? "border-checkout-success bg-checkout-success-soft" : "border-border hover:border-muted-foreground")}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id={`shipping-${o.id}`} value={o.id} aria-label={o.title} className="shrink-0 border-checkout-success text-checkout-success [&_svg]:fill-checkout-success" />
                      <div><p className="text-sm font-bold">{o.title}</p><p className="text-xs text-muted-foreground">{o.eta}</p></div>
                    </div>
                    <span className={cn("font-bold text-sm shrink-0", o.cents === 0 && "text-checkout-success-strong")}>{o.cents === 0 ? "Grátis" : formatBRL(o.cents)}</span>
                  </label>
                ))}
              </RadioGroup>)}
          </section>
          <section className={STEP}>
            <StepTitle n={4}>Forma de Pagamento</StepTitle>
            <div className="p-4 rounded-lg border border-checkout-success bg-checkout-success-soft font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-3"><QrCode size={22} className="shrink-0 text-checkout-success-strong" /><div><p className="text-sm">PIX</p><p className="text-xs text-checkout-success-strong font-normal">Aprovação imediata • sem cadastrar cartão</p></div></div>
              <div className="text-checkout-success-strong text-xs flex items-center gap-1 shrink-0"><CheckCircle2 size={16} aria-hidden="true" />Selecionado</div>
            </div>
          </section>

          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-sm space-y-3 tabular-nums shadow-sm">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">{kit.title}</span><span>{formatBRL(kit.priceCents)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Frete</span><span>{!cepFilled ? "Informe o CEP" : shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</span></div>
            <div className="flex justify-between gap-3 text-checkout-success-strong font-semibold"><span>Você economiza</span><span>{formatBRL(kit.fromCents - kit.priceCents)}</span></div>
            <div className="flex justify-between items-baseline font-bold text-lg pt-3 border-t"><span>Total</span><span className="text-xl text-foreground">{formatBRL(totalCents)}</span></div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <ShieldCheck size={28} className="text-checkout-success-strong shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-foreground">Garantia incondicional de 30 dias</p>
              <p className="text-sm leading-relaxed text-muted-foreground mt-1">Se você não ficar satisfeito(a) com o produto, devolvemos 100% do valor. Sem perguntas.</p>
            </div>
          </div>

          {error && <div role="alert" aria-live="assertive" className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full min-h-14 py-4 bg-checkout-success text-checkout-success-foreground rounded-lg font-bold text-lg shadow-sm hover:bg-checkout-success-strong focus-visible:ring-2 focus-visible:ring-checkout-success disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <LoaderCircle size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
            {loading ? "Gerando PIX..." : "COMPRAR AGORA"}
          </Button>
          <div className="flex items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Compra segura</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Garantia de 30 dias</span>
            <span className="flex items-center gap-1"><Clock size={12} /> PIX aprovado na hora</span>
          </div>
          <p className="text-center text-xs text-muted-foreground">★ 4,9/5 de satisfação — +2.847 clientes satisfeitos</p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

const STEP = "space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5";

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="font-bold tracking-normal flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground" aria-hidden="true">{n}</span>
      {children}
    </h2>
  );
}

function Field({ label, error, ok, ...props }: { label: string; error?: string; ok?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = props.id ? `${props.id}-error` : undefined;
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="relative">
        <input {...props} required={props.required ?? true} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
          className={cn("w-full h-12 px-3 pr-10 text-base text-foreground bg-card placeholder:text-muted-foreground border rounded-lg focus:ring-2 outline-none transition-colors", error ? "border-destructive focus:ring-destructive/30" : "border-input hover:border-muted-foreground focus:border-checkout-success focus:ring-checkout-success/20", props.className)} />
        {ok && !error && <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-checkout-success" aria-hidden="true" />}
      </div>
      {error && <span id={errorId} className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
