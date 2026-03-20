

## Problem

The current approach sends **all** the preset texts to the AI and asks it to "copy them word for word." This is fundamentally unreliable — LLMs rephrase, summarize, and alter text regardless of how many times you tell them not to. The company formatting templates and preset texts you configured are being ignored or modified because the AI treats them as suggestions, not commands.

## Solution: Build the Ata Deterministically in Code

Stop relying on the AI to copy your templates. Instead, **construct the ata structure directly in code** and only use the AI for the parts that genuinely need generation (custom point deliberations).

### Architecture Change

```text
CURRENT FLOW:
  All data + all templates → AI → Full ata text (unreliable)

NEW FLOW:
  1. Code builds: opening paragraph, attendance, legal text, 
     preset points, debts, closing, signatures (deterministic)
  2. AI generates ONLY: deliberation text for custom points
  3. Code stitches everything together → Final ata (reliable)
```

### What Changes

**File: `supabase/functions/generate-ata/index.ts`**

1. **New function `buildAtaDeterministic()`** — Takes all form data + company formatting and produces the full ata text by:
   - Filling placeholders in `opening_paragraph_template` with actual data (date, location, NIF, etc.)
   - Listing agenda items using `agenda_item_template`
   - Building attendance/absentee lists using the item templates
   - Filling `legal_opening_text` with calculated permilagem sums and percentages
   - For **"padrao" points**: inserting `descricaoPadrao` text verbatim with the "Ponto Um:" label — no AI involved
   - For **"personalizado" points**: inserting a placeholder marker like `{{AI_PONTO_3}}` 
   - Building debts section deterministically (already mostly done)
   - Adding closing text, signatures

2. **Reduced AI scope** — The AI prompt now only receives:
   - The personalizado points that need deliberation text
   - Context about the assembly (for tone/relevance)
   - Instructions to return ONLY the deliberation paragraphs, numbered to match

3. **Post-processing** — Replace `{{AI_PONTO_X}}` markers with the AI-generated text to produce the final ata

### Benefits
- Preset texts appear **exactly** as configured — guaranteed, no AI involved
- Company templates (opening, closing, legal, attendance format) are respected perfectly
- AI only writes what it should: custom deliberation text
- Faster generation (smaller prompt, less AI work)
- Debts, signatures, attendance all formatted by code, not AI interpretation

### Additional Details
- Date conversion to "extenso" (e.g., "vinte e cinco de março de dois mil e vinte e seis") will be done in code with a helper function
- Number-to-words helper for ata number
- Permilagem sum calculated arithmetically in code
- The streaming response still works — the deterministic parts are sent first, then AI-generated parts stream in

