const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const { PDFParse } = require('pdf-parse');

const cleanPdfPageText = (pageText, book) => {
  const titlePattern = new RegExp(`^${book.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\s+\d+)?$`, 'i');
  const noisyLines = [
    /^download free ebooks of classic literature/i,
    /^novels at planet eBook\. subscribe/i,
    /^free ebooks at planet eBook\.com/i,
    /^published by planet eBook/i,
    /^page\s*\d+$/i,
    /^--\s*\d+\s+of\s+\d+\s*--$/i,
    /^\d+\s*Free eBooks at .*$/i
  ];

  const cleanedLines = (pageText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !titlePattern.test(line))
    .filter((line) => !noisyLines.some((pattern) => pattern.test(line)));

  return cleanedLines.join('\n').trim();
};

const buildReaderPages = (text, book) => {
  const cleanedText = (text || '').trim();
  const paragraphs = cleanedText
    .split(/\n\s*\n+|\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const sourceParagraphs = paragraphs.length > 0 ? paragraphs : [cleanedText || ''];
  const pageSize = 2;
  const pages = [];

  for (let index = 0; index < sourceParagraphs.length; index += pageSize) {
    const pageParagraphs = sourceParagraphs.slice(index, index + pageSize);

    pages.push({
      pageNumber: pages.length + 1,
      heading: pages.length === 0 ? book.title : book.title,
      text: pageParagraphs.join('\n\n')
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      heading: book.title,
      text: cleanedText
    });
  }

  return pages;
};

const extractPdfText = async (book) => {
  if (!book.fileUrl) {
    return { text: '', pages: [] };
  }

  const filePath = path.join(__dirname, '..', book.fileUrl);
  if (!fs.existsSync(filePath)) {
    return { text: '', pages: [] };
  }

  const pdfBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: pdfBuffer });
  const pdfData = await parser.getText({ pageJoiner: '\n---PAGE___page_number___total_number---\n' });
  const pageParts = pdfData.text.split(/---PAGE___\d+___\d+---/g);

  const filteredPages = pageParts
    .map((pageText, index) => {
      const cleaned = cleanPdfPageText(pageText, book).trim();
      return cleaned
        ? { pageNumber: index + 1, text: cleaned }
        : null;
    })
    .filter(Boolean);

  const exactText = filteredPages.map((page) => page.text).join('\n\n');
  return { text: exactText.trim(), pages: filteredPages };
};

// @desc    Stream Audiobook MP3 track with HTTP 206 Partial Content Range support (DRM GATED)
// @route   GET /api/stream/audio/:bookId
exports.streamAudio = async (req, res) => {
  try {
    const book = req.book;
    const chapterIdx = parseInt(req.query.chapter) || 0;
    
    let filePath;
    if (book.audioUrls && book.audioUrls[chapterIdx]) {
      filePath = path.join(__dirname, '..', book.audioUrls[chapterIdx]);
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(200).json({
        message: "Streaming DRM-authenticated audio stream",
        title: book.title,
        chapter: chapterIdx + 1,
        accessType: req.accessType,
        sampleText: book.sampleEbookText
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, private'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, private'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Streaming audio error:', error);
    res.status(500).json({ message: 'Error streaming audio content' });
  }
};

// @desc    Fetch Ebook Content Text & PDF View Payload (DRM GATED)
// @route   GET /api/stream/ebook/:bookId
exports.streamEbook = async (req, res) => {
  try {
    const book = req.book;

    const fileUrl = `${req.protocol}://${req.get('host')}/api/download/pdf/${book._id}`;

    let hasPdfOnDisk = false;
    if (book.fileUrl) {
      const filePath = path.join(__dirname, '..', book.fileUrl);
      hasPdfOnDisk = fs.existsSync(filePath);
    }

    let extracted = { text: '', pages: [] };
    try {
      extracted = await extractPdfText(book);
    } catch (extractError) {
      console.warn('PDF text extraction failed, falling back to preview text:', extractError.message);
      extracted = { text: book.sampleEbookText || '', pages: [] };
    }

    if (!extracted.text) {
      extracted = { text: book.sampleEbookText || '', pages: [] };
    }

    const pages = extracted.pages.length > 0 ? extracted.pages : buildReaderPages(extracted.text, book);

    res.json({
      bookId: book._id,
      title: book.title,
      authorName: book.authorName,
      category: book.category,
      accessType: req.accessType,
      hasPdfOnDisk,
      fileUrl,
      pdfUrl: fileUrl,
      content: extracted.text,
      pages
    });
  } catch (error) {
    console.error('Streaming ebook error:', error);
    res.status(500).json({ message: 'Error serving eBook reader payload' });
  }
};
