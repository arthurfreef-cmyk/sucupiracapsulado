import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, Copy, CheckCircle2, Clock, QrCode, AlertCircle, ArrowLeft, Lock, Truck } from "lucide-react";


const KITS = {
  k1: { title: "1 Frasco", sub: "30 dias de tratamento", price: "R$ 27,00", priceCents: 2700, fromCents: 9700, image: "https://customer-assets.emergentagent.com/job_vida-sem-limites-1/artifacts/rq9lslj7_kit1frasco.png" },
  k3: { title: "3 Frascos", sub: "90 dias de tratamento", price: "R$ 97,00", priceCents: 9700, fromCents: 29100, image: "https://customer-assets.emergentagent.com/job_vida-sem-limites-1/artifacts/5kgkordi_sucupira%203%20frascos.png" },
  k5: { title: "5 Frascos", sub: "150 dias de tratamento", price: "R$ 147,00", priceCents: 14700, fromCents: 48500, image: "https://customer-assets.emergentagent.com/job_vida-sem-limites-1/artifacts/nf8gbzyx_kit5frasco.png" },
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
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type PaymentResult = {
  id: string;
  status: string;
  amount: number;
  pix: { code: string; qrcode_base64: string } | null;
  card: { card_flag?: string; card_token?: string } | null;
};

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
const maskCardNumber = (s: string) => onlyDigits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (s: string) => onlyDigits(s).slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/");

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
  if (ddd < 11 || ddd > 99) return false;
  return d[2] === "9";
};

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CheckoutPage() {
  const { kit: kitId } = Route.useParams();
  const navigate = useNavigate();
  const baseKitId = kitId as KitId;
  const kit = KITS[baseKitId];

  const [method, setMethod] = useState<"pix">("pix");
  const [form, setForm] = useState({
    name: "", email: "", document: "", phone: "", zip: "", number: "", complement: "",
    street: "", neighborhood: "", city: "", state: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<"free" | "express">("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const cepTimer = useRef<number | null>(null);

  const nameValid = /^\S{2,}(\s+\S+)+$/.test(form.name.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim());
  const cpfValid = isValidCPF(form.document);
  const phoneValid = isValidPhone(form.phone);
  const zipValid = onlyDigits(form.zip).length === 8;
  const formValid = nameValid && emailValid && cpfValid && phoneValid && zipValid && cepFilled && !!form.number.trim();

  // Frete expresso: valor entre R$ 5,00 e R$ 7,00 com centavos quebrados, estável por CEP.
  const cepDigits = onlyDigits(form.zip);
  let h = 7;
  for (const c of cepDigits) h = (h * 31 + Number(c)) % 100003;
  let expressCents = 500 + (h % 200);
  if (expressCents % 10 === 0) expressCents += 7;
  const shippingCents = cepFilled && shipping === "express" ? expressCents : 0;
  const totalCents = kit.priceCents + shippingCents;

  useEffect(() => {
    const cep = onlyDigits(form.zip);
    setCepError(null);
    if (cep.length !== 8) { setCepFilled(false); return; }
    if (cepTimer.current) window.clearTimeout(cepTimer.current);
    cepTimer.current = window.setTimeout(async () => {
      setCepLoading(true);
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const d = await r.json();
        if (!d.erro) {
          setForm(f => ({ ...f, street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf }));
          setCepFilled(true);
        } else {
          setCepFilled(false);
          setCepError("CEP não encontrado");
        }
      } catch { setCepError("Não foi possível buscar o CEP"); } finally { setCepLoading(false); }
    }, 250);
  }, [form.zip]);

  // Meta Pixel: InitiateCheckout ao abrir o checkout
  useEffect(() => {
    const w = window as any;
    if (typeof w.fbq === "function") {
      w.fbq("track", "InitiateCheckout", {
        content_ids: [baseKitId], content_type: "product", content_name: kit.title,
        value: kit.priceCents / 100, currency: "BRL", num_items: 1,
      });
    }
  }, [baseKitId]);

  const submit = async () => {
    if (loading) return;
    const readValue = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value ?? "";
    const submittedForm = {
      ...form,
      name: readValue("name").trim(),
      email: readValue("email").trim(),
      phone: readValue("phone"),
      document: readValue("document"),
      zip: readValue("zip"),
      number: readValue("number").trim(),
      complement: readValue("complement"),
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
    setLoading(true);
    setError(null);
    const w = window as any;
    let submittedAddress = {
      street: submittedForm.street,
      neighborhood: submittedForm.neighborhood,
      city: submittedForm.city,
      state: submittedForm.state,
    };
    if (!submittedAddress.city || !submittedAddress.state) {
      try {
        const addressResponse = await fetch(`https://viacep.com.br/ws/${onlyDigits(submittedForm.zip)}/json/`);
        const address = await addressResponse.json();
        if (address.erro) throw new Error("CEP não encontrado.");
        submittedAddress = {
          street: address.logradouro ?? "",
          neighborhood: address.bairro ?? "",
          city: address.localidade ?? "",
          state: address.uf ?? "",
        };
        setForm((current) => ({ ...current, ...submittedForm, ...submittedAddress }));
        setCepFilled(true);
      } catch {
        setError("Não foi possível confirmar o CEP. Confira o número e tente novamente.");
        setLoading(false);
        document.getElementById("zip")?.focus();
        return;
      }
    }
    let submittedExpressCents = 500;
    for (const character of onlyDigits(submittedForm.zip)) submittedExpressCents = (submittedExpressCents * 31 + Number(character)) % 100003;
    submittedExpressCents = 500 + (submittedExpressCents % 200);
    if (submittedExpressCents % 10 === 0) submittedExpressCents += 7;
    const submittedShippingCents = shipping === "express" ? submittedExpressCents : 0;
    const submittedTotalCents = kit.priceCents + submittedShippingCents;
    const fbData = {
      content_ids: [baseKitId], content_type: "product", content_name: kit.title,
      value: submittedTotalCents / 100, currency: "BRL",
    };
    try {
      if (typeof w.fbq === "function") {
        // Advanced Matching: melhora a correspondência de eventos
        const parts = submittedForm.name.toLowerCase().split(/\s+/);
        w.fbq("init", "1590108412755712", {
          em: submittedForm.email.toLowerCase(), ph: "55" + onlyDigits(submittedForm.phone),
          fn: parts[0], ln: parts.slice(1).join(" "), ct: submittedAddress.city.toLowerCase(),
          st: submittedAddress.state.toLowerCase(), zp: onlyDigits(submittedForm.zip), country: "br",
          external_id: onlyDigits(submittedForm.document),
        });
        w.fbq("track", "AddPaymentInfo", { ...fbData, payment_type: "pix" });
      }
      const r = await fetch("/api/buckpay-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kit: baseKitId,
          kit: baseKitId,
          buyer: { name: submittedForm.name, email: submittedForm.email, document: submittedForm.document, phone: submittedForm.phone },
          address: {
            zip: submittedForm.zip, street: submittedAddress.street, number: submittedForm.number, complement: submittedForm.complement,
            neighborhood: submittedAddress.neighborhood, city: submittedAddress.city, state: submittedAddress.state,
          },
          utm: typeof window !== "undefined" ? window.location.search : "",
        }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok || !json?.pix?.code) throw new Error(json?.error || "Falha ao gerar PIX.");
      if (typeof w.fbq === "function") {
        w.fbq("track", "AddPaymentInfo", fbData, { eventID: `pix_${json.id}` });
        w.fbq("trackCustom", "PixGerado", { ...fbData, order_id: json.id });
      }
      setResult({ id: json.id, status: json.status, amount: json.amount, pix: json.pix, card: null });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && method === "pix") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [result, method]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (result) {
    if (method === "pix" && result.pix) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-emerald-600 p-6 text-white text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold">PIX Gerado com Sucesso!</h1>
              <p className="text-emerald-100 text-sm mt-1">Aguardando confirmação do pagamento</p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-gray-100 p-4 rounded-2xl relative group">
                  {result.pix.qrcode_base64 ? (
                    <img 
                      src={`data:image/png;base64,${result.pix.qrcode_base64}`} 
                      alt="PIX QR Code"
                      className="w-48 h-48 md:w-56 md:h-56"
                    />
                  ) : (
                    <div className="w-48 h-48 md:w-56 md:h-56 flex flex-col items-center justify-center text-gray-400">
                      <QrCode size={64} strokeWidth={1} />
                      <p className="text-xs mt-2">QR Code Indisponível</p>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition rounded-2xl pointer-events-none">
                    <span className="text-emerald-600 font-bold text-sm">Escaneie para Pagar</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium">
                  <Clock size={16} />
                  <span>Expira em: <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span></span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Código PIX (Copia e Cola)</p>
                <div className="relative">
                  <textarea 
                    readOnly 
                    value={result.pix.code} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono resize-none focus:outline-none h-24"
                  />
                  <button 
                    onClick={() => { 
                      navigator.clipboard.writeText(result.pix?.code ?? ""); 
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }} 
                    className="absolute bottom-3 right-3 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md hover:bg-emerald-700 transition active:scale-95"
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
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <h3 className="text-blue-800 font-bold text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Como finalizar o pagamento?
                </h3>
                <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Abra o aplicativo do seu banco.</li>
                  <li>Escolha a opção <strong>PIX</strong> e depois <strong>PIX Copia e Cola</strong> ou <strong>Ler QR Code</strong>.</li>
                  <li>Cole o código ou aponte a câmera para o QR Code acima.</li>
                  <li>Confira os dados e confirme o pagamento.</li>
                </ol>
              </div>

              <button 
                onClick={() => navigate({ to: "/obrigado" })}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
              >
                Já realizei o pagamento
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 border-t flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Compra Segura</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Pagamento Processado por BuckPay</span>
            </div>
          </div>
        </div>
      );
    }
  }


  const err = (k: string, bad: boolean) => (touched[k] && bad ? true : false);

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[var(--brand)]">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <span className="font-bold text-[var(--brand)]">Checkout Seguro</span>
        <Lock size={16} className="text-emerald-600" />
      </header>
      <main className="container mx-auto max-w-2xl p-4 md:p-8">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void submit();
          }}
          noValidate
          className="bg-white rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h1 className="text-xl font-bold">Resumo do Pedido</h1>
          <div className="flex gap-4 items-center bg-[var(--cream)] p-4 rounded-xl">
            <img src={kit.image} alt={kit.title} width={64} height={64} className="w-16 h-16 object-contain" />
            <div className="flex-1">
              <div className="font-bold text-sm">{kit.title}</div>
              <div className="text-xs text-muted-foreground">{kit.sub}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">De <span className="line-through">{formatBRL(kit.fromCents)}</span> por <span className="font-bold">{kit.price}</span></div>
            </div>
            <div className="text-lg font-bold text-[var(--brand)]">{kit.price}</div>
          </div>

          {baseKitId === "k1" && (
            <button type="button" onClick={() => setBump(b => !b)}
              className={`w-full text-left p-4 rounded-xl border-2 border-dashed transition ${bump ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-emerald-400"}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${bump ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                  {bump && <CheckCircle2 size={13} className="text-white" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">Adicionar 2º frasco por +R$ 20,00</p>
                  <p className="text-xs text-gray-500 mt-0.5">Complete 60 dias de tratamento em vez de 30, sem custo extra de frete.</p>
                </div>
              </div>
            </button>
          )}

          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2">1. Dados Pessoais</h2>
            <Field id="name" name="name" label="Nome Completo" autoComplete="name" placeholder="Nome e sobrenome" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch("name")}
              error={err("name", !nameValid) ? "Digite nome e sobrenome" : undefined} ok={nameValid} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="email" name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value.trim()})} onBlur={() => touch("email")}
                error={err("email", !emailValid) ? "E-mail inválido" : undefined} ok={emailValid} />
              <Field id="phone" name="phone" label="Celular (WhatsApp)" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(00) 00000-0000" value={form.phone}
                onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} onBlur={() => touch("phone")}
                error={err("phone", !phoneValid) ? "Celular inválido" : undefined} ok={phoneValid} />
            </div>
            <Field id="document" name="document" label="CPF" inputMode="numeric" placeholder="000.000.000-00" value={form.document}
              onChange={e => setForm({...form, document: maskCPF(e.target.value)})} onBlur={() => touch("document")}
              error={err("document", !cpfValid) ? "CPF inválido" : undefined} ok={cpfValid} />
          </div>

          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2">2. Endereço de Entrega</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field id="zip" name="zip" label="CEP" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={form.zip}
                onChange={e => setForm({...form, zip: maskCEP(e.target.value)})} onBlur={() => touch("zip")}
                error={cepError ?? (err("zip", onlyDigits(form.zip).length !== 8) ? "CEP incompleto" : undefined)} ok={cepFilled} />
              <Field id="number" name="number" label="Número" inputMode="numeric" placeholder="Nº" value={form.number}
                onChange={e => setForm({...form, number: e.target.value.slice(0, 10)})} onBlur={() => touch("number")}
                error={err("number", !form.number.trim()) ? "Informe o número" : undefined} ok={!!form.number.trim()} />
            </div>
            {cepLoading && <div className="text-xs text-gray-500">Buscando endereço...</div>}
            {cepFilled && (
              <>
                <div className="text-xs bg-emerald-50 p-2 rounded text-emerald-700">
                  {form.street || "Endereço"}{form.neighborhood ? `, ${form.neighborhood}` : ""} — {form.city}/{form.state}
                </div>
                <Field id="complement" name="complement" label="Complemento (opcional)" placeholder="Apto, bloco, referência" value={form.complement}
                  onChange={e => setForm({...form, complement: e.target.value.slice(0, 60)})} />
              </>
            )}
          </div>

          {cepFilled && (
            <div className="space-y-3">
              <h2 className="font-bold border-b pb-2 flex items-center gap-2"><Truck size={18} /> 3. Frete</h2>
              {([
                { id: "free", title: "Frete Grátis", eta: "3 a 5 dias úteis", cents: 0 },
                { id: "express", title: "Entrega Expressa", eta: "1 a 2 dias úteis", cents: expressCents },
              ] as const).map(o => (
                <button type="button" key={o.id} onClick={() => setShipping(o.id)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between text-left transition ${shipping === o.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full border-2 ${shipping === o.id ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`} />
                    <div>
                      <p className="text-sm font-bold">{o.title}</p>
                      <p className="text-xs text-gray-500">{o.eta}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${o.cents === 0 ? "text-emerald-600" : ""}`}>{o.cents === 0 ? "Grátis" : formatBRL(o.cents)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2 text-emerald-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              {cepFilled ? "4" : "3"}. Forma de Pagamento
            </h2>
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 font-bold flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode size={22} className="text-emerald-600" />
                <div>
                  <p className="text-sm">PIX</p>
                  <p className="text-xs text-emerald-600 font-normal">Aprovação imediata</p>
                </div>
              </div>
              <div className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Selecionado
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between"><span>{kit.title}</span><span>{formatBRL(kit.priceCents)}</span></div>
            {bumpCents > 0 && <div className="flex justify-between"><span>2º frasco (upgrade)</span><span>+{formatBRL(bumpCents)}</span></div>}
            <div className="flex justify-between"><span>Frete</span><span>{!cepFilled ? "Informe o CEP" : shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{formatBRL(totalCents)}</span></div>
          </div>

          {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded">{error}</div>}

          <button
            type="button"
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void submit();
            }}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? "Gerando PIX..." : `Finalizar Compra - ${formatBRL(totalCents)}`}
          </button>
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Compra segura</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Garantia de 30 dias</span>
            <span className="flex items-center gap-1"><Clock size={12} /> PIX aprovado na hora</span>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, error, ok, ...props }: { label: string; error?: string; ok?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-gray-600 uppercase">{label}</span>
      <div className="relative">
        <input {...props} aria-invalid={!!error}
          className={`w-full h-12 px-4 pr-10 border rounded-lg focus:ring-2 outline-none ${error ? "border-red-400 focus:ring-red-300" : ok ? "border-emerald-400 focus:ring-emerald-500" : "focus:ring-emerald-500"}`} />
        {ok && !error && <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
