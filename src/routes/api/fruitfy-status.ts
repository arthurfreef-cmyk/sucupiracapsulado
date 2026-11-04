import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/fruitfy-status")({
  server: { handlers: { POST: async ({ request }) => {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Solicitação inválida." }, { status: 403 });
    const input = z.object({ proof: z.string().min(1).max(2048) }).safeParse(await request.json().catch(() => null));
    if (!input.success) return Response.json({ error: "Pedido inválido." }, { status: 400 });
    const { verifyOrderProof, checkOrderPaid } = await import("@/lib/fruitfy-order.server");
    const order = await verifyOrderProof(input.data.proof);
    if (!order) return Response.json({ error: "Referência do pedido inválida ou expirada." }, { status: 403 });
    try {
      const paid = await checkOrderPaid(order);
      return Response.json({ paid, eligible: false }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "Não foi possível consultar o pagamento agora. Tente novamente." }, { status: 502 });
    }
  } } },
});