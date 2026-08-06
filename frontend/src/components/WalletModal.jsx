import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck, X, DollarSign, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const WalletModal = ({ onClose }) => {
  const { updateWalletBalance } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('25');
  const [topupLoading, setTopupLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/wallet');
      setBalance(res.data.balance || 0);
      setTransactions(res.data.transactions || []);
      // Sync global state so Navbar updates
      updateWalletBalance(res.data.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    try {
      setTopupLoading(true);
      setMessage(null);
      const res = await API.post('/wallet/topup', { amount: topupAmount });
      setBalance(res.data.balance);
      setMessage({ type: 'success', text: res.data.message });
      // Sync global state so Navbar updates immediately
      updateWalletBalance(res.data.balance);
      fetchWalletData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Top-up failed' });
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#fafaf9] border-4 border-slate-900 p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0_0_rgba(15,23,42,1)] space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white border-2 border-slate-900 hover:bg-slate-100 shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Digital Wallet
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            Store funds for 1-click book purchases and 14-day rentals.
          </p>
        </div>

        {/* Current Balance Showcase Card */}
        <div className="bg-[#06b6d4] border-3 border-slate-900 p-6 shadow-[4px_4px_0_0_rgba(15,23,42,1)] text-slate-900 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">Available Balance</span>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black">${balance.toFixed(2)}</span>
            <span className="text-[10px] bg-white border-2 border-slate-900 px-2 py-0.5 font-mono font-black uppercase shadow-[1px_1px_0_0_rgba(15,23,42,1)]">
              ReadPulse Pay
            </span>
          </div>
        </div>

        {message && (
          <div className={`p-3 border-2 border-slate-900 text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${
            message.type === 'success' ? 'bg-[#a3e635] text-slate-900' : 'bg-[#ef4444] text-white'
          }`}>
            {message.text}
          </div>
        )}

        {/* Quick Top-Up Form */}
        <form onSubmit={handleTopup} className="bg-white border-3 border-slate-900 p-4 shadow-[3px_3px_0_0_rgba(15,23,42,1)] space-y-3">
          <span className="text-[10px] font-black uppercase text-slate-900 block">Add Funds to Wallet</span>
          
          <div className="grid grid-cols-4 gap-2">
            {['10', '25', '50', '100'].map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => setTopupAmount(amt)}
                className={`py-1.5 border-2 border-slate-900 font-black text-xs uppercase transition-all ${
                  topupAmount === amt
                    ? 'bg-[#facc15] text-slate-900 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] translate-y-[-1px]'
                    : 'bg-[#fafaf9] text-slate-700 hover:bg-slate-100'
                }`}
              >
                +${amt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="500"
                step="0.01"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full bg-[#fafaf9] border-2 border-slate-900 pl-8 pr-3 py-2 text-xs font-black text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={topupLoading}
              className="bg-[#a3e635] hover:bg-[#8fd02c] text-slate-900 border-2 border-slate-900 font-black text-xs uppercase px-5 py-2 shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-[1px] transition-all"
            >
              {topupLoading ? 'Adding...' : 'Top Up'}
            </button>
          </div>
        </form>

        {/* Transaction History Ledger */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase">Recent Wallet Ledger</h3>
          
          {loading ? (
            <div className="py-6 text-center text-slate-500 text-xs font-bold">Loading ledger...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-bold bg-white border-2 border-slate-900">
              No recent transactions. Top up funds to make 1-click purchases!
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div key={tx._id} className="bg-white border-2 border-slate-900 p-2.5 flex items-center justify-between text-xs shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 border-2 border-slate-900 flex items-center justify-center font-black ${
                      tx.amount > 0 ? 'bg-[#a3e635] text-slate-900' : 'bg-[#f97316] text-white'
                    }`}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-[11px] line-clamp-1">{tx.description}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <span className={`font-black font-mono text-xs ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WalletModal;
