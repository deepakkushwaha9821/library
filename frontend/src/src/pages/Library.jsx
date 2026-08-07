import React, { useState, useEffect } from 'react';
import { BookOpen, Headphones, Clock, Sparkles, ShieldCheck, Play, Download, Book } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import API from '../services/api';

const Library = ({ onOpenReader }) => {
  const { user } = useAuth();
  const { playBookAudio } = usePlayer();

  const [activeTab, setActiveTab] = useState('owned'); // 'owned', 'rented', 'subscription'
  const [libraryData, setLibraryData] = useState({
    ownedBooks: [],
    rentedBooks: [],
    subscriptionCatalogBooks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const res = await API.get('/orders/my-library');
      setLibraryData(res.data);
    } catch (error) {
      console.error('Error fetching user library:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingDays = (expiryDate) => {
    if (!expiryDate) return 'Expired';
    const now = new Date();
    const exp = new Date(expiryDate);
    const diffMs = exp - now;
    if (diffMs <= 0) return 'Expired';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  const handleStartAudio = (book) => {
    playBookAudio({
      bookId: book._id,
      title: book.title,
      authorName: book.authorName,
      coverUrl: book.coverUrl,
      sampleEbookText: book.sampleEbookText
    });
  };

  const handleDownloadPDF = (book) => {
    const downloadUrl = `http://localhost:5000/api/download/pdf/${book._id}`;
    const token = user?.token;
    
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error('Download permission denied');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            My Library
            <span className="text-[10px] bg-[#a3e635] text-slate-900 border-2 border-slate-900 px-2.5 py-0.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] font-mono uppercase">
              Direct PDF Download Included
            </span>
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Read in-app canvas, stream raw audio tracks, or download offline PDF copies.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-white border-3 border-slate-900 p-1 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-4 py-2 border-2 border-transparent font-black text-[10px] uppercase transition-all ${
              activeTab === 'owned'
                ? 'bg-[#a3e635] text-slate-900 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] translate-y-[-0.5px]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Owned Copies ({libraryData.ownedBooks.length})
          </button>

          <button
            onClick={() => setActiveTab('rented')}
            className={`px-4 py-2 border-2 border-transparent font-black text-[10px] uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'rented'
                ? 'bg-[#facc15] text-slate-900 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] translate-y-[-0.5px]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Rentals ({libraryData.rentedBooks.length})
          </button>
        </div>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div>
          
          {/* TAB 1: OWNED PERMANENT */}
          {activeTab === 'owned' && (
            libraryData.ownedBooks.length === 0 ? (
              <div className="bg-[#fafaf9] border-3 border-slate-900 p-12 text-center max-w-sm mx-auto shadow-[4px_4px_0_0_rgba(15,23,42,1)] space-y-4">
                <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-black uppercase text-slate-900">No Purchased Books</h3>
                <p className="text-[11px] text-slate-500">Your purchased books will appear here with direct download links.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryData.ownedBooks.map(({ purchaseId, book }) => (
                  <div key={purchaseId} className="bg-[#fafaf9] border-3 border-slate-900 p-4 flex gap-4 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-24 h-36 object-cover border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] shrink-0"
                    />
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">Lifetime Copy</span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{book.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold line-clamp-1">By {book.authorName}</p>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex gap-1.5">
                          {book.format !== 'audiobook' && (
                            <button
                              onClick={() => onOpenReader(book._id, book.title)}
                              className="flex-1 bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
                            >
                              Read
                            </button>
                          )}

                          {book.format !== 'ebook' && (
                            <button
                              onClick={() => handleStartAudio(book)}
                              className="flex-1 bg-[#a855f7] hover:bg-[#933ce6] text-white border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
                            >
                              Stream
                            </button>
                          )}
                        </div>

                        {/* DIRECT DOWNLOAD LINK BUTTON */}
                        <button
                          onClick={() => handleDownloadPDF(book)}
                          className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 2: RENTED */}
          {activeTab === 'rented' && (
            libraryData.rentedBooks.length === 0 ? (
              <div className="bg-[#fafaf9] border-3 border-slate-900 p-12 text-center max-w-sm mx-auto shadow-[4px_4px_0_0_rgba(15,23,42,1)] space-y-4">
                <Clock className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-black uppercase text-slate-900">No active rentals</h3>
                <p className="text-[11px] text-slate-500">Rentals appear here for 14 days after checking out.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryData.rentedBooks.map(({ purchaseId, book, rentExpiresAt, isExpired }) => (
                  <div key={purchaseId} className="bg-[#fafaf9] border-3 border-slate-900 p-4 flex gap-4 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-24 h-36 object-cover border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] shrink-0"
                    />
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 border-2 border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] mb-1.5 ${
                          isExpired 
                            ? 'bg-[#ef4444] text-white' 
                            : 'bg-[#facc15] text-slate-900'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          {isExpired ? 'Expired' : calculateRemainingDays(rentExpiresAt)}
                        </div>

                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{book.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold line-clamp-1">By {book.authorName}</p>
                      </div>

                      {isExpired ? (
                        <p className="text-[9px] text-[#ef4444] font-black uppercase tracking-wider pt-2">Rental Expired</p>
                      ) : (
                        <div className="space-y-1.5 pt-2">
                          <div className="flex gap-1.5">
                            {book.format !== 'audiobook' && (
                              <button
                                onClick={() => onOpenReader(book._id, book.title)}
                                className="flex-1 bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
                              >
                                Read
                              </button>
                            )}

                            {book.format !== 'ebook' && (
                              <button
                                onClick={() => handleStartAudio(book)}
                                className="flex-1 bg-[#a855f7] hover:bg-[#933ce6] text-white border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
                              >
                                Stream
                              </button>
                            )}
                          </div>

                          {/* DIRECT DOWNLOAD LINK BUTTON */}
                          <button
                            onClick={() => handleDownloadPDF(book)}
                            className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Download PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            !libraryData.subscriptionInfo.isSubscribed ? (
              <div className="bg-[#fafaf9] border-3 border-slate-900 p-12 text-center max-w-sm mx-auto shadow-[4px_4px_0_0_rgba(15,23,42,1)] space-y-4">
                <Sparkles className="w-10 h-10 text-[#a855f7] mx-auto" />
                <h3 className="text-sm font-black uppercase text-slate-900">Activate Unlimited Sub</h3>
                <p className="text-[11px] text-slate-500">Subscribe for unlimited reading & direct download access.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryData.subscriptionCatalogBooks.map((book) => (
                  <div key={book._id} className="bg-[#fafaf9] border-3 border-slate-900 p-4 flex gap-4 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-24 h-36 object-cover border-2 border-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] shrink-0"
                    />
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[9px] font-black text-purple-600 uppercase block flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Unlimited
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{book.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold line-clamp-1">By {book.authorName}</p>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex gap-1.5">
                          {book.format !== 'audiobook' && (
                            <button
                              onClick={() => onOpenReader(book._id, book.title)}
                              className="flex-1 bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
                            >
                              Read
                            </button>
                          )}

                          {book.format !== 'ebook' && (
                            <button
                              onClick={() => handleStartAudio(book)}
                              className="flex-1 bg-[#a855f7] hover:bg-[#933ce6] text-white border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]"
                            >
                              Stream
                            </button>
                          )}
                        </div>

                        {/* DIRECT DOWNLOAD LINK BUTTON */}
                        <button
                          onClick={() => handleDownloadPDF(book)}
                          className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-2 border-slate-900 font-black text-[9px] uppercase py-1.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      )}
    </div>
  );
};

export default Library;
