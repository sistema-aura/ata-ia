import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export interface WordFormattingConfig {
  font_family?: string;
  font_size?: number;
  margin_top?: number;
  margin_bottom?: number;
  margin_left?: number;
  margin_right?: number;
  line_spacing?: number;
  paragraph_spacing_after?: number;
  first_line_indent?: number;
  title_alignment?: "left" | "center" | "right" | "justify";
  body_alignment?: "left" | "center" | "right" | "justify";
  header_text?: string;
  footer_text?: string;
}

const DEFAULT_FONT = "Times New Roman";
const DEFAULT_SIZE = 22;
const DEFAULT_MARGIN = 1440;
const DEFAULT_SPACING = 120;
const DEFAULT_ALIGNMENT = AlignmentType.JUSTIFIED;

const resolveAlignment = (
  alignment?: WordFormattingConfig["body_alignment"]
): AlignmentType => {
  switch (alignment) {
    case "left":
      return AlignmentType.LEFT;
    case "right":
      return AlignmentType.RIGHT;
    case "center":
      return AlignmentType.CENTER;
    case "justify":
    default:
      return AlignmentType.JUSTIFIED;
  }
};

export async function exportAtaToWord(
  ataText: string,
  nomeCondominio?: string,
  numeroAta?: string,
  formatting?: WordFormattingConfig
) {
  const font = formatting?.font_family ?? DEFAULT_FONT;
  const size = formatting?.font_size ?? DEFAULT_SIZE;
  const lineSpacing = formatting?.line_spacing ?? DEFAULT_SPACING;
  const paragraphSpacingAfter = formatting?.paragraph_spacing_after ?? lineSpacing;
  const marginTop = formatting?.margin_top ?? DEFAULT_MARGIN;
  const marginBottom = formatting?.margin_bottom ?? DEFAULT_MARGIN;
  const marginLeft = formatting?.margin_left ?? DEFAULT_MARGIN;
  const marginRight = formatting?.margin_right ?? DEFAULT_MARGIN;
  const firstLineIndent = formatting?.first_line_indent ?? 0;
  const titleAlignment = resolveAlignment(formatting?.title_alignment);
  const bodyAlignment = resolveAlignment(formatting?.body_alignment) ?? DEFAULT_ALIGNMENT;

  const lines = ataText.split("\n");
  const paragraphs: Paragraph[] = [];

  if (formatting?.header_text) {
    for (const hLine of formatting.header_text.split("\n")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: lineSpacing, after: 60 },
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
      paragraphs.push(new Paragraph({ spacing: { after: paragraphSpacingAfter } }));
      continue;
    }

    const clean = trimmed
      .replace(/^#{1,6}\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/^---+$/, "")
      .replace(/^\*\s+/, "• ");

    if (clean.match(/^ATA\s+(NÚMERO|N[ÚU]MERO)/i)) {
      paragraphs.push(
        new Paragraph({
          alignment: titleAlignment,
          spacing: { line: lineSpacing, after: 300 },
          children: [
            new TextRun({ text: clean, bold: true, size: size + 6, font }),
          ],
        })
      );
      continue;
    }

    if (clean.includes("_____________")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: lineSpacing, before: 200, after: 200 },
          children: [new TextRun({ text: clean, size, font })],
        })
      );
      continue;
    }

    if (clean.startsWith("•") || clean.startsWith("ü") || clean.startsWith("-")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 360 },
          spacing: { line: lineSpacing, after: Math.round(paragraphSpacingAfter * 0.67) },
          children: [new TextRun({ text: clean, size, font })],
        })
      );
      continue;
    }

    if (clean.startsWith("o ") || clean.startsWith("o\t")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 720 },
          spacing: { line: lineSpacing, after: Math.round(paragraphSpacingAfter * 0.5) },
          children: [new TextRun({ text: clean, size, font })],
        })
      );
      continue;
    }

    if (clean.match(/^\d+\.\s/)) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 360 },
          spacing: { line: lineSpacing, after: Math.round(paragraphSpacingAfter * 0.67) },
          children: [new TextRun({ text: clean, size, font })],
        })
      );
      continue;
    }

    const pontoMatch = clean.match(/^(Ponto\s+\w+:\s*[^-]*-?\s*)(.*)/i);
    if (pontoMatch) {
      paragraphs.push(
        new Paragraph({
          alignment: bodyAlignment,
          indent: { firstLine: firstLineIndent },
          spacing: { line: lineSpacing, before: 240, after: paragraphSpacingAfter },
          children: [
            new TextRun({ text: pontoMatch[1], bold: true, size, font }),
            new TextRun({ text: pontoMatch[2] || "", size, font }),
          ],
        })
      );
      continue;
    }

    paragraphs.push(
      new Paragraph({
        alignment: bodyAlignment,
        indent: { firstLine: firstLineIndent },
        spacing: { line: lineSpacing, after: paragraphSpacingAfter },
        children: [new TextRun({ text: clean, size, font })],
      })
    );
  }

  if (formatting?.footer_text) {
    paragraphs.push(new Paragraph({ spacing: { before: 300 } }));
    for (const fLine of formatting.footer_text.split("\n")) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: lineSpacing, after: 60 },
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
