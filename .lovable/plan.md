## Objetivo

Corrigir a geração das atas para respeitar rigorosamente o `Ata_tipo.docx`, os textos jurídicos e as regras de dívidas. **A IA deixa de escrever ata**: apenas extrai dados dos PDFs. Toda a montagem passa a ser determinística em código, e o Word é gerado a partir de uma cópia do template original.

## Ficheiros afetados

**Novos**
- `public/templates/ata_tipo.docx` — cópia do template com placeholders `{campo}` e loops `{#lista}...{/lista}` (marcadores nativos preservados).
- `src/lib/ataBuilder.ts` — montagem determinística: pontos, presenças, dívidas, agrupamento de meses, cálculo de totais, validação, ordinais e extenso.
- `src/lib/debtGrouping.ts` — agrupamento de meses consecutivos por ano e por tipo, com deteção de inconsistências.
- `src/components/DebtValidationWarning.tsx` — banner por cima da pré-visualização quando somas divergem (fração, valor lido, soma, diferença).

**Alterados**
- `src/lib/exportWord.ts` → passa a usar `docxtemplater` + `pizzip`, carrega `ata_tipo.docx`, preenche variáveis e clona/remove blocos de listas nativas. Sem regenerar formatação.
- `src/components/PontosOrdemDiaForm.tsx` → quando `tipo=personalizado`, o campo de texto “Deliberação (texto exato)” passa a ser obrigatório e é sempre usado verbatim.
- `src/components/AtaPreview.tsx` → invoca `ataBuilder` no cliente (sem edge para o cenário normal) e mostra o banner de validação; mantém o mesmo layout e botões.
- `src/components/PdfUpload.tsx` → sem mudanças visuais; passa a receber também `permilagemPresente/total` e a preservar a ordem original da OT.
- `supabase/functions/parse-pdf/index.ts` → prompts endurecidos: extrai dados brutos (nunca redige), separa por ano e por tipo, valida totais e devolve `warnings[]`.
- `supabase/functions/generate-ata/index.ts` → passa a ser usado só para gerar deliberações de pontos personalizados quando o utilizador expressamente pedir sugestão (opcional, campo continua manual por defeito).

## Regras determinísticas (código, não IA)

- **Ordem de Trabalhos**: preservada exatamente como vem no PDF. Sem reordenar, sem juntar, sem inventar.
- **Presenças/ausências**: linha por linha na ordem da folha. Sem NIF. Assinaturas apenas presentes + Presidente na 1ª linha.
- **Dívidas**:
  - Extração estruturada por fração → array de `{tipo, mes, ano, quotizacao, fundoReserva, quotaExtraDescricao, valor}`.
  - Agrupamento: só juntar meses **consecutivos**, **mesmo ano**, **mesmo tipo**. Nunca cruzar anos.
  - Frase gerada a partir do template jurídico por tipo (`quotizacao+fundo_reserva`, `quota_extra`, `credito`, `seguro`, `penalizacao`, `judicial`).
  - Total da fração por extenso via helper `numeroPorExtenso`.
  - Se `Σ subitens ≠ total lido`: adiciona warning `{fracao, lido, calculado, diferenca}` e continua.
- **Formatação numérica**: permilagem 4 decimais, percentagem 2 decimais, sempre com vírgula.

## Motor Word (docxtemplater)

O `Ata_tipo.docx` é editado uma vez para conter marcadores:
- Variáveis simples: `{numeroAta}`, `{data_extenso}`, `{hora}`, `{minutos}`, `{condominio}`, `{nif}`, `{presidente}`, `{permilagem_presente}`, `{percentagem_presente}`.
- Loops nativos: `{#pontos}...{/pontos}`, `{#presentes}...{/presentes}`, `{#ausentes}...{/ausentes}`, `{#dividas}...{#subitens}...{/subitens}{/dividas}`, `{#assinaturas}...{/assinaturas}`.
- Os parágrafos dentro dos loops mantêm os estilos, listas multinível, tabulações e cabeçalho/rodapé originais. Sem HTML, sem markdown.

## Dependências novas
- `docxtemplater`, `pizzip` — leves e battle-tested para preencher .docx preservando estilos.

## Fora de âmbito
- Não altero layout, cores, navegação, autenticação, páginas ou botões.
- Não mexo em Templates/Formatação por empresa nem no ecrã Admin.
- Não gero orçamento/tabelas (fica placeholder no template como pediste).

## Ordem de implementação
1. Instalar `docxtemplater` + `pizzip`.
2. Preparar `public/templates/ata_tipo.docx` com marcadores (baseado no ficheiro que enviaste, mantendo tudo o resto igual).
3. Criar `debtGrouping.ts` + `ataBuilder.ts`.
4. Reescrever `exportWord.ts`.
5. Ajustar `AtaPreview.tsx` (banner + chamar builder).
6. Ajustar `PontosOrdemDiaForm.tsx` (deliberação manual obrigatória em personalizado).
7. Endurecer `parse-pdf` (extração fiel, warnings).
8. Testar com os PDFs que enviaste (005_*) e comparar com `Ata_nº_10.docx`.
