import * as mammoth from 'mammoth';

/**
 * Extracts plain text from various file formats (.txt, .docx, .pdf) in the browser.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (ext === '.txt') {
    const text = await file.text();
    return cleanExtractedText(text);
  }

  if (ext === '.docx' || ext === '.doc') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await (mammoth as any).extractRawText({ arrayBuffer });
      if (result && result.value && result.value.trim().length > 0) {
        return cleanExtractedText(result.value);
      }
    } catch (docxErr) {
      console.warn('Mammoth docx extraction error, trying fallback:', docxErr);
    }
    // Fallback for docx or text
    const text = await file.text();
    return cleanExtractedText(text);
  }

  if (ext === '.pdf') {
    return extractTextFromPdf(file);
  }

  // Generic fallback: read as text
  return cleanExtractedText(await file.text());
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 1. Check if the file is actually a plain text file saved with a .pdf extension
  // (e.g. sample-contract.pdf in this project is plain text)
  const header = String.fromCharCode(...bytes.slice(0, 5));
  if (header !== '%PDF-') {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(bytes);
    if (text && text.trim().length > 0) {
      return cleanExtractedText(text);
    }
  }

  // 2. Parse true PDF using pdfjs-dist
  try {
    const pdfjs: any = await import('pdfjs-dist');
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
    }

    const loadingTask = pdfjs.getDocument({
      data: bytes,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageStrings = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter((str: string) => str.trim().length > 0);

      fullText += pageStrings.join(' ') + '\n\n';
    }

    if (fullText.trim().length > 20) {
      return cleanExtractedText(fullText);
    }
  } catch (pdfErr) {
    console.warn('Client-side pdfjs extraction failed, trying text stream extraction:', pdfErr);
  }

  // 3. Fallback heuristic: Extract readable text blocks from the binary PDF stream
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);

    // Look for text within parentheses in PDF text operators (Tj / TJ)
    const matches: string[] = [];
    const tjRegex = /\(([^()]{2,})\)\s*T[jJ]/g;
    let m;
    while ((m = tjRegex.exec(raw)) !== null) {
      matches.push(m[1]);
    }

    if (matches.length > 5) {
      return cleanExtractedText(matches.join(' '));
    }

    // Direct printable strings fallback
    const printableMatches = raw.match(/[A-Za-z0-9 ,.;:!?'"()\-]{15,}/g);
    if (printableMatches && printableMatches.length > 3) {
      return cleanExtractedText(printableMatches.join('\n'));
    }
  } catch (err) {
    console.error('Fallback PDF extraction error:', err);
  }

  throw new Error('Unable to extract text from this PDF file. Please copy and paste the contract text instead.');
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
