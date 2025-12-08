// Create a simple test PDF for testing the toolkit
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs/promises";

async function createTestPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Create 3 pages
  for (let i = 1; i <= 3; i++) {
    const page = pdfDoc.addPage([612, 792]); // Letter size

    // Add page header
    page.drawText(`TEST DOCUMENT - PAGE ${i}`, {
      x: 72,
      y: 720,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Add some body text
    const bodyText = [
      "This is a test document for the Legal Exhibits Toolkit.",
      "It contains sample text that can be used to test various features:",
      "",
      "• Bates numbering - Add sequential page stamps",
      "• Watermarking - Add CONFIDENTIAL or DRAFT stamps",
      "• Redaction - Black out sensitive content",
      "• Table of Contents - Generate exhibit indexes",
      "",
      `Page ${i} of 3`,
    ];

    let y = 680;
    for (const line of bodyText) {
      page.drawText(line, {
        x: 72,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 20;
    }

    // Add some "sensitive" content that could be redacted
    page.drawText("SSN: 123-45-6789", {
      x: 72,
      y: 400,
      size: 12,
      font,
      color: rgb(0.5, 0, 0),
    });

    page.drawText("Confidential Information: Secret Data Here", {
      x: 72,
      y: 370,
      size: 12,
      font,
      color: rgb(0.5, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile("./test/sample.pdf", pdfBytes);
  console.log("Created test/sample.pdf with 3 pages");
}

createTestPdf().catch(console.error);
