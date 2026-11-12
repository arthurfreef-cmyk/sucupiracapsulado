// Cria cobrança PIX via Duttyfy (gateway principal). BuckPay permanece em /api/buckpay-pix.
import { createFileRoute } from "@tanstack/react-router";
import { KIT_PRICING } from "@/lib/kit-pricing";
import { expressShippingCents } from "@/lib/checkout-utils";

const KITS = {
  k1: { amount: KIT_PRICING.k1.priceCents, name: "Sucupira Composta - 1 Frasco" },
  k3: { amount: KIT_PRICING.k3.priceCents, name: "Sucupira Composta - 3 Frascos" },
  k5: { amount: KIT_PRICING.k5.priceCents, name: "Sucupira Composta - 5 Frascos" },
  gel: { amount: 1290, name: "Gel Massageador Alívio Total" },
} as const;
type KitId = keyof typeof KITS;

type Body = {
  kit: KitId;
  shipping?: { method: "free" | "express"; amount: number };
  address?: { zip?: string };
  buyer: { name: string; email: string; document: string; phone: string };
  utm?: string;
};

const onlyDigits = (v = "") => v.replace(/\D/g, "");
const isKitId = (v: unknown): v is KitId => typeof v === "string" && v in KITS;
const isValidEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
/** Evita repetir automaticamente uma criação de cobrança e gerar PIX duplicados. */
async function postPayment(url: string, payload: unknown): Promise<{ status: number; text: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  return { status: response.status, text: await response.text() };
}

export const Route = createFileRoute("/api/duttyfy-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const gatewayUrl = process.env.DUTTYFY_PIX_URL_ENCRYPTED?.trim();
        if (!gatewayUrl) {
          return Response.json({ error: "Pagamento indisponível no momento." }, { status: 500 });
        }

        let body: Body;
        try { body = (await request.json()) as Body; } catch {
          return Response.json({ error: "JSON inválido." }, { status: 400 });
        }
        if (!isKitId(body?.kit)) return Response.json({ error: "Kit inválido." }, { status: 400 });
        const kit = KITS[body.kit];

        const b = body.buyer;
        if (!b?.name || !b?.document || !b?.phone) {
          return Response.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
        }
        const name = b.name.trim().replace(/\s+/g, " ");
        if (name.length < 3 || !/\s/.test(name)) {
          return Response.json({ error: "Informe o nome completo (nome e sobrenome)." }, { status: 400 });
        }
        const cpf = onlyDigits(b.document);
        if (cpf.length !== 11) return Response.json({ error: "CPF inválido." }, { status: 400 });
        let phone = onlyDigits(b.phone);
        if (phone.length > 11 && phone.startsWith("55")) phone = phone.slice(2);
        if (phone.length < 10 || phone.length > 11) {
          return Response.json({ error: "Celular inválido." }, { status: 400 });
        }

        // Shipping is always derived server-side from the destination ZIP.
        let shipping = 0;
        if (body.shipping?.method === "express") {
          const zip = onlyDigits(body.address?.zip ?? "");
          if (zip.length !== 8) return Response.json({ error: "CEP inválido." }, { status: 400 });
          shipping = expressShippingCents(zip);
        }
        const total = kit.amount + shipping;
        const email = isValidEmail(b.email) ? b.email.trim().toLowerCase() : `${cpf}@sucupiracapsulados.com.br`;

        const payload = {
          amount: total,
          customer: { name, document: cpf, email, phone },
          item: { title: kit.name, price: total, quantity: 1 },
          paymentMethod: "PIX",
          utm: (body.utm || "").replace(/^\?/, ""),
        };

        let status: number, text: string;
        try {
          ({ status, text } = await postPayment(gatewayUrl, payload));
        } catch (err) {
          console.error("Duttyfy fetch failed", gatewayUrl.slice(-8), err instanceof Error ? err.message : err);
          return Response.json({ error: "Não foi possível conectar ao provedor de pagamento. Tente novamente." }, { status: 502 });
        }

        let json: any = null;
        try { json = JSON.parse(text); } catch { /* raw */ }
        if (status < 200 || status >= 300 || !json?.pixCode) {
          console.error("Duttyfy error", status, text.slice(0, 300));
          const msg = typeof json?.message === "string" ? json.message
            : typeof json?.error === "string" ? json.error : "Falha ao gerar PIX.";
          return Response.json({ error: msg }, { status: status >= 400 && status < 500 ? 400 : 502 });
        }

        return Response.json({
          id: json.transactionId,
          status: json.status || "PENDING",
          amount: total,
          pix: { code: json.pixCode, qrcode_base64: "" },
        });
      },
    },
  },
});
