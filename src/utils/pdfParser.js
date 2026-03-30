import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

// Worker served from /public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Keywords to match each chapter (flexible matching)
const CHAPTER_KEYWORDS = [
    { id: 'cap-01', keywords: ['acondicionamiento', 'terreno'] },
    { id: 'cap-02', keywords: ['cimentacion'] },
    { id: 'cap-03', keywords: ['estructura'] },
    { id: 'cap-04', keywords: ['fachada', 'particion'] },
    { id: 'cap-05', keywords: ['carpinter', 'cerrajer', 'vidrio', 'protecciones solares'] },
    { id: 'cap-06', keywords: ['remate', 'ayuda'] },
    { id: 'cap-07', keywords: ['instalacion'] },
    { id: 'cap-08', keywords: ['aislamiento', 'impermeabilizacion'] },
    { id: 'cap-09', keywords: ['cubierta'] },
    { id: 'cap-10', keywords: ['revestimiento', 'trasdosado'] },
    { id: 'cap-11', keywords: ['señalizacion', 'senalizacion', 'equipamiento'] },
    { id: 'cap-12', keywords: ['urbanizacion interior', 'urbanización interior'] },
    { id: 'cap-13', keywords: ['dotacion servicio', 'dotación servicio', 'servicios urbanisticos', 'servicios urbanísticos'] },
    { id: 'cap-14', keywords: ['gestion de residuo', 'gestión de residuo'] },
    { id: 'cap-15', keywords: ['control de calidad', 'ensayo'] },
    { id: 'cap-16', keywords: ['seguridad y salud'] },
];

/**
 * Normalize text for matching: lowercase, remove accents
 */
function normalize(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Find which chapter a line of text belongs to
 */
function matchChapter(text) {
    const norm = normalize(text);
    for (const ch of CHAPTER_KEYWORDS) {
        for (const kw of ch.keywords) {
            if (norm.includes(normalize(kw))) {
                return ch.id;
            }
        }
    }
    return null;
}

/**
 * Extract percentage values from text.
 * Looks for patterns like "5,39%" or "5.39%" or just "5,39"
 * Returns array of numbers found
 */
function extractPercentages(text) {
    // Match numbers with comma or dot as decimal separator, optionally followed by %
    const regex = /(\d{1,3}[.,]\d{1,2})\s*%?/g;
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (!isNaN(val) && val <= 100) {
            matches.push(val);
        }
    }
    return matches;
}

/**
 * Parse a PDF file and extract certification data.
 * Returns an object like: { 'cap-01': 4.21, 'cap-02': 8.06, ... }
 *
 * Strategy:
 * 1. Extract all text from all pages
 * 2. Look for lines containing chapter names
 * 3. For each chapter line, find the LAST percentage (which is typically the certification column)
 */
export async function parseCertificacionPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let allText = [];

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Group text items by their Y position (same row)
        const rows = {};
        for (const item of textContent.items) {
            const y = Math.round(item.transform[5]); // Y position
            if (!rows[y]) rows[y] = [];
            rows[y].push({
                text: item.str,
                x: item.transform[4], // X position
            });
        }

        // Sort rows by Y (top to bottom = descending Y)
        const sortedYs = Object.keys(rows).map(Number).sort((a, b) => b - a);

        for (const y of sortedYs) {
            // Sort items in row by X (left to right)
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            const rowText = rowItems.map(item => item.text).join(' ');
            if (rowText.trim()) {
                allText.push(rowText);
            }
        }
    }

    // Now parse: for each line, check if it matches a chapter
    const result = {};
    const matched = new Set();

    for (const line of allText) {
        const capId = matchChapter(line);
        if (capId && !matched.has(capId)) {
            const pcts = extractPercentages(line);
            if (pcts.length > 0) {
                // Take the LAST percentage value on the line (usually the cert column is rightmost)
                result[capId] = pcts[pcts.length - 1];
                matched.add(capId);
            }
        }
    }

    return {
        valores: result,
        matchedCount: matched.size,
        totalChapters: CHAPTER_KEYWORDS.length,
        rawLines: allText, // For debugging
    };
}
