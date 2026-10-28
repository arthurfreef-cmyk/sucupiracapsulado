# Fruitfy PIX
- [x] Criar oferta opcional de 5 frascos por R$ 47,90, com página pós-pagamento, confirmação real via Fruitfy, checkout PIX separado e opção clara de recusar.
- [x] Otimizar carregamento de imagens e vídeos; alinhar prazo de entrega e contato (sem WhatsApp).
- [x] Refinar apresentação do checkout para clareza e confiança; formulário, entrega e PIX simulado verificados em telas grandes e pequenas, com 10 testes aprovados e sem erros observados.
- [x] Corrigir consulta de CEP com alternativa, preenchimento de endereços incompletos e proteção contra respostas antigas; validar com testes.
- [x] Melhorar confiança e reduzir fricções do checkout sem alterar copy, identidade ou provedor.
- [x] Validar preenchimento, frete acessível e PIX copia e cola após os ajustes.
- [x] Validar cobrança real dos três produtos após preenchimento do suporte.
- [x] Integrar Fruitfy como principal, preservando Duttyfy e BuckPay.
- [x] Testar validação, checkout, QR Code e compilação.

# Verificação da página e checkout
- [x] Confirmar geração real de PIX Fruitfy de R$ 27, valor, CRC e leitura do QR Code.
- [x] Verificar resistência a falhas do rastreador: uma única solicitação, PIX exibido mesmo com exceção externa, cópia confirmada; página e checkout publicados respondem 200.
- [x] Reproduzir erros na página e no checkout sem alterar estrutura, visual ou copy.
- [x] Corrigir divergência de frete, endereço de CEP anterior, cópia sem confirmação e leitura de cookies malformados; validar fluxo com pagamento simulado, sem criar cobrança real.
- [ ] Confirmar eventos do Pixel Booster — bloqueado pela proteção externa da Fruitfy; depende de liberação do fornecedor.