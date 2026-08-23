
import { z } from "zod";

const PixResponseSchema = z.object({
  payment_code: z.string(),
  payment_status: z.string(),
  payment_amount: z.number(),
  pix: z.object({
    pix_qrcode_text: z.string(),
    pix_qrcode_image: z.string(), // base64
    pix_expires_at: z.string(),
  }),
});

export async function createMangofyPix(payload: {
  name: string;
  email: string;
  document: string;
  phone: string;
  amount: number; // cents
  kit: string;
}, apiToken: string, storeCode: string) {
  const url = "https://checkout.mangofy.com.br/api/v1/payment";
  
  const body = {
    external_code: `pedido-${Date.now()}`,
    payment_method: "pix",
    payment_format: "regular",
    installments: 1,
    payment_amount: payload.amount,
    shipping_amount: 0,
    postback_url: "https://id-preview--47926bee-82d0-4b8f-b7a3-b94b398be3b9.lovable.app/api/public/mangofy-webhook",
    items: [
      { 
        code: payload.kit, 
        name: `Kit ${payload.kit}`, 
        quantity: 1, 
        price: payload.amount 
      }
    ],
    customer: {
      email: payload.email,
      name: payload.name,
      document: payload.document.replace(/\D/g, ""),
      phone: payload.phone.replace(/\D/g, ""),
      ip: "127.0.0.1" // Default for API calls
    },
    pix: { expires_in_days: 1 }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": apiToken,
      "Store-Code": storeCode,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawData = await response.json();

  if (!response.ok) {
    throw new Error(rawData.message || `Erro Mangofy (${response.status}): ${JSON.stringify(rawData)}`);
  }

  const parsed = PixResponseSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Mangofy Response Schema Error:", parsed.error);
    throw new Error("Resposta da Mangofy em formato inesperado.");
  }

  return parsed.data;
}
