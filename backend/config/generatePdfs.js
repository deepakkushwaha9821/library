const fs = require('fs');
const path = require('path');

const generateValidPDF = (title, author, category, chapterContent) => {
  const sanitize = (str) => str.replace(/[()\\]/g, '\\$&').replace(/\n/g, ' ');
  
  const contentText = `BT /F1 18 Tf 50 720 Td (${sanitize(title)}) Tj ET ` +
                      `BT /F1 12 Tf 50 695 Td (Author: ${sanitize(author)} | Category: ${sanitize(category)}) Tj ET ` +
                      `BT /F1 10 Tf 50 660 Td (READPULSE OFFICIAL DIGITAL EBOOK EDITION) Tj ET ` +
                      `BT /F1 11 Tf 50 620 Td (${sanitize(chapterContent.slice(0, 100))}) Tj ET ` +
                      `BT /F1 11 Tf 50 600 Td (${sanitize(chapterContent.slice(100, 200))}) Tj ET ` +
                      `BT /F1 11 Tf 50 580 Td (${sanitize(chapterContent.slice(200, 300))}) Tj ET ` +
                      `BT /F1 11 Tf 50 560 Td (${sanitize(chapterContent.slice(300, 400))}) Tj ET ` +
                      `BT /F1 9 Tf 50 50 Td (Protected DRM Content Streamed via ReadPulse Engine) Tj ET`;

  const streamLength = Buffer.byteLength(contentText);

  const pdfStructure = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentText}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

  return Buffer.from(pdfStructure, 'binary');
};

module.exports = generateValidPDF;
