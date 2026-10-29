import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const paymentStatus = z.object({ paid: z.boolean(), eligible: z.boolean() });

/** Poll only signed references; pending payments never unlock the offer. */
export function useOrderPayment(proof: string | undefined) {
  return useQuery({
    queryKey: ["order-payment", proof],
    enabled: Boolean(proof),
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/fruitfy-status", {
        method: "POST", signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof }),
      });
      const body: unknown = await response.json().catch(() => null);
      const parsed = paymentStatus.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("Não foi possível consultar o pagamento agora. Tente novamente.");
      return parsed.data;
    },
    retry: false,
    staleTime: 0,
    refetchInterval: (query) => query.state.data?.paid ? false : 10000,
    refetchIntervalInBackground: false,
  });
}