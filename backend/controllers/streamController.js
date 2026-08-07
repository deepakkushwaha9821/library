const fs = require("fs");
const path = require("path");
const Book = require("../models/Book");
const pdf = require("pdf-parse");

// Clean unwanted PDF lines
const cleanPdfPageText = (pageText, book) => {
  const titlePattern = new RegExp(
    `^${book.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s+\\d+)?$`,
    "i"
  );

  const noisyLines = [
    /^download free ebooks of classic literature/i,
    /^novels at planet eBook/i,
    /^free ebooks at planet eBook/i,
    /^published by planet eBook/i,
    /^page\s*\d+$/i,
    /^--\s*\d+\s+of\s+\d+\s*--$/i,
    /^\d+\s*Free eBooks/i,
  ];

  const cleanedLines = (pageText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !titlePattern.test(line))
    .filter((line) => !noisyLines.some((pattern) => pattern.test(line)));

  return cleanedLines.join("\n").trim();
};

// Split PDF text into reader pages
const buildReaderPages = (text, book) => {
  const cleanedText = (text || "").trim();

  const paragraphs = cleanedText
    .split(/\n\s*\n+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pageSize = 2;
  const pages = [];

  for (let i = 0; i < paragraphs.length; i += pageSize) {
    pages.push({
      pageNumber: pages.length + 1,
      heading: book.title,
      text: paragraphs.slice(i, i + pageSize).join("\n\n"),
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      heading: book.title,
      text: cleanedText,
    });
  }

  return pages;
};

// Extract text from PDF
const extractPdfText = async (book) => {
  if (!book.fileUrl) {
    return { text: "", pages: [] };
  }

  const filePath = path.join(__dirname, "..", book.fileUrl);

  if (!fs.existsSync(filePath)) {
    return { text: "", pages: [] };
  }

  const buffer = fs.readFileSync(filePath);

  const data = await pdf(buffer);

  const cleaned = cleanPdfPageText(data.text || "", book);

  return {
    text: cleaned,
    pages: buildReaderPages(cleaned, book),
  };
};

// Stream Audio
exports.streamAudio = async (req, res) => {
  try {
    const book = req.book;
    const chapterIdx = parseInt(req.query.chapter) || 0;

    let filePath;

    if (book.audioUrls && book.audioUrls[chapterIdx]) {
      filePath = path.join(__dirname, "..", book.audioUrls[chapterIdx]);
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(200).json({
        message: "Streaming DRM-authenticated audio stream",
        title: book.title,
        chapter: chapterIdx + 1,
        accessType: req.accessType,
        sampleText: book.sampleEbookText,
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");

      const start = parseInt(parts[0], 10);

      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize - 1;

      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "audio/mpeg",
      });

      fs.createReadStream(filePath, {
        start,
        end,
      }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error streaming audio",
    });
  }
};

// Stream Ebook
exports.streamEbook = async (req, res) => {
  try {
    const book = req.book;

    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/download/pdf/${book.id}`;

    let hasPdfOnDisk = false;

    if (book.fileUrl) {
      hasPdfOnDisk = fs.existsSync(
        path.join(__dirname, "..", book.fileUrl)
      );
    }

    let extracted;

    try {
      extracted = await extractPdfText(book);
    } catch (err) {
      console.warn(err.message);

      extracted = {
        text: book.sampleEbookText || "",
        pages: [],
      };
    }

    if (!extracted.text) {
      extracted = {
        text: book.sampleEbookText || "",
        pages: [],
      };
    }

    res.json({
      bookId: book.id,
      title: book.title,
      authorName: book.authorName,
      category: book.category,
      accessType: req.accessType,
      hasPdfOnDisk,
      fileUrl,
      pdfUrl: fileUrl,
      content: extracted.text,
      pages:
        extracted.pages.length > 0
          ? extracted.pages
          : buildReaderPages(extracted.text, book),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Error serving ebook",
    });
  }
};