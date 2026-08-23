
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/mangofy-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // A Mangofy envia o status do pagamento aqui
        const payload = await request.json()
        console.log('Mangofy Webhook Received:', payload)
        
        // Em um sistema real, aqui atualizaríamos o status do pedido no banco de dados
        // e dispararíamos e-mails de confirmação.
        
        return new Response('ok', { status: 200 })
      }
    }
  }
})
