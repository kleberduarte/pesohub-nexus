# Sondas — engenharia reversa do protocolo da balança

**Nada aqui roda em produção.** São ferramentas de diagnóstico e experimentos usados para descobrir como a balança Ramuza/Atena se comporta.

O código que roda na loja está em `../src` — apenas 6 módulos, a partir de `index.ts`.

## Por que existem

O protocolo da balança não é documentado, e ela **aceita comandos e os descarta em silêncio**. Cada arquivo aqui nasceu de uma hipótese; a maioria foi descartada. Estão preservados porque **saber o que NÃO funciona vale tanto quanto saber o que funciona** — sem isso, a próxima pessoa repete a mesma tentativa.

## Como rodar

```bash
SCALE_IP=192.168.15.8 npx ts-node --transpile-only probes/<arquivo>.ts
```

Alguns têm atalho no `package.json` (`npm run probe:plu-dump`, `npm run probe:nu3`, ...).

Para conferir se ainda compilam depois de mexer em `src/`:

```bash
npm run probes:check
```

## As que valem conhecer

| Arquivo | Para que serve |
|---|---|
| `probe-plu-backup.ts` | **Backup restaurável dos PLUs.** Rodar ANTES de qualquer escrita em massa — uma linha lida por `UPL/PLU` pode ser reescrita verbatim e volta idêntica byte a byte |
| `probe-plu-dump.ts` | Lista todos os PLUs com índice de campo — usado para decodificar o wire campo a campo |
| `probe-lab-list.ts` | Slots de etiqueta ocupados na balança |
| `probe-lab-avulso.ts` | Prova que um layout sem produto vinculado chega na balança (card #51) |
| `probe-plu-readback.ts` | Escreve e relê — **escreve antes de ler**, cuidado |
| `fake-scale.ts` | Balança de mentira, para testar sem hardware |
| `analyze-plu-capture.ts` | Analisa captura Wireshark do software oficial |

## A família `probe-nu3*` — 16 arquivos, uma hipótese cada

A tabela nutricional (`DWL/NU3`) não persistia. A balança respondia normalmente e não gravava. Cada arquivo é uma hipótese testada:

`bom`, `clear`, `exact-replay`, `fragmented-write`, `long-lived`, `persistent-connection`, `then-link`, `trailing-field`, `two-step-same-conn`, `utf8-ack`, `idx0-fullbatch`, `idx0-plus-idx1`, `alone-retest`, `idx1-retest`, `dump`.

**A resposta veio na tentativa 28:** a linha saía com **57 campos** e a balança exige **58** — faltava um tab final. Nenhuma das hipóteses sofisticadas acima era o problema; era contagem de campos.

A lição está no `ARCHITECTURE.md`: quando a balança descarta em silêncio, **conte os campos antes de teorizar**.

## Cuidado

Várias sondas **escrevem** na balança. `probe-plu-readback` cria um PLU antes de ler. Antes de rodar contra uma balança de loja, saiba o que a sonda faz — e rode `probe-plu-backup` primeiro.
