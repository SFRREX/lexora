/**
 * documentExtractor.js — Multi-format document text extraction utility.
 * Supports PDF (.pdf), Plain Text (.txt), and Markdown (.md).
 */

export async function extractTextFromPdf(arrayBuffer) {
  try {
    const pdfjs = await import('pdfjs-dist');
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');
      if (pageString.trim()) {
        pageTexts.push(pageString.trim());
      }
    }

    const result = pageTexts.join('\n\n');
    if (result.trim()) {
      return result;
    }
  } catch (err) {
    console.warn('PDF.js extraction notice:', err.message);
  }

  // Fallback: extract plain ASCII/UTF-8 text strings from PDF stream
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(arrayBuffer);
  const textMatches = raw.match(/\(([^()]{2,})\)|\[([^[\s\]]{2,})\]/g);
  if (textMatches && textMatches.length > 0) {
    const extracted = textMatches
      .map((m) => m.replace(/^[([]|[)\]]$/g, ''))
      .filter((s) => /^[a-zA-Z0-9\s.,;:!?'"()-]+$/.test(s) && s.length > 2)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (extracted.length > 20) {
      return extracted;
    }
  }

  throw new Error('Could not extract readable text from this PDF. Please ensure it contains selectable text.');
}

export async function extractTextFromDocument(file) {
  if (!file) {
    throw new Error('No file provided.');
  }

  const fileName = file.name.toLowerCase();

  // Plain Text or Markdown
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || file.type.startsWith('text/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || '');
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
    });
  }

  // PDF Document
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    return await extractTextFromPdf(arrayBuffer);
  }

  // Default fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => reject(new Error('Unsupported file format. Please upload a PDF, TXT, or MD file.'));
    reader.readAsText(file);
  });
}
