import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FRUITFY_KITS, fruitfyInput, fruitfyResponse, describeFruitfyRejection } from "@/lib/fruitfy";

const inputSchema = z.object({
  shippingProof: z.string().min(1).max(2048),
  buyer: fruitfyInput.shape.buyer,
  utm: z.string().max(4096).optional(),
});

export const Route = createFileRoute("/api/fruitfy-protection-pix")({
  server: { handlers: { POST: async ({ request }) => {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Solicitação inválida." }, { status: 403 });
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados do pedido inválidos." }, { status: 400 });

    const { verifyOrderProof, checkOrderPaid, signOrderProof } = await import("@/lib/fruitfy-order.server");
    const shippingOrder = await verifyOrderProof(parsed.data.shippingProof);
    if (!shippingOrder || shippingOrder.kit !== "upsell5") {
      return Response.json({ error: "A etapa anterior do pedido não foi validada." }, { status: 403 });
    }
    try {
      if (!await checkOrderPaid(shippingOrder)) return Response.json({ error: "O pagamento da etapa anterior ainda não foi confirmado." }, { status: 409 });
    } catch {
      return Response.json({ error: "Não foi possível confirmar a etapa anterior. Tente novamente." }, { status: 502 });
    }

    const token = process.env.FRUITFY_TOKEN?.trim().replace(/^Bearer\\s+/i, "");
    const storeId = process.env.FRUITFY_STORE_ID?.trim().replace(/^store[-_\\s]?id\\s*[:=]\\s*/i, "");
    if (!token || !storeId) return Response.json({ error: "Pagamento indisponível no momento." }, { status: 503 });

    // Oferta adicional: mais 3 frascos da mesma SKU cadastrada no catálogo Fruitfy.
    const amount = 3987;
    const query = new URLSearchParams(parsed.data.utm?.replace(/^\\?/, "") ?? "");
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const value = query.get(key);
      if (value) utm[key] = value;
    }
    const payload = {
      name: parsed.data.buyer.name,
      email: parsed.data.buyer.email.toLowerCase(),
      cpf: parsed.data.buyer.document.replace(/\\D/g, ""),
      phone: `55${parsed.data.buyer.phone.replace(/\\D/g, "").replace(/^55/, "")}`,
      items: [{ id: FRUITFY_KITS.k3.id, value: amount, quantity: 1 }],
      utm,
    };

    try {
      const response = await fetch("https://api.fruitfy.io/api/pix/charge", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Store-Id": storeId, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const raw: unknown = await response.json().catch(() => null);
      const result = fruitfyResponse.safeParse(raw);
      if (!response.ok || !result.success || result.data.data.amount !== amount) {
        const rejection = describeFruitfyRejection(response.status, raw);
        console.error("Fruitfy continuity upsell rejected", rejection.log);
        return Response.json({ error: rejection.userMessage ?? "Não foi possível gerar o PIX da oferta. Tente novamente." }, { status: 502 });
      }
      const data = result.data.data;
      const orderProof = await signOrderProof({ id: data.order_uuid ?? data.order_id, kit: "k3", amount, buyer: shippingOrder.buyer ?? parsed.data.buyer });
      return Response.json({
        id: data.order_id, status: data.status, amount, orderProof,
        pix: { code: data.pix.code, qrcode_base64: "", expires_at: data.pix.expires_at },
      }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "Não foi possível conectar à Fruitfy. Tente novamente." }, { status: 502 });
    }
  } } },
});
