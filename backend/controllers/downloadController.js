const path = require('path');
const fs = require('fs');

// @desc    Download Book PDF File (Protected by DRM verifyContentAccess middleware)
// @route   GET /api/download/pdf/:bookId
exports.downloadBookPDF = async (req, res) => {
  try {
    const book = req.book; // Set by verifyContentAccess middleware

   if (book.fileUrl) {

  const filePath = path.join(__dirname, '..', book.fileUrl);

  console.log("========== PDF DEBUG ==========");
  console.log("Book Title:", book.title);
  console.log("Book File URL:", book.fileUrl);
  console.log("Resolved Path:", filePath);
  console.log("File Exists:", fs.existsSync(filePath));

  if (fs.existsSync(filePath)) {

    const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    return fs.createReadStream(filePath).pipe(res);
  }

  console.log("❌ PDF NOT FOUND");
}
