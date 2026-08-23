
import { z } from "zod";

const MangofyResponseSchema = z.object({
  payment_code: z.string().optional(),
  payment_status: z.string(),
  payment_amount: z.number(),
  pix: z.object({
    pix_qrcode_text: z.string(),
    pix_qrcode_image: z.string().optional(),
    pix_expires_at: z.string(),
  }).optional(),
  card: z.object({
    card_flag: z.string().optional(),
    card_token: z.string().optional(),
  }).optional(),
});


export async function createMangofyPayment(payload: {
  name: string;
  email: string;
  document: string;
  phone: string;
  amount: number;
  kit: string;
  method: "pix" | "credit_card";
  card?: {
    number: string;
    holder: string;
    month: number;
    year: number;
    cvv: string;
  };
}, apiToken: string, storeCode: string) {
  const url = "https://checkout.mangofy.com.br/api/v1/payment";
  
  const body: any = {
    external_code: `pedido-${Date.now()}`,
    payment_method: payload.method,
    payment_format: "regular",
    installments: 1,
    payment_amount: payload.amount,
    shipping_amount: 0,
    postback_url: "https://id-preview--47926bee-82d0-4b8f-b7a3-b94b398be3b9.lovable.app/api/public/mangofy-webhook",
    items: [
      { code: payload.kit, name: `Kit ${payload.kit}`, quantity: 1, price: payload.amount }
    ],
    customer: {
      email: payload.email,
      name: payload.name,
      document: payload.document.replace(/\D/g, ""),
      phone: payload.phone.replace(/\D/g, ""),
      ip: "127.0.0.1"
    },
  };

  if (payload.method === "pix") {
    body.pix = { expires_in_days: 1 };
  } else if (payload.method === "credit_card" && payload.card) {
    body.card = {
      number: payload.card.number.replace(/\D/g, ""),
      holder_name: payload.card.holder,
      expiration_month: payload.card.month,
      expiration_year: payload.card.year,
      cvv: payload.card.cvv,
      soft_descriptor: "WLABEL"
    };
  }


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
  console.log("Mangofy API Response:", JSON.stringify(rawData, null, 2));

  if (!response.ok) {
    throw new Error(rawData.message || `Erro Mangofy (${response.status}): ${JSON.stringify(rawData)}`);
  }

  const parsed = MangofyResponseSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Mangofy Response Schema Error:", parsed.error);
    if (rawData.payment_code) {
      return rawData;
    }
    throw new Error("Resposta da Mangofy em formato inesperado.");
  }


  return parsed.data;
}
