import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export async function exportAtaToWord(ataText: string, nomeCondominio?: string, numeroAta?: string) {
  const lines = ataText.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines but add spacing
    if (!trimmed) {
      paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    // Remove any remaining markdown
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
            new TextRun({ text: clean, bold: true, size: 28, font: "Times New Roman" }),
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
            new TextRun({ text: clean, size: 22, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }

    // Bullet points (• or ü or -)
    if (clean.startsWith("•") || clean.startsWith("ü") || clean.startsWith("-")) {
      const bulletChar = clean.startsWith("ü") ? "ü" : clean.startsWith("•") ? "•" : "-";
      paragraphs.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 80 },
          children: [
            new TextRun({ text: clean, size: 22, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }

    // Sub-bullets (o )
    if (clean.startsWith("o ") || clean.startsWith("o\t")) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 720 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: clean, size: 22, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }

    // Numbered list items (1. 2. etc.)
    if (clean.match(/^\d+\.\s/)) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 80 },
          children: [
            new TextRun({ text: clean, size: 22, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }

    // "Ponto Um:", "Ponto Dois:" etc - bold the title part
    const pontoMatch = clean.match(/^(Ponto\s+\w+:\s*[^-]*-?\s*)(.*)/i);
    if (pontoMatch) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({ text: pontoMatch[1], bold: true, size: 22, font: "Times New Roman" }),
            new TextRun({ text: pontoMatch[2] || "", size: 22, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }

    // Default paragraph
    paragraphs.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: clean, size: 22, font: "Times New Roman" }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
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
