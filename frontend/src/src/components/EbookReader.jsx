import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, ShieldCheck, Moon, Sun, Lock, Volume2, Play, Pause, RotateCcw, FileText, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const EbookReader = ({ bookId, title, onClose }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [pages, setPages] = useState([]);
  const [hasPdf, setHasPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [viewMode, setViewMode] = useState('text'); // 'text' or 'pdf'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(18);

  // Word-by-Word Narration & Highlighting State
  const [isReading, setIsReading] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [words, setWords] = useState([]);
  
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const activeWordRef = useRef(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/stream/ebook/${bookId}`);
        const rawText = res.data.content || '';
        setContent(rawText);
        setHasPdf(res.data.hasPdfOnDisk || false);
        setPages(Array.isArray(res.data.pages) ? res.data.pages : []);
        setWords(rawText.split(/\s+/).filter(Boolean));
      } catch (err) {
        console.error('Error fetching ebook DRM stream:', err);
        setError(err.response?.data?.message || 'Access Denied: You must purchase or rent this eBook.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [bookId]);

  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      if (viewMode !== 'pdf' || pdfUrl || loading || error) {
        return;
      }

      try {
        setPdfLoading(true);
        const res = await API.get(`/stream/ebook/${bookId}`);
        const sourceUrl = res.data.fileUrl || res.data.pdfUrl;

        if (!sourceUrl) {
          return;
        }

        const pdfRes = await API.get(sourceUrl, { responseType: 'blob' });
        const objectUrl = URL.createObjectURL(pdfRes.data);

        if (isMounted) {
          setPdfUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        console.error('Error loading PDF preview:', err);
        if (isMounted) {
          setPdfUrl('');
        }
      } finally {
        if (isMounted) {
          setPdfLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [viewMode, hasPdf, bookId, pdfUrl, loading, error]);

  // Auto-scroll active word into view during speech narration
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeWordIndex]);

  const startWordByWordReading = () => {
    if (!content || words.length === 0) return;

    if (synthRef.current.speaking && synthRef.current.paused) {
      synthRef.current.resume();
      setIsReading(true);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.95;
    utteranceRef.current = utterance;

    let wordPosMap = [];
    let currentPos = 0;
    words.forEach((w, idx) => {
      wordPosMap.push({ index: idx, charStart: currentPos });
      currentPos += w.length + 1;
    });

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        let matchIdx = 0;
        for (let i = 0; i < wordPosMap.length; i++) {
          if (wordPosMap[i].charStart <= charIdx) {
            matchIdx = i;
          } else {
            break;
          }
        }
        setActiveWordIndex(matchIdx);
      }
    };

    utterance.onend = () => {
      setIsReading(false);
      setActiveWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsReading(false);
      setActiveWordIndex(-1);
    };

    synthRef.current.speak(utterance);
    setIsReading(true);
  };

  const pauseWordByWordReading = () => {
    if (synthRef.current.speaking) {
      synthRef.current.pause();
      setIsReading(false);
    }
  };

  const stopWordByWordReading = () => {
    synthRef.current.cancel();
    setIsReading(false);
    setActiveWordIndex(-1);
  };

  const renderPageText = (text) => {
    return (
      <div className="whitespace-pre-wrap break-words leading-8">
        {text}
      </div>
    );
  };

  const renderExactText = (text, textClassName = 'text-[#e5e7eb]') => {
    return (
      <div className={`space-y-6 ${textClassName}`}>
        {text
          .split(/\n\s*\n+/)
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index} className="whitespace-pre-wrap leading-10 text-[1.05rem] md:text-[1.15rem] tracking-wide">
              {paragraph}
            </p>
          ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in">
      
      {/* Top Reader Toolbar */}
      <div className="bg-[#fafaf9] border-b-4 border-slate-900 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-[0_4px_0_0_rgba(15,23,42,1)]">
        
        {/* Title & View Mode Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#a3e635] border-3 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              {title}
            </h3>
            
            {/* View Mode Toggle: Text vs PDF Viewer */}
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={() => setViewMode('text')}
                className={`px-2 py-0.5 border-2 border-slate-900 font-black text-[9px] uppercase shadow-[1px_1px_0_0_rgba(15,23,42,1)] flex items-center gap-1 ${
                  viewMode === 'text' ? 'bg-[#a3e635] text-slate-900' : 'bg-white text-slate-600'
                }`}
              >
                <FileText className="w-3 h-3" /> Text & Word Sync
              </button>

              <button
                onClick={() => setViewMode('pdf')}
                className={`px-2 py-0.5 border-2 border-slate-900 font-black text-[9px] uppercase shadow-[1px_1px_0_0_rgba(15,23,42,1)] flex items-center gap-1 ${
                  viewMode === 'pdf' ? 'bg-[#06b6d4] text-slate-900' : 'bg-white text-slate-600'
                }`}
              >
                <Eye className="w-3 h-3" /> Full PDF Document
              </button>
            </div>
          </div>
        </div>

        {/* Word-By-Word Speech Controls (Visible in Text Mode) */}
        {viewMode === 'text' && (
          <div className="flex items-center gap-2 bg-white border-3 border-slate-900 p-1.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
            <span className="text-[9px] font-black uppercase text-slate-700 px-2 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              Narration:
            </span>

            {!isReading ? (
              <button
                onClick={startWordByWordReading}
                className="bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black text-[10px] uppercase px-3 py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center gap-1 active:translate-y-[1px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Read Word-by-Word
              </button>
            ) : (
              <button
                onClick={pauseWordByWordReading}
                className="bg-[#facc15] hover:bg-[#e2b80d] text-slate-900 border-2 border-slate-900 font-black text-[10px] uppercase px-3 py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center gap-1 active:translate-y-[1px]"
              >
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </button>
            )}

            <button
              onClick={stopWordByWordReading}
              className="bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 font-black text-[10px] uppercase p-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
              title="Reset Narration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Reader Styling Controls & Close Button */}
        <div className="flex items-center gap-3">
          {viewMode === 'text' && (
            <div className="flex items-center gap-1 bg-white border-2 border-slate-900 p-1 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-2 py-0.5 text-xs font-black text-slate-900 hover:bg-slate-100"
              >
                A-
              </button>
              <span className="text-[10px] font-mono font-black text-slate-900 px-1">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className="px-2 py-0.5 text-xs font-black text-slate-900 hover:bg-slate-100"
              >
                A+
              </button>
            </div>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 bg-white border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] hover:bg-slate-100 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => { stopWordByWordReading(); onClose(); }}
            className="p-2 bg-[#ef4444] text-white border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] hover:bg-[#dc2626] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Body Area */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 flex justify-center transition-colors ${
        theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-[#fafaf9] text-slate-900'
      }`}>
        <div className="max-w-4xl w-full h-full flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 my-auto">
              <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase">Loading eBook text & PDF document...</p>
            </div>
          ) : error ? (
            <div className="p-8 border-4 border-slate-900 bg-[#ef4444] text-white text-center max-w-md mx-auto my-auto shadow-[6px_6px_0_0_rgba(15,23,42,1)]">
              <Lock className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-lg font-black uppercase mb-2">Access Protected</h3>
              <p className="text-xs font-bold mb-4">{error}</p>
              <button
                onClick={onClose}
                className="bg-white text-slate-900 border-2 border-slate-900 font-black text-xs uppercase px-5 py-2.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)]"
              >
                Return to Marketplace
              </button>
            </div>
          ) : viewMode === 'pdf' ? (
            /* PDF EMBEDDED DOCUMENT VIEWER */
            <div className="w-full h-full flex-1 border-4 border-slate-900 bg-[#e2e8f0] shadow-[6px_6px_0_0_rgba(15,23,42,1)] overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b-2 border-slate-900 bg-[#0f172a] text-[10px] font-black uppercase flex items-center justify-between gap-3 text-white">
                <span>PDF Preview</span>
                <span>{pdfLoading ? 'Loading protected PDF...' : pdfUrl ? 'Embedded document ready' : 'Exact text view'}</span>
              </div>
              <div className="flex-1 bg-[#cbd5e1] p-3 md:p-4">
                {pdfLoading ? (
                  <div className="h-full flex items-center justify-center bg-[#f8fafc] border-2 border-slate-900">
                    <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : pdfUrl ? (
                  <div className="h-full bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-hidden">
                    <iframe
                      src={pdfUrl}
                      title={title}
                      className="w-full h-full border-none bg-white"
                    />
                  </div>
                ) : (
                  <div className="h-full bg-white border-2 border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto">
                      <div className="text-center border-b-2 border-slate-300 pb-4 mb-8">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Exact PDF Text</div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                      </div>
                      <div className="prose prose-slate max-w-none">
                        {pages.length > 0 ? (
                          <div className="space-y-6">
                            {pages.map((page) => (
                              <section key={page.pageNumber} className="pb-6 border-b border-slate-200 last:border-b-0 last:pb-0">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                                    Page {page.pageNumber}
                                  </h3>
                                </div>
                                {renderExactText(page.text || '', 'text-slate-900')}
                              </section>
                            ))}
                          </div>
                        ) : (
                          renderExactText(content || '', 'text-slate-900')
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TEXT & WORD-BY-WORD NARRATION MODE */
            <div 
              style={{ fontSize: `${fontSize}px`, lineHeight: 2 }}
              className="font-serif tracking-wide select-none"
            >
              <div className="max-w-4xl mx-auto bg-[#111827] border-4 border-slate-900 shadow-[8px_8px_0_0_rgba(15,23,42,1)] px-6 md:px-10 py-8 md:py-12 text-white">
                <div className="text-center border-b-3 border-white/20 pb-6 mb-8">
                  <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white">{title}</h1>
                  <span className="text-[10px] font-sans font-black bg-[#facc15] text-slate-900 border-2 border-slate-900 px-3 py-1 uppercase shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] inline-block mt-2">
                    Exact Extracted Text
                  </span>
                </div>

                {pages.length > 0 ? (
                  <div className="space-y-8">
                    <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-white/20 pb-3">
                      Readable text from the PDF
                    </div>
                    {pages.map((page) => (
                      <section key={page.pageNumber} className="bg-white/5 border border-white/10 p-5 md:p-7 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                          <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[#facc15]">
                            Page {page.pageNumber}
                          </h2>
                        </div>
                        {renderExactText(page.text || '', 'text-white')}
                      </section>
                    ))}
                  </div>
                ) : content ? (
                  <div className="space-y-8">
                    <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-white/20 pb-3">
                      Readable text from the PDF
                    </div>
                    {renderExactText(content, 'text-white')}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-2 gap-y-3 leading-relaxed">
                    {words.map((word, idx) => {
                      const isActive = idx === activeWordIndex;
                      return (
                        <span
                          key={idx}
                          ref={isActive ? activeWordRef : null}
                          className={`transition-all rounded-none duration-150 inline-block ${
                            isActive
                              ? 'bg-[#facc15] text-slate-900 border-2 border-slate-900 font-black px-1.5 py-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] scale-110'
                              : 'text-slate-200'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                )}

              <div className="mt-12 pt-8 border-t-3 border-slate-900 text-center text-xs font-black text-slate-400 uppercase font-sans mb-12">
                End of Spoken Book Chapter
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EbookReader;
