import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Users, BookOpen, DollarSign, Sparkles } from 'lucide-react';
import API from '../services/api';

const AdminPanel = () => {
  const [metrics, setMetrics] = useState(null);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const metricsRes = await API.get('/admin/metrics');
      const booksRes = await API.get('/admin/pending-books');
      setMetrics(metricsRes.data);
      setPendingBooks(booksRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (bookId, status) => {
    try {
      await API.put(`/admin/moderate-book/${bookId}`, { status });
      alert(`Book status updated to ${status}!`);
      fetchAdminData();
    } catch (error) {
      alert('Failed to moderate book');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in">
      
      {/* Banner */}
      <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Admin Panel
            <span className="text-[10px] bg-[#ef4444] text-white border-2 border-slate-900 px-2.5 py-0.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] font-mono uppercase">
              System Control
            </span>
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Moderate book uploads and monitor active platforms statistics.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
              <span>Gross Volume Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">${metrics.grossRevenue.toFixed(2)}</p>
            <span className="text-[9px] text-slate-400 block mt-1">All purchases & rentals</span>
          </div>

          <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
              <span>Active Unlimited Subs</span>
              <Sparkles className="w-4 h-4 text-[#a855f7]" />
            </div>
            <p className="text-2xl font-black text-[#a855f7]">{metrics.activeSubscribersCount}</p>
            <span className="text-[9px] text-slate-400 block mt-1">Stripe billing subscriptions</span>
          </div>

          <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
              <span>Platform Users</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{metrics.totalUsers}</p>
            <span className="text-[9px] text-slate-400 block mt-1">{metrics.totalSellers} active sellers</span>
          </div>

          <div className="bg-[#fafaf9] border-3 border-slate-900 p-5 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between text-slate-500 font-bold mb-2 uppercase text-[9px]">
              <span>Pending Approvals</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{metrics.pendingBooksCount}</p>
            <span className="text-[9px] text-slate-400 block mt-1">Awaiting moderation review</span>
          </div>
        </div>
      )}

      {/* Moderation Queue */}
      <div className="bg-[#fafaf9] border-3 border-slate-900 p-6 shadow-[6px_6px_0_0_rgba(15,23,42,1)] space-y-4">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Approval Submissions</h3>
        
        {pendingBooks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-bold">
            No pending submissions in moderation queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold text-slate-700">
              <thead className="bg-[#fafaf9] text-slate-900 uppercase text-[9px] font-black border-b-3 border-slate-900">
                <tr>
                  <th className="p-3">Book details</th>
                  <th className="p-3">Seller Name</th>
                  <th className="p-3">Buy / Rent Price</th>
                  <th className="p-3">Moderate action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200">
                {pendingBooks.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-100/50">
                    <td className="p-3 font-black text-slate-900 flex items-center gap-3">
                      <img src={b.coverUrl} alt={b.title} className="w-8 h-10 object-cover border border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)]" />
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase">{b.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{b.description}</p>
                      </div>
                    </td>
                    <td className="p-3 text-slate-900">{b.seller?.name || 'Seller'}</td>
                    <td className="p-3 font-mono text-slate-900">${b.price.toFixed(2)} / ${b.rentPrice.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModerate(b._id, 'approved')}
                          className="bg-[#22c55e] hover:bg-[#1fa951] text-white border-2 border-slate-900 font-black text-[9px] uppercase px-3 py-1 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] active:translate-y-[0.5px]"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => handleModerate(b._id, 'rejected')}
                          className="bg-[#ef4444] hover:bg-[#d93838] text-white border-2 border-slate-900 font-black text-[9px] uppercase px-3 py-1 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] active:translate-y-[0.5px]"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminPanel;
