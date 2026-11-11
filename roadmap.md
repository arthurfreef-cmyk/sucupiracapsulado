# Fruitfy PIX
- [x] Substituir LowTrack pelo pixel UTMify enviado; script respondeu 200 na página e no checkout, sem LowTrack, com PIX simulado exibido e recuperado.
- [x] Integrar rastreamento UTMify e verificar checkout com PIX simulado.
- [ ] Ativar redirecionamento ao voltar UTMify — redirecionamento ao voltar aguarda URL real do usuário, pois o arquivo contém endereço de exemplo.
- [x] Atualizar Black Friday para R$ 12,90 / R$ 47,90 / R$ 97,00; ancoragens reduzidas para R$ 79 / R$ 237 / R$ 395; 31 testes aprovados e PIX reais dos três kits gerados, exibidos e recuperados após atualizar, sem pagamento ou publicação.
- [x] Otimizar carregamento de imagens e vídeos; alinhar prazo de entrega e contato (sem WhatsApp).
- [x] Refinar apresentação do checkout para clareza e confiança; formulário, entrega e PIX simulado verificados em telas grandes e pequenas, com 10 testes aprovados e sem erros observados.
- [x] Corrigir consulta de CEP com alternativa, preenchimento de endereços incompletos e proteção contra respostas antigas; validar com testes.
- [x] Melhorar confiança e reduzir fricções do checkout sem alterar copy, identidade ou provedor.
- [x] Validar preenchimento, frete acessível e PIX copia e cola após os ajustes.
- [x] Validar cobrança real dos três produtos após preenchimento do suporte.
- [x] Integrar Fruitfy como principal, preservando Duttyfy e BuckPay.
- [x] Testar validação, checkout, QR Code e compilação.

# Verificação da página e checkout
- [x] Corrigir posicionamento das seções sob o menu e isolar falhas de pixel nos kits; verificar os três checkouts e campanhas em 1280/390/320px, sem cobranças reais.
- [ ] Substituir links de políticas que apontam ao topo — aguarda URLs ou documentos reais do responsável.
- [x] Refinar leitura do checkout em computador/celular, permitir correção de endereço, focar campos incompletos e recuperar PIX mesmo com falha de escrita; 31 testes e fluxo simulado completo aprovados, sem nova cobrança real ou publicação.
- [x] Corrigir frete após endereço manual, recuperar PIX ao atualizar, isolar rastreamento e evitar oferta bloqueada sem armazenamento; 25 testes e geração real de PIX R$ 27 aprovados, sem pagamento ou publicação.
- [x] Confirmar geração real de PIX Fruitfy de R$ 27, valor, CRC e leitura do QR Code.
- [x] Verificar resistência a falhas do rastreador: uma única solicitação, PIX exibido mesmo com exceção externa, cópia confirmada; página e checkout publicados respondem 200.
- [x] Reproduzir erros na página e no checkout sem alterar estrutura, visual ou copy.
- [x] Corrigir divergência de frete, endereço de CEP anterior, cópia sem confirmação e leitura de cookies malformados; validar fluxo com pagamento simulado, sem criar cobrança real.
- [ ] Confirmar eventos do Pixel Booster — bloqueado pela proteção externa da Fruitfy; depende de liberação do fornecedor.

# Remover upsells
- [x] Remover todas as ofertas adicionais e bloquear novas cobranças; 29 testes aprovados e fluxo PIX simulado confirmado diretamente em `/obrigado`, com os três links antigos redirecionados e compilação sem erros.
