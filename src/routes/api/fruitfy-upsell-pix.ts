import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { buildShippingUpsellPayload, fruitfyInput, fruitfyResponse, SHIPPING_UPSELL_CENTS } from "@/lib/fruitfy";

const upsellInput = z.object({
  originalProof: z.string().min(1).max(2048),
  buyer: fruitfyInput.shape.buyer,
  utm: z.string().max(4096).optional(),
});

export const Route = createFileRoute("/api/fruitfy-upsell-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ error: "Solicitação inválida." }, { status: 403 });
        }
        const parsed = upsellInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Não foi possível validar o pedido original." }, { status: 400 });
        }

        const { verifyOrderProof, checkOrderPaid, signOrderProof } = await import("@/lib/fruitfy-order.server");
        const originalOrder = await verifyOrderProof(parsed.data.originalProof);
        if (!originalOrder || originalOrder.kit === "upsell5") {
          return Response.json({ error: "Pedido original inválido ou expirado." }, { status: 403 });
        }

        try {
          const originalPaid = await checkOrderPaid(originalOrder);
          if (!originalPaid) {
            return Response.json({ error: "O pagamento do pedido principal ainda não foi confirmado." }, { status: 409 });
          }
        } catch {
          return Response.json({ error: "Não foi possível confirmar o pedido principal. Tente novamente." }, { status: 502 });
        }

        const token = process.env.FRUITFY_TOKEN?.trim().replace(/^Bearer\s+/i, "");
        const storeId = process.env.FRUITFY_STORE_ID?.trim().replace(/^store[-_\s]?id\s*[:=]\s*/i, "");
        if (!token || !storeId) {
          return Response.json({ error: "Pagamento indisponível no momento." }, { status: 503 });
        }

        const amount = SHIPPING_UPSELL_CENTS;
        const payload = buildShippingUpsellPayload(parsed.data.buyer, amount, parsed.data.utm);
        try {
          const response = await fetch("https://api.fruitfy.io/api/pix/charge", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Store-Id": storeId,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000),
          });
          const raw: unknown = await response.json().catch(() => null);
          const result = fruitfyResponse.safeParse(raw);
          if (!response.ok || !result.success || result.data.data.amount !== amount) {
            console.error("Fruitfy shipping add-on charge rejected", response.status);
            return Response.json({ error: "Não foi possível gerar o PIX do complemento. Tente novamente." }, { status: 502 });
          }
          const data = result.data.data;
          const orderProof = await signOrderProof({
            id: data.order_uuid ?? data.order_id,
            kit: "upsell5",
            amount,
            buyer: originalOrder.buyer ?? parsed.data.buyer,
          });
          return Response.json({
            id: data.order_id,
            status: data.status,
            amount,
            orderProof,
            pix: { code: data.pix.code, qrcode_base64: "", expires_at: data.pix.expires_at },
          }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Não foi possível conectar à Fruitfy. Tente novamente." }, { status: 502 });
        }
      },
    },
  },
});
