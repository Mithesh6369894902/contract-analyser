import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    return extractFromPDF(filePath);
  } else if (ext === '.docx' || ext === '.doc') {
    return extractFromDOCX(filePath);
  } else if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }
}

async function extractFromPDF(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const header = buffer.slice(0, 5).toString('ascii');

  // If file doesn't start with %PDF-, it's plain text saved with a .pdf extension
  if (header !== '%PDF-') {
    return buffer.toString('utf-8');
  }

  try {
    const data = await pdfParse(buffer);
    if (data && data.text && data.text.trim().length > 0) {
      return data.text;
    }
  } catch (err) {
    console.warn('pdf-parse failed, checking text fallback:', err);
  }

  const fallback = buffer.toString('utf-8');
  if (fallback.includes('ARTICLE') || fallback.includes('Section') || fallback.includes('Agreement')) {
    return fallback;
  }

  // Printable strings fallback
  const raw = buffer.toString('latin1');
  const matches = raw.match(/[A-Za-z0-9 ,.;:!?'"()\-]{15,}/g);
  if (matches && matches.length > 3) {
    return matches.join('\n');
  }

  throw new Error('Could not parse PDF content');
}

async function extractFromDOCX(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
