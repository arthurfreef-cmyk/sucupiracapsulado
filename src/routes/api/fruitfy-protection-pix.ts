import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildProtectionUpsellPayload, fruitfyInput, fruitfyResponse, PROTECTION_UPSELL_CENTS, SHIPPING_UPSELL_CENTS } from "@/lib/fruitfy";

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
    if (!shippingOrder || shippingOrder.kit !== "upsell5" || shippingOrder.amount !== SHIPPING_UPSELL_CENTS) {
      return Response.json({ error: "A etapa logística não foi validada." }, { status: 403 });
    }
    try {
      if (!await checkOrderPaid(shippingOrder)) return Response.json({ error: "O pagamento logístico ainda não foi confirmado." }, { status: 409 });
    } catch {
      return Response.json({ error: "Não foi possível confirmar a etapa logística. Tente novamente." }, { status: 502 });
    }

    const token = process.env.FRUITFY_TOKEN?.trim().replace(/^Bearer\s+/i, "");
    const storeId = process.env.FRUITFY_STORE_ID?.trim().replace(/^store[-_\s]?id\s*[:=]\s*/i, "");
    if (!token || !storeId) return Response.json({ error: "Pagamento indisponível no momento." }, { status: 503 });

    const amount = PROTECTION_UPSELL_CENTS;
    try {
      const response = await fetch("https://api.fruitfy.io/api/pix/charge", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Store-Id": storeId, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(buildProtectionUpsellPayload(parsed.data.buyer, amount, parsed.data.utm)),
        signal: AbortSignal.timeout(20000),
      });
      const raw: unknown = await response.json().catch(() => null);
      const result = fruitfyResponse.safeParse(raw);
      if (!response.ok || !result.success || result.data.data.amount !== amount) {
        console.error("Fruitfy protection charge rejected", response.status);
        return Response.json({ error: "Não foi possível gerar o PIX da proteção. Tente novamente." }, { status: 502 });
      }
      const data = result.data.data;
      const orderProof = await signOrderProof({ id: data.order_uuid ?? data.order_id, kit: "protection", amount, buyer: shippingOrder.buyer ?? parsed.data.buyer });
      return Response.json({
        id: data.order_id, status: data.status, amount, orderProof,
        pix: { code: data.pix.code, qrcode_base64: "", expires_at: data.pix.expires_at },
      }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "Não foi possível conectar à Fruitfy. Tente novamente." }, { status: 502 });
    }
  } } },
});