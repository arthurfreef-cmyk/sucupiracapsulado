
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createMangofyPix } from "./mangofy.server";

const PixInputSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  document: z.string().min(11),
  phone: z.string().min(10),
  amount: z.number(),
  kit: z.string(),
});

export const generatePix = createServerFn({ method: "POST" })
  .inputValidator((data) => PixInputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiToken = process.env['MANGOFY_TOKEN'];
    const storeCode = process.env['MANGOFY_STORE_CODE'];
    
    if (!apiToken || !storeCode) {
      throw new Error("Configuração incompleta: MANGOFY_TOKEN ou MANGOFY_STORE_CODE não encontrados.");
    }

    try {
      const result = await createMangofyPix(data, apiToken, storeCode);
      return {
        id: result.payment_code,
        status: result.payment_status,
        amount: result.payment_amount,
        pix: {
          code: result.pix.pix_qrcode_text,
          qrcode_base64: result.pix.pix_qrcode_image || "",
        }
      };
    } catch (error: any) {
      console.error("Mangofy API Error:", error);
      throw new Error(error.message || "Erro ao processar pagamento.");
    }
  });
