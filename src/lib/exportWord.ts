import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export interface WordFormattingConfig {
  font_family?: string;
  font_size?: number;
  margin_top?: number;
  margin_bottom?: number;
  margin_left?: number;
  margin_right?: number;
  line_spacing?: number;
  header_text?: string;
  footer_text?: string;
}

const DEFAULT_FONT = "Times New Roman";
const DEFAULT_SIZE = 22;
const DEFAULT_MARGIN = 1440;
const DEFAULT_SPACING = 120;

export async function exportAtaToWord(
  ataText: string,
  nomeCondominio?: string,
  numeroAta?: string,
  formatting?: WordFormattingConfig
) {
  const font = formatting?.font_family || DEFAULT_FONT;
  const size = formatting?.font_size || DEFAULT_SIZE;
  const spacing = formatting?.line_spacing || DEFAULT_SPACING;
  const marginTop = formatting?.margin_top || DEFAULT_MARGIN;
  const marginBottom = formatting?.margin_bottom || DEFAULT_MARGIN;
  const marginLeft = formatting?.margin_left || DEFAULT_MARGIN;
  const marginRight = formatting?.margin_right || DEFAULT_MARGIN;

  const lines = ataText.split("\n");
  const paragraphs: Paragraph[] = [];

  // Header
  if (formatting?.header_text) {
    for (const hLine of formatting.header_text.split("\n")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: hLine, size: size - 2, font, italics: true }),
          ],
        })
      );
    }
    paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: spacing } }));
      continue;
    }

    const clean = trimmed
      .replace(/^#{1,6}\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/^---+$/, "")
      .replace(/^\*\s+/, "• ");

    // Title line (ATA NÚMERO)
    if (clean.match(/^ATA\s+(NÚMERO|N[ÚU]MERO)/i)) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: clean, bold: true, size: size + 6, font }),
          ],
        })
      );
      continue;
    }

    // Signature lines
    if (clean.includes("_____________")) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({ text: clean, size, font }),
          ],
        })
      );
      continue;
    }

    // Bullet points
    if (clean.startsWith("•") || clean.startsWith("ü") || clean.startsWith("-")) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: Math.round(spacing * 0.67) },
          children: [
            new TextRun({ text: clean, size, font }),
          ],
        })
      );
      continue;
    }

    // Sub-bullets
    if (clean.startsWith("o ") || clean.startsWith("o\t")) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: Math.round(spacing * 0.5) },
          children: [
            new TextRun({ text: clean, size, font }),
          ],
        })
      );
      continue;
    }

    // Numbered list
    if (clean.match(/^\d+\.\s/)) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: Math.round(spacing * 0.67) },
          children: [
            new TextRun({ text: clean, size, font }),
          ],
        })
      );
      continue;
    }

    // Ponto titles
    const pontoMatch = clean.match(/^(Ponto\s+\w+:\s*[^-]*-?\s*)(.*)/i);
    if (pontoMatch) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 240, after: spacing },
          children: [
            new TextRun({ text: pontoMatch[1], bold: true, size, font }),
            new TextRun({ text: pontoMatch[2] || "", size, font }),
          ],
        })
      );
      continue;
    }

    // Default paragraph
    paragraphs.push(
      new Paragraph({
        spacing: { after: spacing },
        children: [
          new TextRun({ text: clean, size, font }),
        ],
      })
    );
  }

  // Footer
  if (formatting?.footer_text) {
    paragraphs.push(new Paragraph({ spacing: { before: 300 } }));
    for (const fLine of formatting.footer_text.split("\n")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: fLine, size: size - 2, font, italics: true }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: marginTop,
              bottom: marginBottom,
              left: marginLeft,
              right: marginRight,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = numeroAta
    ? `Ata nº ${numeroAta}.docx`
    : nomeCondominio
      ? `Ata_${nomeCondominio.replace(/\s+/g, "_")}.docx`
      : "Ata_Assembleia.docx";
  saveAs(blob, filename);
}
