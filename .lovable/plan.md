# Plano de Integração: Cartão de Crédito Mangofy

Este plano detalha a ativação do pagamento via cartão de crédito utilizando a API da Mangofy, mantendo o PIX como opção alternativa no checkout.

## Alterações Técnicas

### Backend e Integração de API
- **`src/lib/mangofy.server.ts`**:
    - Criar `createMangofyCardPayment` para processar transações de cartão.
    - Atualizar `PixResponseSchema` para um `MangofyResponseSchema` mais genérico que suporte status de aprovação de cartão.
    - Implementar o payload de `credit_card` conforme a documentação (holder_name, number, expiration_month, expiration_year, cvv).
- **`src/lib/mangofy.functions.ts`**:
    - Adicionar a função de servidor `generateCardPayment` com validação Zod para os dados sensíveis do cartão.

### Frontend e Interface do Usuário
- **`src/routes/checkout.$kit.tsx`**:
    - **Estado do Formulário**: Adicionar campos para `cardNumber`, `cardHolder`, `cardExpiry` e `cardCVV`.
    - **Seleção de Método**: Implementar alternância visual entre "PIX" e "Cartão de Crédito".
    - **Máscaras de Input**: Adicionar formatação em tempo real para o número do cartão (#### #### #### ####) e validade (MM/AA).
    - **Lógica de Submissão**: Condicionar a chamada da função de servidor (PIX vs Cartão) com base no método selecionado.
    - **Feedback Visual**: Exibir estados de carregamento e mensagens de erro específicas para falhas no cartão (ex: "Cartão recusado").

## Segurança
- Os dados do cartão serão enviados diretamente do componente para a Server Function, onde são processados via HTTPS para a Mangofy.
- Nenhuma informação de cartão será armazenada localmente ou em logs do servidor.

## Próximos Passos
1. Implementar as funções de backend para processamento de cartão.
2. Atualizar a interface do checkout para incluir o formulário de cartão.
3. Realizar testes de ponta a ponta com a API em modo sandbox/produção.
