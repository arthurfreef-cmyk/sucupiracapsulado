
import { z } from "zod";

const PixResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    pix_code: z.string(),
    pix_qr_code: z.string(), // base64
    amount: z.number(),
    status: z.string(),
  }).optional(),
  message: z.string().optional(),
});

export async function createMangofyPix(payload: {
  name: string;
  email: string;
  document: string;
  phone: string;
  amount: number; // cents
  kit: string;
}, apiToken: string) {
  // Mangofy Pix API implementation
  // Note: Adjust the URL and payload structure to match Mangofy's actual API
  const response = await fetch("https://api.mangofy.com.br/v1/pix", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: {
        name: payload.name,
        email: payload.email,
        document: payload.document.replace(/\D/g, ""),
        phone: payload.phone.replace(/\D/g, ""),
      },
      amount: payload.amount,
      metadata: {
        kit: payload.kit,
      },
      // postback_url: "https://..." // To be configured if needed
    }),
  });

  const rawData = await response.json();
  const parsed = PixResponseSchema.safeParse(rawData);

  if (!parsed.success || !rawData.success) {
    throw new Error(rawData.message || "Falha ao gerar o Pix com Mangofy.");
  }

  return rawData.data;
}
