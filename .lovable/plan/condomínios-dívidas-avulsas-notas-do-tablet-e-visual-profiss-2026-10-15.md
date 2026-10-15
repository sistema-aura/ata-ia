# Condomínios, Dívidas avulsas, Notas do tablet e Visual profissional

## 1. Condomínios (pastas por prédio)
- Nova tabela `condominios` (nome, nif, morada, fraccoes, zonas, ativo) importada do PDF enviado (~40 prédios), sem gastar créditos de IA — extração feita por código local.
- Nova página **Condomínios**: lista pesquisável de todos os prédios; cada prédio é uma "pasta" que mostra as assembleias e atas desse condomínio.
- **Autocomplete**: nos formulários de Assembleias e Nova Ata, ao escrever o nome do prédio aparecem sugestões da lista; ao escolher, preenche automaticamente NIF e morada.
- Histórico passa a poder filtrar/agrupar por condomínio (pasta).

## 2. Página "Dívidas" (gerar só a parte das dívidas)
- Nova página `/dividas`: escolhe-se o prédio (autocomplete), faz-se upload do mapa de dívidas em PDF (usa a leitura de PDF já existente) e gera **apenas o texto da secção de dívidas** formatado como na ata (agrupamento por meses, valores por extenso, total), pronto a copiar/colar numa ata antiga. Botão "Copiar" e "Descarregar Word".

## 3. Notas do tablet na Assembleia
- Novo campo "Resumo da reunião (tablet)" na página Assembleias: área de texto grande para colar/escrever o resumo tirado no tablet, guardado junto da assembleia (coluna `resumo_reuniao`), para não se perder.

## 4. Visual mais profissional
- Refino do tema atual (papel/dourado/azul-escuro): cabeçalhos de página consistentes com subtítulo, cartões com mais respiro, estados vazios mais elegantes, sidebar polida, melhor hierarquia tipográfica. Sem mudar a identidade — só elevar o acabamento.

## Detalhes técnicos
- Migração: `CREATE TABLE public.condominios` + GRANTs + RLS (acesso público como as restantes tabelas); `ALTER TABLE assembleias ADD resumo_reuniao text`.
- Import dos prédios: script local lê o PDF parseado e insere via SQL (sem IA).
- Componente `CondominioCombobox` reutilizável (input com sugestões filtradas).
- Dívidas: reutiliza a edge function `parse-pdf` (tipo mapa_dividas) e o agrupamento determinístico já existente; geração do texto no cliente a partir dos mesmos templates, sem nova chamada de IA.
- Rotas novas: `/condominios`, `/dividas`; entradas no sidebar.
