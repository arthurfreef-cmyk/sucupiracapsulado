import { createFileRoute } from "@tanstack/react-router";
import { buildFruitfyPayload, fruitfyInput, fruitfyResponse } from "@/lib/fruitfy";

export const Route = createFileRoute("/api/fruitfy-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return Response.json({ error: "Solicitação inválida." }, { status: 403 });
        }
        let input: unknown;
        try { input = await request.json(); } catch {
          return Response.json({ error: "Solicitação inválida." }, { status: 400 });
        }
        const parsed = fruitfyInput.safeParse(input);
        if (!parsed.success) {
          return Response.json({ error: "Confira os campos obrigatórios antes de gerar o PIX." }, { status: 400 });
        }
        // Credentials are read per request and never returned to the browser.
        const token = process.env.FRUITFY_TOKEN?.trim().replace(/^Bearer\s+/i, "");
        const storeId = process.env.FRUITFY_STORE_ID?.trim().replace(/^store[-_\s]?id\s*[:=]\s*/i, "");
        if (!token || !storeId) {
          return Response.json({ error: "Pagamento indisponível no momento." }, { status: 503 });
        }
        const payload = buildFruitfyPayload(parsed.data);
        try {
          // Never retry a charge or fall back automatically: a timed-out request may
          // already have created a charge with the provider.
          const response = await fetch("https://api.fruitfy.io/api/pix/charge", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`, "Store-Id": storeId,
              "Content-Type": "application/json", Accept: "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(20000),
          });
          const raw: unknown = await response.json().catch(() => null);
          const result = fruitfyResponse.safeParse(raw);
          if (!response.ok || !result.success) {
            console.error("Fruitfy charge rejected", response.status);
            return Response.json({ error: "Não foi possível gerar o PIX. Confira seus dados e tente novamente." }, { status: response.status === 422 ? 400 : 502 });
          }
          const data = result.data.data;
          if (data.amount !== payload.items[0].value) {
            console.error("Fruitfy charge amount mismatch");
            return Response.json({ error: "Não foi possível confirmar o valor do PIX. Tente novamente." }, { status: 502 });
          }
          return Response.json({
            id: data.order_id, status: data.status, amount: data.amount,
            pix: { code: data.pix.code, qrcode_base64: "", expires_at: data.pix.expires_at },
          }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Não foi possível conectar ao provedor de pagamento. Tente novamente." }, { status: 502 });
        }
      },
    },
  },
});