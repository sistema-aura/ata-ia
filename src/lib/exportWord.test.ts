import { describe, expect, it, vi } from "vitest";
import PizZip from "pizzip";
import { exportAtaToWord } from "./exportWord";

const { saveAs } = vi.hoisted(() => ({ saveAs: vi.fn() }));
vi.mock("file-saver", () => ({ saveAs }));

describe("minutes number in Word", () => {
  it.each([
    ["50", "CINQUENTA"],
    ["9", "NOVE"],
    ["0", "ZERO"],
    ["21", "VINTE E UM"],
    ["CINCO", "CINCO"],
  ])("exports %s as %s", async (number, words) => {
    saveAs.mockClear();
    await exportAtaToWord(`ATA NÚMERO ${number}\nTexto da ata.`, "Condomínio", number);
    const blob = saveAs.mock.calls[0]?.[0] as Blob;
    const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
    const xml = new PizZip(bytes).file("word/document.xml")?.asText();
    expect(xml).toContain(`ATA NÚMERO ${words}`);
    expect(xml).toContain("Texto da ata.");
    expect(saveAs).toHaveBeenCalledWith(blob, `Ata nº ${number}.docx`);
  });
});