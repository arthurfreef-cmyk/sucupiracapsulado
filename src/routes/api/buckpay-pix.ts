// Cria cobrança PIX via BuckPay.
import { createFileRoute } from "@tanstack/react-router";

const KITS = {
  k1: { amount: 2700, name: "Sucupira Composta - 1 Frasco", qty: 1 },
  k3: { amount: 9700, name: "Sucupira Composta - 3 Frascos", qty: 3 },
  k5: { amount: 14700, name: "Sucupira Composta - 5 Frascos", qty: 5 },
} as const;
// Prices: k1=R$27, k3=R$97, k5=R$147

type KitId = keyof typeof KITS;

type Body = {
  kit: KitId;
  bumpAddCents?: number;
  shipping?: { method: "free" | "express"; amount: number };
  buyer: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
  address?: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  utm?: string;
};

const onlyDigits = (v = "") => v.replace(/\D/g, "");
const isKitId = (v: unknown): v is KitId => typeof v === "string" && v in KITS;
const isValidEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const cleanToken = (value = "") =>
  value.trim().replace(/^Authorization:\s*/i, "").replace(/^Bearer\s+/i, "").trim();
const cleanUserAgent = (value = "") =>
  value.trim().replace(/^User-Agent:\s*/i, "").trim();

const buckPayErrorMessage = (status: number, json: any, raw: string) => {
  const detail = json?.error?.detail;
  if (typeof detail === "string") return detail;
  if (typeof json?.error?.message === "string") return json.error.message;
  if (typeof json?.message === "string") {
    if (status === 403) {
      return "A BuckPay recusou a autenticação. Confira BUCKPAY_TOKEN e BUCKPAY_USER_AGENT.";
    }
    return json.message;
  }
  if (raw) return raw.slice(0, 220);
  return "Falha ao gerar PIX.";
};

const parseUtm = (utm = "") => {
  const out: Record<string, string | null> = {
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_id: null, utm_term: null, utm_content: null,
  };
  try {
    const sp = new URLSearchParams(utm.replace(/^\?/, ""));
    for (const k of Object.keys(out)) {
      const v = sp.get(k);
      if (v) out[k] = v;
    }
  } catch { /* noop */ }
  return out;
};

export const Route = createFileRoute("/api/buckpay-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = cleanToken(process.env.BUCKPAY_TOKEN);
        const userAgent = cleanUserAgent(process.env.BUCKPAY_USER_AGENT);
        if (!token || !userAgent) {
          return Response.json(
            { error: "Pagamento indisponível (BUCKPAY_TOKEN/BUCKPAY_USER_AGENT ausentes)." },
            { status: 500 },
          );
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "JSON inválido." }, { status: 400 });
        }

        if (!isKitId(body?.kit)) {
          return Response.json({ error: "Kit inválido." }, { status: 400 });
        }
        const kit = KITS[body.kit];

        const b = body.buyer;
        if (!b?.name || !b?.email || !b?.document || !b?.phone) {
          return Response.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
        }
        const cpfDigits = onlyDigits(b.document);
        if (cpfDigits.length !== 11) {
          return Response.json({ error: "CPF inválido." }, { status: 400 });
        }
        const phoneDigits = onlyDigits(b.phone);
        if (phoneDigits.length < 10) {
          return Response.json({ error: "Celular inválido." }, { status: 400 });
        }
        const phoneWithCountry = phoneDigits.length <= 11 ? `55${phoneDigits}` : phoneDigits;

        const shippingAmount =
          body.shipping && Number.isFinite(body.shipping.amount) &&
          body.shipping.amount >= 0 && body.shipping.amount <= 5000
            ? Math.round(body.shipping.amount)
            : 0;
        const bumpAddCents =
          body.kit === "k1" && body.bumpAddCents === 2000
            ? 2000
            : body.bumpAddCents === 3700
              ? 3700
              : 0;
        const totalCents = kit.amount + shippingAmount + bumpAddCents;
        const isUpgrade2 = body.kit === "k1" && bumpAddCents === 2000;
        const productName = isUpgrade2 ? "Sucupira Composta - 2 Frascos" : kit.name;

        const emailFinal = isValidEmail(b.email)
          ? b.email.trim().toLowerCase()
          : `${cpfDigits}@sucupiracapsulados.com.br`;

        const external_id = `sucupira-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const payload = {
          external_id,
          payment_method: "pix" as const,
          amount: totalCents,
          buyer: {
            name: b.name.trim(),
            email: emailFinal,
            document: cpfDigits,
            phone: phoneWithCountry,
          },
          product: { id: body.kit, name: productName },
          offer: { id: `${body.kit}-offer`, name: productName, quantity: 1 },
          tracking: { ref: null, src: null, sck: null, ...parseUtm(body.utm) },
        };

        let res: Response;
        let text = "";
        try {
          res = await fetch("https://api.realtechdev.com.br/v1/transactions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "User-Agent": userAgent,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(25000),
          });
          text = await res.text();
        } catch (err: any) {
          console.error("BuckPay fetch failed", err?.message || err);
          return Response.json(
            { error: "Não foi possível conectar ao provedor de pagamento. Tente novamente." },
            { status: 502 },
          );
        }

        let json: any = null;
        try { json = JSON.parse(text); } catch { /* keep raw */ }

        if (!res.ok) {
          console.error("BuckPay error", res.status, text.slice(0, 400));
          return Response.json(
            { error: buckPayErrorMessage(res.status, json, text) },
            { status: res.status >= 500 ? 502 : res.status },
          );
        }

        const data = json?.data ?? {};
        const code = data?.pix?.code || data?.pix?.payload || "";
        if (!code) {
          console.error("BuckPay missing PIX code", text.slice(0, 400));
          return Response.json(
            { error: "O provedor não retornou o código PIX. Tente novamente." },
            { status: 502 },
          );
        }

        return Response.json({
          id: data.id,
          status: data.status || "pending",
          amount: data.total_amount ?? totalCents,
          pix: {
            code,
            qrcode_base64: data.pix?.qrcode_base64 || "",
          },
        });
      },
    },
  },
});
