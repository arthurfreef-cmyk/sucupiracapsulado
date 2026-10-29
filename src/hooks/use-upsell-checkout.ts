import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { fruitfyInput } from "@/lib/fruitfy";
import { UPSELL_PRICE_CENTS } from "@/lib/upsell";
import { useOrderPayment } from "./use-order-payment";

const savedOrderSchema = fruitfyInput.pick({ buyer: true, address: true, utm: true })
  .extend({ proof: z.string().min(1).max(2048) });
const pixSchema = z.object({
  id: z.string().min(1), amount: z.literal(UPSELL_PRICE_CENTS), orderProof: z.string().min(1),
  pix: z.object({ code: z.string().startsWith("000201").min(50), expires_at: z.string().datetime({ offset: true }) }),
});
type SavedOrder = z.infer<typeof savedOrderSchema>;
type OfferPix = z.infer<typeof pixSchema>;
const pendingKey = "sucupira_upsell_pix";

export function useUpsellCheckout() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedOrder | null>(null);
  const [ready, setReady] = useState(false);
  const [pix, setPix] = useState<OfferPix | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const original = useOrderPayment(saved?.proof);
  const additional = useOrderPayment(pix?.orderProof);

  useEffect(() => {
    try {
      const parsed = savedOrderSchema.safeParse(JSON.parse(sessionStorage.getItem("sucupira_original_order") || "null"));
      if (parsed.success) {
        setSaved(parsed.data);
        const pending = JSON.parse(sessionStorage.getItem(pendingKey) || "null") as unknown;
        const restored = z.object({ originalProof: z.literal(parsed.data.proof), payment: pixSchema }).safeParse(pending);
        if (restored.success) setPix(restored.data.payment);
      }
    } catch { /* Missing or invalid storage leaves checkout disabled, not loading forever. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!additional.data?.paid) return;
    try { sessionStorage.removeItem(pendingKey); sessionStorage.removeItem("sucupira_original_order"); } catch { /* Optional cleanup. */ }
    void navigate({ to: "/obrigado" });
  }, [additional.data?.paid, navigate]);

  useEffect(() => {
    if (!pix) return;
    let active = true;
    let url: string | undefined;
    void import("uqr").then(({ renderSVG }) => {
      if (!active) return;
      url = URL.createObjectURL(new Blob([renderSVG(pix.pix.code, { ecc: "M", border: 4 })], { type: "image/svg+xml" }));
      setQr(url);
    }).catch(() => { if (active) setQr(null); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [pix]);

  const createOffer = async () => {
    if (inFlight.current || !saved || !original.data?.eligible || pix) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/fruitfy-pix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kit: "upsell5", originalOrderProof: saved.proof, buyer: saved.buyer, address: saved.address, utm: saved.utm, shipping: { method: "free", amount: 0 } }),
      });
      const body: unknown = await response.json().catch(() => null);
      const parsed = pixSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("Não foi possível gerar o PIX da oferta. Tente novamente.");
      setPix(parsed.data);
      try { sessionStorage.setItem(pendingKey, JSON.stringify({ originalProof: saved.proof, payment: parsed.data })); } catch { /* Payment still displays without storage. */ }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PIX."); }
    finally { inFlight.current = false; setBusy(false); }
  };

  const copy = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.pix.code); setCopied(true); }
    catch {
      const field = document.getElementById("upsell-pix-code");
      if (field instanceof HTMLTextAreaElement) { field.focus(); field.select(); }
      setError("Selecione e copie o código PIX acima.");
    }
  };
  const confirm = async () => {
    setError("");
    const checked = await additional.refetch();
    if (checked.error) setError(checked.error.message);
    else if (!checked.data?.paid) setError("O pagamento ainda não foi confirmado. Aguarde alguns instantes e confira novamente.");
  };
  return { saved, ready, pix, qr, busy, copied, error, original, additional, createOffer, copy, confirm };
}