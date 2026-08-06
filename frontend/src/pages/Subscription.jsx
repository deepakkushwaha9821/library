import React, { useState } from 'react';
import { Sparkles, Check, ShieldCheck, CreditCard, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Subscription = () => {
  const { user, updateSubscriptionStatus, updateWalletBalance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribeStripe = async () => {
    if (!user) {
      alert('Please sign in to subscribe!');
      return;
    }
    try {
      setLoading(true);
      const res = await API.post('/orders/checkout', {
        purchaseType: 'subscription',
        plan: 'monthly_pass'
      });
      setSuccess(true);
      updateSubscriptionStatus('active', 'monthly_pass');
    } catch (error) {
      alert(error.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeWallet = async () => {
    if (!user) {
      alert('Please sign in to subscribe!');
      return;
    }
    const subPrice = 9.99;
    if ((user.walletBalance || 0) < subPrice) {
      alert(`Insufficient wallet balance. You have $${(user.walletBalance || 0).toFixed(2)}, need $${subPrice.toFixed(2)}.`);
      return;
    }

    try {
      setLoading(true);
      // Process wallet subscription
      const res = await API.post('/orders/checkout', {
        purchaseType: 'subscription',
        plan: 'monthly_pass'
      });
      setSuccess(true);
      updateSubscriptionStatus('active', 'monthly_pass');
    } catch (error) {
      alert(error.response?.data?.message || 'Wallet subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 pb-16 animate-in fade-in">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-slate-900 bg-white font-extrabold text-[10px] uppercase shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)]">
          <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" /> ReadPulse Membership Pass
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">
          Read & Listen Everything.
        </h1>

        <p className="text-xs font-bold text-slate-500">
          Subscribe for full reading, chapter audio streaming, and offline PDF downloads.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="bg-[#fafaf9] border-4 border-slate-900 p-8 shadow-[8px_8px_0_0_rgba(15,23,42,1)] relative overflow-hidden max-w-md mx-auto">
        <div className="absolute top-0 right-0 bg-[#a855f7] text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 border-b-3 border-l-3 border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)]">
          Monthly Membership
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase">VIP All-Access Pass</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">30-Day Unlocked Reading & Audio Pass</p>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-slate-900">$9.99</span>
            <span className="text-xs font-bold text-slate-500">/ month</span>
          </div>

          {/* Perks */}
          <div className="space-y-3 pt-2">
            {[
              'Full reading access across eBooks in catalog',
              'Word-by-word interactive audio narration',
              'Direct DRM PDF download links unlocked',
              'Cancel anytime from account settings'
            ].map((perk, i) => (
              <div key={i} className="flex items-start gap-3 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 border-2 border-slate-900 bg-[#a3e635] text-slate-900 flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_rgba(15,23,42,1)]">
                  <Check className="w-3 h-3" />
                </div>
                <span>{perk}</span>
              </div>
            ))}
          </div>

          {success || user?.subscriptionStatus === 'active' ? (
            <div className="p-4 border-3 border-slate-900 bg-[#22c55e] text-center space-y-1 shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
              <span className="text-xs font-black text-white uppercase flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-white" /> Subscription Active & Unlocked!
              </span>
              <p className="text-[9px] font-bold text-white/95">Enjoy full access to all books, narration & downloads.</p>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={handleSubscribeStripe}
                disabled={loading}
                className="w-full bg-[#facc15] hover:bg-[#e2b80d] text-slate-900 border-3 border-slate-900 font-black uppercase text-xs py-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? 'Activating Pass...' : 'Subscribe via Stripe ($9.99/mo)'}
              </button>

              <button
                onClick={handleSubscribeWallet}
                disabled={loading}
                className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-3 border-slate-900 font-black uppercase text-xs py-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] transition-all flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Pay with Digital Wallet ($9.99/mo)
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-slate-500 uppercase font-black">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Instant Activation & MongoDB Billing Sync
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
