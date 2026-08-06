import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, BookOpen, Headphones, ArrowUpDown } from 'lucide-react';
import BookCard from '../components/BookCard';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const Marketplace = ({ onSelectBook }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [format, setFormat] = useState('All');
  const [subscriptionOnly, setSubscriptionOnly] = useState(false);
  const [sort, setSort] = useState('newest');

  // User library ownership state
  const [userOwnedBookIds, setUserOwnedBookIds] = useState([]);
  const [userRentedBookIds, setUserRentedBookIds] = useState([]);

  // ALL 7 CATEGORIES ENUM
  const categories = ['All', 'Technology', 'Fiction', 'Sci-Fi', 'Business', 'Self-Help', 'Fantasy', 'History'];

  useEffect(() => {
    fetchBooks();
  }, [category, format, subscriptionOnly, sort]);

  useEffect(() => {
    if (user) {
      fetchUserLibrary();
    } else {
      setUserOwnedBookIds([]);
      setUserRentedBookIds([]);
    }
  }, [user]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        category,
        format,
        search,
        subscriptionOnly: subscriptionOnly ? 'true' : 'false',
        sort
      };
      const res = await API.get('/books', { params });
      setBooks(res.data);
    } catch (error) {
      console.error('Error fetching marketplace books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLibrary = async () => {
    try {
      const res = await API.get('/orders/my-library');
      const owned = (res.data.ownedBooks || []).map(b => b.book._id);
      const rented = (res.data.rentedBooks || []).filter(b => !b.isExpired).map(b => b.book._id);
      setUserOwnedBookIds(owned);
      setUserRentedBookIds(rented);
    } catch (error) {
      console.error('Error fetching library ownership:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Neobrutalism Hero Banner */}
      <div className="bg-[#06b6d4] border-4 border-slate-900 p-8 md:p-10 shadow-[6px_6px_0_0_rgba(15,23,42,1)] relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-[#a3e635] border-4 border-slate-900 rotate-12 shadow-[4px_4px_0_0_rgba(15,23,42,1)] hidden md:block" />
        
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-slate-900 bg-white font-extrabold text-[10px] uppercase shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]">
            <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
            7 Category Digital Library & PDF Downloads
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase leading-none tracking-tight">
            Read, Stream <br />
            & Save PDF Copies.
          </h1>

          <p className="text-xs md:text-sm font-bold text-slate-900/90 leading-relaxed max-w-xl">
            Explore books across Technology, Sci-Fi, Business, Self-Help, Fiction, Fantasy, and History. Stream raw audio or download digital PDF copies directly!
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-900 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog across 7 categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border-3 border-slate-900 pl-12 pr-4 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-500 shadow-[2px_2px_0_0_rgba(15,23,42,1)] focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_0_rgba(15,23,42,1)] transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#facc15] hover:bg-[#e2b80d] text-slate-900 text-xs font-black uppercase tracking-wider px-6 py-2.5 border-3 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] transition-all shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filter and Option Panel */}
      <div className="bg-[#fafaf9] border-3 border-slate-900 p-4 shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Category toggles for ALL 7 CATEGORIES */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 border-2 border-slate-900 text-[10px] font-black uppercase transition-all ${
                category === cat
                  ? 'bg-[#a3e635] text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] translate-y-[-1px]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[0.5px_0.5px_0_0_rgba(15,23,42,1)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="bg-white border-2 border-slate-900 px-2 py-1.5 text-[10px] font-black uppercase text-slate-900 focus:outline-none"
          >
            <option value="All">All Formats</option>
            <option value="ebook">eBooks</option>
            <option value="audiobook">Audiobooks</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border-2 border-slate-900 px-2 py-1.5 text-[10px] font-black uppercase text-slate-900 focus:outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-low">Price: Low-High</option>
            <option value="price-high">Price: High-Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Book Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border-3 border-slate-900 p-4 h-72 shadow-[4px_4px_0_0_rgba(15,23,42,1)] animate-pulse flex flex-col justify-between">
              <div className="bg-slate-200 h-40 border-2 border-slate-900" />
              <div className="space-y-2 mt-4">
                <div className="bg-slate-200 h-3 w-3/4" />
                <div className="bg-slate-200 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="bg-[#fafaf9] border-3 border-slate-900 p-12 text-center max-w-sm mx-auto shadow-[4px_4px_0_0_rgba(15,23,42,1)] space-y-4">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-black text-slate-900 uppercase">No Matches Found</h3>
          <p className="text-[11px] text-slate-500">Change your category filter or try another search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onSelect={onSelectBook}
              isOwned={userOwnedBookIds.includes(book._id)}
              isRented={userRentedBookIds.includes(book._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
