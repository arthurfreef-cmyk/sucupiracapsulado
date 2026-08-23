import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { generatePayment } from "@/lib/mangofy.functions";
import { ShieldCheck, Copy, CheckCircle2, Clock, QrCode, AlertCircle } from "lucide-react";


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
      { name: "description", content: "Finalize sua compra com PIX ou Cartão." },
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
    name: "", email: "", document: "", phone: "", zip: "", number: "",
    street: "", neighborhood: "", city: "", state: "",
    cardNumber: "", cardHolder: "", cardExpiry: "", cardCVV: ""
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const cepTimer = useRef<number | null>(null);


  const cpfValid = isValidCPF(form.document);
  const phoneValid = isValidPhone(form.phone);
  const formValid = !!form.name && !!form.email && cpfValid && phoneValid && cepFilled && !!form.number &&
    (method === "pix");

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
          setForm(f => ({ ...f, street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf }));
          setCepFilled(true);
        }
      } catch {} finally { setCepLoading(false); }
    }, 250);
  }, [form.zip]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        name: form.name, email: form.email, document: form.document, phone: form.phone,
        amount: kit.priceCents, kit: baseKitId, method
      };
      if (method === "credit_card") {
        const [m, y] = form.cardExpiry.split("/");
        payload.card = {
          number: form.cardNumber, holder: form.cardHolder,
          month: parseInt(m), year: 2000 + parseInt(y), cvv: form.cardCVV
        };
      }
      const res = await generatePayment({ data: payload });
      setResult(res);
      if (method === "credit_card" && res.status === "approved") {
        navigate({ to: "/obrigado" });
      }
    } catch (err: any) {
      setError(err.message || "Erro no pagamento");
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
                      navigator.clipboard.writeText(result.pix!.code); 
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
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Pagamento Processado por Mangofy</span>
            </div>
          </div>
        </div>
      );
    }
  }


  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b p-4 text-center font-bold text-[var(--brand)]">Sucupira Composta - Checkout</header>
      <main className="container mx-auto max-w-2xl p-4 md:p-8">
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <h1 className="text-xl font-bold">Resumo do Pedido</h1>
          <div className="flex gap-4 items-center bg-[var(--cream)] p-4 rounded-xl">
            <img src={kit.image} className="w-16 h-16 object-contain" />
            <div className="flex-1">
              <div className="font-bold text-sm">{kit.title}</div>
              <div className="text-xs text-muted-foreground">{kit.sub}</div>
            </div>
            <div className="text-lg font-bold text-[var(--brand)]">{kit.price}</div>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2">1. Dados Pessoais</h2>
            <Field label="Nome Completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <Field label="Celular" value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} required placeholder="(00) 00000-0000" />
            </div>
            <Field label="CPF" value={form.document} onChange={e => setForm({...form, document: maskCPF(e.target.value)})} required placeholder="000.000.000-00" />
          </div>

          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2">2. Endereço</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CEP" value={form.zip} onChange={e => setForm({...form, zip: maskCEP(e.target.value)})} required placeholder="00000-000" />
              <Field label="Número" value={form.number} onChange={e => setForm({...form, number: e.target.value})} required />
            </div>
            {cepFilled && <div className="text-xs bg-emerald-50 p-2 rounded text-emerald-700">{form.street}, {form.city}-{form.state}</div>}
          </div>

          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2 text-emerald-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              3. Forma de Pagamento
            </h2>
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 font-bold flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-sm">PIX</p>
                  <p className="text-xs text-emerald-600 font-normal">Aprovação imediata</p>
                </div>
              </div>
              <div className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Selecionado
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Pague com PIX e receba seu acesso instantaneamente por e-mail.
            </p>
          </div>

          {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded">{error}</div>}

          <button disabled={loading || !formValid} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50">
            {loading ? "Processando..." : `Finalizar Compra - ${formatBRL(kit.priceCents)}`}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-gray-600 uppercase">{label}</span>
      <input {...props} className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
    </label>
  );
}
