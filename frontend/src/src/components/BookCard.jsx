import React from 'react';
import { Star, Headphones, BookOpen, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BookCard = ({ book, onSelect, isOwned, isRented }) => {
  const { user } = useAuth();

  return (
    <div 
      onClick={() => onSelect(book)}
      className="bg-[#fafaf9] border-3 border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-hidden flex flex-col cursor-pointer group hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[7px_7px_0_0_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_rgba(15,23,42,1)] transition-all"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 border-b-3 border-slate-900">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {/* Format Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="text-[9px] font-black uppercase tracking-wider bg-white border-2 border-slate-900 text-slate-900 px-2 py-0.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center gap-1">
            {book.format === 'audiobook' ? (
              <><Headphones className="w-3 h-3 text-purple-600" /> Audio</>
            ) : book.format === 'ebook' ? (
              <><BookOpen className="w-3 h-3 text-cyan-600" /> eBook</>
            ) : (
              <><Sparkles className="w-3 h-3 text-amber-500" /> Combo</>
            )}
          </span>

          {/* Format badge */}
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-white border-2 border-slate-900 px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]">
          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          <span>{book.averageRating ? book.averageRating.toFixed(1) : '4.8'}</span>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
            {book.category}
          </span>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold line-clamp-1 mt-0.5">
            By {book.authorName}
          </p>
        </div>

        {/* Ownership Status vs Pricing Options */}
        <div className="mt-3.5 pt-2.5 border-t-2 border-slate-900/60 flex items-center justify-between">
          {isOwned ? (
            <div className="w-full bg-[#a3e635] border-2 border-slate-900 py-1 px-2 text-center shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-slate-900" />
              <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">PURCHASED</span>
            </div>
          ) : isRented ? (
            <div className="w-full bg-[#facc15] border-2 border-slate-900 py-1 px-2 text-center shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-900" />
              <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">RENTED (14d)</span>
            </div>
          ) : (
            <>
              <div>
                <span className="text-[8px] text-slate-400 uppercase font-extrabold block">Buy Copy</span>
                <span className="text-xs font-black text-slate-900">${book.price ? book.price.toFixed(2) : '9.99'}</span>
              </div>

              <div className="text-right">
                <span className="text-[8px] text-indigo-500 uppercase font-extrabold block">Rent 14d</span>
                <span className="text-xs font-black text-indigo-600">${book.rentPrice ? book.rentPrice.toFixed(2) : '2.49'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
