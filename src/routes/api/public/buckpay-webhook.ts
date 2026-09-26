import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

const PIXEL_IDS = ["1590108412755712"];

const sha256 = (v?: string | null) => {
  if (!v) return undefined;
  const s = String(v).trim().toLowerCase();
  if (!s) return undefined;
  return createHash("sha256").update(s).digest("hex");
};

const onlyDigits = (v?: string | null) => (v || "").replace(/\D/g, "");

export const Route = createFileRoute("/api/public/buckpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const capiToken = process.env.META_CAPI_TOKEN;
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }

        // BuckPay: { event, data: { status, buyer, total_amount, offer, id } }
        const event = body?.event as string | undefined;
        const data = body?.data ?? {};
        const rawStatus = String(data?.status ?? "").toLowerCase();
        const isPaid = rawStatus === "paid" || rawStatus === "approved";

        if (event !== "transaction.processed" || !isPaid) {
          return Response.json({ ok: true, skipped: true, status: rawStatus });
        }

        if (!capiToken) {
          console.error("META_CAPI_TOKEN ausente — Purchase não enviado");
          return Response.json({ ok: true, sent: false });
        }

        const buyer = data?.buyer ?? {};
        const valueBRL = Number(data?.total_amount ?? 0) / 100;
        const nameParts = String(buyer?.name || "").trim().split(/\s+/);
        const fn = nameParts[0]?.toLowerCase();
        const ln = nameParts.slice(1).join(" ").toLowerCase();

        const userData: Record<string, string | undefined> = {
          em: sha256(buyer?.email),
          ph: sha256(onlyDigits(buyer?.phone)),
          fn: sha256(fn),
          ln: sha256(ln),
          external_id: sha256(onlyDigits(buyer?.document)),
          country: sha256("br"),
          // IP/UA do webhook seriam da BuckPay, não do comprador — por isso não são enviados.
        };
        const user_data = Object.fromEntries(
          Object.entries(userData).filter(([, v]) => Boolean(v)),
        );

        const offer = data?.offer ?? {};
        const orderId = data?.id;
        const payload = {
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: String(orderId || ""),
              action_source: "website",
              user_data,
              custom_data: {
                currency: "BRL",
                value: valueBRL,
                content_type: "product",
                content_name: offer?.name,
                num_items: offer?.quantity ?? 1,
                order_id: orderId,
              },
            },
          ],
        };

        try {
          const results = await Promise.all(
            PIXEL_IDS.map(async (pid) => {
              const res = await fetch(
                `https://graph.facebook.com/v19.0/${pid}/events?access_token=${encodeURIComponent(capiToken)}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                },
              );
              const text = await res.text();
              if (!res.ok) console.error("Meta CAPI error", pid, res.status, text);
              return { pid, ok: res.ok, status: res.status, body: text.slice(0, 400) };
            }),
          );
          const allOk = results.every((r) => r.ok);
          return Response.json({ ok: allOk, sent: true, results }, { status: allOk ? 200 : 502 });
        } catch (err: any) {
          console.error("Meta CAPI fetch failed", err);
          return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
        }
      },
    },
  },
});
