# Pendências — paridade com o manual Atena II / Ramuza 2.0

Contexto: `docs/manual-do-usuario-atenaii-software.pdf` é o manual do software legado
(TM-xA) que o PesoHub está substituindo. Em 2026-07-19 foi feito um levantamento de
gap entre o manual e o PesoHub, e a maior parte já estava implementada (schema,
backend e frontend para Setor, Sub-Setor, Fornecedor, Alérgico, Tabela Nutricional,
Operador, Imagem, Formato de Impressão, Código de Barras, Texto Global, Tecla de
Acesso Rápido, SPEC, Configuração Avançada, e os campos novos do `Product`).

Duas armadilhas de ambiente já corrigidas nessa sessão: migrations pendentes no
banco (`prisma migrate deploy`) e `worker/prisma/schema.prisma` desatualizado
(ressincronizado a partir do schema do backend — ver memória
`project_worker_prisma_schema_drift`).

## O que falta

1. **Protocolo real da balança (bloqueador principal).**
   `agent-local/src/scale-client.ts` só decodifica 5 dos 69 campos do registro PLU
   (PLU number, código, EAN13, preço, nome). Tara, lote, tabela nutricional,
   fornecedor, alérgico, textos extras e datas de validade já existem no banco e
   aparecem nas telas, mas **nunca chegam na balança física** — o worker
   (`worker/src/processor.ts` → `agent-bridge.ts`) e o agent-local só sabem montar
   esses 5 campos. É preciso capturar o tráfego do software oficial enviando um PLU
   completo (Wireshark ou similar) e mapear os 64 campos restantes do
   `PLU_FIELD_TEMPLATE` antes de expandir o protocolo. Ver memória
   `project_scale_protocol_field_gap`.

2. **Telas novas não testadas na UI de verdade.** `/cadastros`, `/etiquetas`,
   `/spec`, `/configuracoes`, `/assistente` só passaram por typecheck até agora.
   Falta exercitar o fluxo real em cada uma (criar setor, sub-setor, fornecedor,
   alérgico, tabela nutricional, operador, imagem; configurar formato de impressão
   e código de barras; alterar um parâmetro SPEC; rodar o assistente de
   configuração ponta a ponta).

3. **Tecla de Acesso Rápido — editor visual.** O model `TeclaAcessoRapido` e a rota
   backend existem (`layout: Json?`), mas a única referência encontrada no
   frontend é um toggle de habilitar/desabilitar em `/configuracoes` — não o
   editor visual do teclado de 63/126/189 teclas do manual (seção 2.3), onde cada
   tecla é atribuída a um PLU ou função. Confirmar se existe em outro lugar; se
   não, precisa ser construído.

4. **Rebuild em ambiente Docker.** Tudo foi validado só no backend local
   (`start:dev`) e via typecheck do frontend. As imagens Docker precisam ser
   reconstruídas (`docker compose up -d --build`) e testadas antes de considerar
   pronto — mesmo padrão usado pra validar a correção do bug de branding no
   logout.

## Fora de escopo por enquanto (seção 2.1 do manual)

A tabela SPEC do manual tem ~150 parâmetros de configuração de firmware da
balança (arredondamento, modo de tara, senha, Wi-Fi, etc.). O model
`SpecParametro` existe e a tela `/spec` cobre isso via `frontend/lib/spec-catalog.ts`,
mas não foi auditado campo a campo contra a tabela do manual nesta sessão.
