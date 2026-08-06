import React, { useState, useEffect } from 'react';
import { Upload, DollarSign, BookOpen, Headphones, TrendingUp, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import API from '../services/api';

const SellerDashboard = () => {
  const [books, setBooks] = useState([]);
  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    totalSalesCount: 0,
    totalRentCount: 0,
    totalSalesRevenue: 0,
    totalRentalRevenue: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Upload Form State
  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    format: 'both',
    price: '9.99',
    rentPrice: '2.49',
    isIncludedInSubscription: true,
    category: 'Technology',
    description: '',
    sampleEbookText: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [ebookFile, setEbookFile] = useState(null);
  const [sampleAudioFile, setSampleAudioFile] = useState(null);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/books/seller/my-books');
      setBooks(res.data.books || []);
      setMetrics(res.data.metrics || {});
    } catch (error) {
      console.error('Error fetching seller dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploadLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (coverFile) data.append('cover', coverFile);
      if (ebookFile) data.append('ebookFile', ebookFile);
      if (sampleAudioFile) data.append('sampleAudio', sampleAudioFile);

      await API.post('/books', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Book published successfully! Submitted to moderation queue.');
      setShowUploadModal(false);
      fetchSellerData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload book');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Seller Studio
            <span className="text-[10px] bg-[#22c55e] text-white border-2 border-slate-900 px-2.5 py-0.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] font-mono uppercase">
              Creator Space
            </span>
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Publish books, set pricing formats, and monitor live sales data metrics.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-3 border-slate-900 font-black uppercase text-xs px-5 py-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_0_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_rgba(15,23,42,1)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Publish New Book
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
            <span>Net Creator Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">${metrics.totalEarnings ? metrics.totalEarnings.toFixed(2) : '0.00'}</p>
          <span className="text-[9px] font-black text-emerald-600 uppercase border-2 border-emerald-600 px-1.5 py-0.5 inline-block mt-1">85% Revenue Share</span>
        </div>

        <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
            <span>Units Sold Outright</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.totalSalesCount || 0}</p>
          <span className="text-[9px] text-slate-400 block mt-1">Total lifetime purchases</span>
        </div>

        <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
            <span>Rentals Handled</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.totalRentCount || 0}</p>
          <span className="text-[9px] text-slate-400 block mt-1">Active and expired rents</span>
        </div>

        <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
            <span>Active Catalog Titles</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.totalBooks || 0}</p>
          <span className="text-[9px] text-slate-400 block mt-1">In store & pending approval</span>
        </div>

      </div>

      {/* Book List Card */}
      <div className="bg-[#fafaf9] border-3 border-slate-900 p-6 shadow-[6px_6px_0_0_rgba(15,23,42,1)]">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">Your Store Listings</h3>
        
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-bold">Fetching seller stats...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-bold">
            No published titles. Click 'Publish New Book' above to upload!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold text-slate-700">
              <thead className="bg-[#fafaf9] text-slate-900 uppercase text-[9px] font-black border-b-3 border-slate-900">
                <tr>
                  <th className="p-3">Book Details</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Buy / Rent Price</th>
                  <th className="p-3">Volume Stats</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200">
                {books.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-100/50">
                    <td className="p-3 font-black text-slate-900 flex items-center gap-2">
                      <img src={b.coverUrl} alt={b.title} className="w-8 h-10 object-cover border border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)]" />
                      {b.title}
                    </td>
                    <td className="p-3 capitalize font-mono text-indigo-600">{b.format}</td>
                    <td className="p-3 font-mono text-slate-900">${b.price.toFixed(2)} / ${b.rentPrice.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-500">{b.salesCount} purchases / {b.rentCount} rentals</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 border-2 border-slate-900 text-[9px] font-black uppercase shadow-[1px_1px_0_0_rgba(15,23,42,1)] ${
                        b.status === 'approved' ? 'bg-[#22c55e] text-white' :
                        b.status === 'pending' ? 'bg-[#facc15] text-slate-900' :
                        'bg-[#ef4444] text-white'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fafaf9] border-4 border-slate-900 p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_0_rgba(15,23,42,1)] space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase">Publish New Book</h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block text-slate-900 uppercase mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 uppercase mb-1">Buy Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 uppercase mb-1">Rent Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.rentPrice}
                    onChange={(e) => setFormData({ ...formData, rentPrice: e.target.value })}
                    className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-900 uppercase mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-slate-900"
                >
                  <option value="Technology">Technology</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Business">Business</option>
                  <option value="Self-Help">Self-Help</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-900 uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-900 uppercase mb-1">Cover Image URL / Mock Link</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border-2 border-transparent font-black text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black uppercase px-5 py-2 shadow-[2px_2px_0_0_rgba(15,23,42,1)]"
                >
                  {uploadLoading ? 'Uploading...' : 'Publish Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
