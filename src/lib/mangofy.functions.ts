
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
    
    if (!apiToken) {
      throw new Error("Configuração incompleta: MANGOFY_TOKEN não encontrado.");
    }

    try {
      const result = await createMangofyPix(data, apiToken);
      return {
        id: result.id,
        status: result.status,
        amount: result.amount,
        pix: {
          code: result.pix_code,
          qrcode_base64: result.pix_qr_code,
        }
      };
    } catch (error: any) {
      console.error("Mangofy API Error:", error);
      throw new Error(error.message || "Erro ao processar pagamento.");
    }
  });
