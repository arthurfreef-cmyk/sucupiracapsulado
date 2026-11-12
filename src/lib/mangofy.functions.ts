
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createMangofyPayment } from "./mangofy.server";
import { KIT_PRICING } from "./kit-pricing";

const PaymentInputSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  document: z.string().min(11),
  phone: z.string().min(10),
  amount: z.number().optional(),
  kit: z.enum(["k1", "k3", "k5"]),
  method: z.enum(["pix", "credit_card"]),
  card: z.object({
    number: z.string(),
    holder: z.string(),
    month: z.number(),
    year: z.number(),
    cvv: z.string(),
  }).optional(),
});

export const generatePayment = createServerFn({ method: "POST" })
  .inputValidator((data) => PaymentInputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiToken = process.env['MANGOFY_TOKEN'];
    const storeCode = process.env['MANGOFY_STORE_CODE'];
    
    if (!apiToken || !storeCode) {
      throw new Error("Configuração incompleta: MANGOFY_TOKEN ou MANGOFY_STORE_CODE não encontrados.");
    }

    try {
      const result = await createMangofyPayment({ ...data, amount: KIT_PRICING[data.kit].priceCents }, apiToken, storeCode);
      return {
        id: result.payment_code || "pending",
        status: result.payment_status,
        amount: result.payment_amount,
        pix: result.pix ? {
          code: result.pix.pix_qrcode_text,
          qrcode_base64: result.pix.pix_qrcode_image || "",
        } : null,
        card: result.card || null
      };
    } catch (error: any) {
      console.error("Mangofy API Error:", error);
      throw new Error(error.message || "Erro ao processar pagamento.");
    }
  });
