const path = require('path');
const fs = require('fs');

// @desc    Download Book PDF File (Protected by DRM verifyContentAccess middleware)
// @route   GET /api/download/pdf/:bookId
exports.downloadBookPDF = async (req, res) => {
  try {
    const book = req.book; // Set by verifyContentAccess middleware

    if (book.fileUrl) {
      const filePath = path.join(__dirname, '..', book.fileUrl);
      if (fs.existsSync(filePath)) {
        const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Fallback: Generate clean text file / PDF download payload for demo books
    const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_Digital_Copy.txt`;
    const demoContent = `====================================================\nREADPULSE OFFICIAL DIGITAL COPY\nTitle: ${book.title}\nAuthor: ${book.authorName}\nLicense Type: ${req.accessType.toUpperCase()}\nIssued To: User ID ${req.user._id}\nDate: ${new Date().toISOString()}\n====================================================\n\n${book.sampleEbookText || "Thank you for buying/renting this book. Full digital content is protected under ReadPulse DRM-lite terms."}\n\n====================================================\nEnd of Document.\n`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(demoContent);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ message: 'Error generating download file' });
  }
};
