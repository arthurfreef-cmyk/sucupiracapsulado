# Plano de Melhoria do Checkout Mangofy

Melhorar o modal de pagamento PIX, adicionar QR Code e implementar uma página de agradecimento dedicada para aumentar a credibilidade e conversão.

## Alterações de UI

- **Novo Modal PIX**: Substituir a exibição simples atual por um componente de modal ou seção mais profissional, com:
  - Instruções claras passo a passo.
  - Temporizador regressivo de expiração.
  - Exibição destacada do QR Code.
  - Botão de "Copiar Código" com feedback visual aprimorado.
- **Página de Obrigado**: Criar uma nova rota `src/routes/obrigado.tsx` para redirecionar usuários após pagamentos aprovados (Cartão) ou para fornecer um local estável de consulta do PIX.

## Alterações de Backend / Lógica

- **Rastreamento de Status**: Implementar polling básico no checkout para detectar quando o PIX foi pago (via webhook/banco de dados ou simulado para demo) e redirecionar automaticamente para a página de agradecimento.
- **Fluxo de Navegação**:
  - Cartão Aprovado -> Redireciona para `/obrigado`.
  - PIX Gerado -> Mostra Modal -> Polling de Status -> Pagamento Detectado -> Redireciona para `/obrigado`.

## Detalhes Técnicos

- Utilizar `lucide-react` para ícones de confiança (escudos, cadeados).
- Implementar a página de obrigado com resumo do pedido e detalhes de entrega.
- Ajustar `src/routes/checkout.$kit.tsx` para gerenciar os novos estados do modal e redirecionamento.
