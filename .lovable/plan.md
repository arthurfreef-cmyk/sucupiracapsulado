# Otimizar conversão e carregamento sem alterar copy ou design

## Objetivo
Reduzir fricções entre os botões de compra e a geração do PIX, mantendo exatamente os textos, preços, seções e aparência atuais.

## Fluxo de compra
- Preservar os parâmetros de campanha ao entrar no checkout, para medir corretamente cada origem.
- Tornar o formulário mais resistente a scripts externos e preenchimento automático, sem mudar campos ou layout.
- Evitar bloqueios desnecessários na consulta do CEP e garantir uma única tentativa de geração por clique.
- Corrigir a medição do funil para não duplicar eventos e registrar separadamente tentativa, erro e PIX gerado.
- Manter Duttyfy como geradora principal e BuckPay intacta.

## Carregamento
- Priorizar somente a imagem principal e remover o carregamento antecipado das imagens abaixo da primeira tela.
- Usar as imagens locais já otimizadas também no checkout, eliminando dependência externa nessa etapa crítica.
- Adiar recursos não essenciais e preservar dimensões fixas para evitar deslocamentos visuais.

## Validação
- Testar em celular o percurso completo: página inicial → seleção do kit → preenchimento → CEP → geração e leitura do QR Code.
- Verificar preservação dos parâmetros de campanha, ausência de cliques duplicados, erros visíveis e compilação final.
