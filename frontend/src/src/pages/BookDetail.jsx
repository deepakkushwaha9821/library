import React, { useState, useEffect } from 'react';
import { Star, Headphones, BookOpen, Clock, ShieldCheck, Sparkles, Check, ArrowLeft, Play, Download, Wallet, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import API from '../services/api';

const BookDetail = ({ bookId, onBack, onOpenReader, onOpenWallet }) => {
  const { user, updateWalletBalance } = useAuth();
  const { playBookAudio } = usePlayer();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [userOwnership, setUserOwnership] = useState({ isOwned: false, isRented: false });

  useEffect(() => {
    fetchBookDetails();
    checkOwnership();
  }, [bookId]);

  const fetchBookDetails = async () => {
  try {
    console.log("Book ID =", bookId);

    const url = `/books/${bookId}`;
    console.log("Calling =", url);

    const res = await API.get(url);

    console.log("Response =", res.data);

    setBook(res.data.book);
    setReviews(res.data.reviews || []);
  } catch (err) {
    console.error(err);
  }
};

  const checkOwnership = async () => {
    if (!user) return;
    try {
      const res = await API.get('/orders/my-library');
      const owned = res.data.ownedBooks?.some(b => (b.book.id === bookId || b.book._id === bookId));
      const rented = res.data.rentedBooks?.some(b => (b.book.id === bookId || b.book._id === bookId) && !b.isExpired);
      setUserOwnership({ isOwned: owned, isRented: rented });
    } catch (e) {
      console.error('Error checking ownership:', e);
    }
  };

  const handleStripeCheckout = async (purchaseType) => {
    if (!user) {
      alert('Please sign in to buy or rent books.');
      return;
    }
    try {
      setCheckoutLoading(true);
      const res = await API.post('/orders/checkout', { bookId: book.id, purchaseType });
      setPurchaseSuccess(res.data.message);
      checkOwnership();
    } catch (error) {
      alert(error.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleWalletCheckout = async (purchaseType) => {
    if (!user) {
      alert('Please sign in to buy or rent books.');
      return;
    }
    try {
      setCheckoutLoading(true);
      const res = await API.post('/wallet/pay', { bookId: book.id, purchaseType });
      setPurchaseSuccess(res.data.message);
      updateWalletBalance(res.data.newBalance);
      checkOwnership();
    } catch (error) {
      if (error.response?.data?.needsTopup) {
        if (confirm(`${error.response.data.message}\nWould you like to top up your wallet now?`)) {
          onOpenWallet();
        }
      } else {
        alert(error.response?.data?.message || 'Wallet payment failed');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/download/pdf/${book.id}`;
    const token = user?.token;
    
    // Trigger download with auth header link
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

  const handlePlaySample = () => {
    if (!book) return;
    playBookAudio({
      bookId: book.id,
      title: `${book.title}`,
      authorName: book.authorName,
      coverUrl: book.coverUrl,
      sampleEbookText: book.sampleEbookText
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!book) return null;

  const isAccessUnlocked = userOwnership.isOwned || userOwnership.isRented || (user?.subscriptionStatus === 'active' && book.isIncludedInSubscription);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-black uppercase bg-white border-3 border-slate-900 shadow-[3px_3px_0_0_rgba(15,23,42,1)] px-4 py-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,1)] transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </button>

      {/* Main Details Panel */}
      <div className="bg-[#fafaf9] border-4 border-slate-900 p-6 md:p-10 shadow-[8px_8px_0_0_rgba(15,23,42,1)] grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Cover */}
        <div className="md:col-span-4 space-y-4">
          <div className="aspect-[3/4] rounded-none overflow-hidden shadow-[4px_4px_0_0_rgba(15,23,42,1)] border-3 border-slate-900 relative group">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            {book.format !== 'ebook' && (
              <button
                onClick={handlePlaySample}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 bg-[#a3e635] border-3 border-slate-900 text-slate-900 flex items-center justify-center shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:scale-105 transition-all">
                  <Play className="w-6 h-6 fill-current ml-1" />
                </div>
              </button>
            )}
          </div>

          <button
            onClick={handlePlaySample}
            className="w-full py-2.5 bg-white hover:bg-slate-50 border-3 border-slate-900 text-xs font-black uppercase text-slate-900 flex items-center justify-center gap-2 shadow-[3px_3px_0_0_rgba(15,23,42,1)] active:translate-x-[2px] transition-all"
          >
            <Headphones className="w-4 h-4 text-purple-600" />
            Listen Free Audio Sample
          </button>
        </div>

        {/* Right Column: Info & Actions */}
        <div className="md:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase bg-[#06b6d4] text-slate-900 border-2 border-slate-900 px-3 py-0.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]">
                {book.category}
              </span>

            </div>

            <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
              {book.title}
            </h1>

            <p className="text-xs font-bold text-slate-500">
              Written by <span className="text-slate-900 font-extrabold">{book.authorName}</span>
            </p>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 pt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-slate-900" />
                <span className="font-black text-slate-900">{book.averageRating ? book.averageRating.toFixed(1) : '4.9'}</span>
                <span className="text-slate-400">({book.reviewsCount || 12} reviews)</span>
              </div>
              <span>•</span>
              <span className="text-emerald-600 font-mono">
                {book.salesCount} direct owners
              </span>
            </div>

            <p className="text-xs md:text-sm text-slate-700 font-bold leading-relaxed pt-2">
              {book.description}
            </p>
          </div>

          {/* Action Box */}
          <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)] space-y-4">
            
            {purchaseSuccess && (
              <div className="p-3 border-2 border-slate-900 bg-[#a3e635] text-slate-900 text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-900" />
                {purchaseSuccess}
              </div>
            )}

            {/* IF ALREADY OWNED / RENTED / SUBSCRIBED -> SHOW UNLOCKED READ, STREAM & DOWNLOAD PDF BUTTONS */}
            {isAccessUnlocked ? (
              <div className="space-y-3">
                <div className="p-3 border-2 border-slate-900 bg-[#a3e635] text-slate-900 text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-slate-900" />
                    Access Unlocked ({userOwnership.isOwned ? 'Lifetime Copy' : userOwnership.isRented ? '14-Day Rental' : 'Unlimited Subscription'})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {book.format !== 'audiobook' && (
                    <button
                      onClick={() => onOpenReader(book.id, book.title)}
                      className="bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black uppercase text-xs py-2.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-4 h-4" /> In-App Reader
                    </button>
                  )}

                  {/* DIRECT DOWNLOAD PDF BUTTON LINK */}
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-2 border-slate-900 font-black uppercase text-xs py-2.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>

                  {book.format !== 'ebook' && (
                    <button
                      onClick={() => playBookAudio({
                        bookId: book.id,
                        title: book.title,
                        authorName: book.authorName,
                        coverUrl: book.coverUrl,
                        sampleEbookText: book.sampleEbookText
                      })}
                      className="bg-[#a855f7] hover:bg-[#933ce6] text-white border-2 border-slate-900 font-black uppercase text-xs py-2.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-4 h-4 fill-current" /> Stream Audio
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* OTHERWISE SHOW STRIPE CHECKOUT AND WALLET PAYMENT OPTIONS */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option 1: Buy Lifetime */}
                <div className="bg-[#fafaf9] border-2 border-slate-900 p-4 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-500 block">Buy Permanent Copy</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-900">${book.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleStripeCheckout('buy')}
                      disabled={checkoutLoading}
                      className="w-full bg-[#facc15] hover:bg-[#e2b80d] text-slate-900 border-2 border-slate-900 font-black uppercase text-[10px] py-2 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Buy via Stripe
                    </button>

                    <button
                      onClick={() => handleWalletCheckout('buy')}
                      disabled={checkoutLoading}
                      className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-2 border-slate-900 font-black uppercase text-[10px] py-2 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-1"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Pay with Wallet
                    </button>
                  </div>
                </div>

                {/* Option 2: 14-Day Rent */}
                <div className="bg-[#fafaf9] border-2 border-slate-900 p-4 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-600 block">14-Day Rental</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-indigo-600">${book.rentPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleStripeCheckout('rent')}
                      disabled={checkoutLoading}
                      className="w-full bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 font-black uppercase text-[10px] py-2 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Rent via Stripe
                    </button>

                    <button
                      onClick={() => handleWalletCheckout('rent')}
                      disabled={checkoutLoading}
                      className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-2 border-slate-900 font-black uppercase text-[10px] py-2 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-1"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Rent with Wallet
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t-2 border-slate-200 pt-3">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                DRM Content Stream + Download PDF
              </span>

              {user && (
                <button
                  onClick={onOpenWallet}
                  className="text-indigo-600 hover:underline font-black uppercase flex items-center gap-1"
                >
                  <Wallet className="w-3.5 h-3.5" /> Wallet: ${user.walletBalance ? user.walletBalance.toFixed(2) : '0.00'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
