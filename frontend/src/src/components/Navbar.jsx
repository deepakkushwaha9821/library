import React, { useState } from 'react';
import { BookOpen, ShoppingBag, Sparkles, User, LogOut, ShieldCheck, PlusCircle, CheckCircle, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, setActiveTab, onOpenWallet }) => {
  const { user, logout, becomeSeller } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-[#fafaf9] border-b-4 border-slate-900 px-4 lg:px-8 py-3 shadow-[0_4px_0_0_rgba(15,23,42,1)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('marketplace')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 bg-[#a3e635] border-3 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] flex items-center justify-center group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] transition-all">
            <BookOpen className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-1">
              Read<span className="bg-[#facc15] px-1.5 py-0.5 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">Pulse</span>
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 border-3 border-slate-900 font-extrabold text-xs uppercase transition-all flex items-center gap-2 ${
              activeTab === 'marketplace'
                ? 'bg-[#a3e635] text-slate-900 shadow-[3px_3px_0_0_rgba(15,23,42,1)] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white hover:bg-slate-100 shadow-[1px_1px_0_0_rgba(15,23,42,1)] text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Marketplace
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 border-3 border-slate-900 font-extrabold text-xs uppercase transition-all flex items-center gap-2 ${
                activeTab === 'library'
                  ? 'bg-[#22c55e] text-white shadow-[3px_3px_0_0_rgba(15,23,42,1)] translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-white hover:bg-slate-100 shadow-[1px_1px_0_0_rgba(15,23,42,1)] text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              My Library
            </button>
          )}

          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 border-3 border-slate-900 font-extrabold text-xs uppercase transition-all flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'bg-[#a855f7] text-white shadow-[3px_3px_0_0_rgba(15,23,42,1)] translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white hover:bg-slate-100 shadow-[1px_1px_0_0_rgba(15,23,42,1)] text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Subscription
          </button>
        </div>

        {/* Right User Control Bar */}
        <div className="flex items-center gap-3">
          
          {/* Digital Wallet Quick Access Button */}
          {user && (
            <button
              onClick={onOpenWallet}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-slate-900 border-3 border-slate-900 shadow-[2.5px_2.5px_0_0_rgba(15,23,42,1)] px-3 py-1.5 font-black text-xs uppercase flex items-center gap-1.5 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet: ${user.walletBalance ? user.walletBalance.toFixed(2) : '0.00'}</span>
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0_0_rgba(15,23,42,1)] px-3 py-1.5 font-bold hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] transition-all"
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-slate-900"
                />
                <span className="text-xs font-black text-slate-900">{user.name}</span>
                <span className="text-[9px] border-2 border-slate-900 bg-[#f97316] text-white px-2 py-0.5 font-black uppercase">
                  {user.role}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-60 bg-white border-3 border-slate-900 shadow-[6px_6px_0_0_rgba(15,23,42,1)] p-2.5 z-50">
                  <div className="px-2 py-1.5 border-b-2 border-slate-900 mb-2">
                    <p className="text-xs font-black text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => { onOpenWallet(); setShowUserMenu(false); }}
                    className="w-full text-left px-2 py-2 text-xs font-extrabold text-slate-900 hover:bg-[#06b6d4]/20 border-2 border-transparent hover:border-slate-900 transition-colors flex items-center gap-2 mb-1"
                  >
                    <Wallet className="w-4 h-4 text-slate-900" />
                    My Digital Wallet
                  </button>

                  {user.role === 'seller' || user.role === 'admin' ? (
                    <button
                      onClick={() => { setActiveTab('seller-dashboard'); setShowUserMenu(false); }}
                      className="w-full text-left px-2 py-2 text-xs font-extrabold text-slate-900 hover:bg-[#a3e635] border-2 border-transparent hover:border-slate-900 transition-colors flex items-center gap-2 mb-1"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-900" />
                      Seller Studio & Analytics
                    </button>
                  ) : (
                    <button
                      onClick={async () => { await becomeSeller(); setActiveTab('seller-dashboard'); setShowUserMenu(false); }}
                      className="w-full text-left px-2 py-2 text-xs font-extrabold text-[#22c55e] hover:bg-[#22c55e]/10 border-2 border-transparent hover:border-slate-900 transition-colors flex items-center gap-2 mb-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Become a Seller
                    </button>
                  )}

                  {user.role === 'admin' && (
                    <button
                      onClick={() => { setActiveTab('admin-panel'); setShowUserMenu(false); }}
                      className="w-full text-left px-2 py-2 text-xs font-extrabold text-[#ef4444] hover:bg-[#ef4444]/10 border-2 border-transparent hover:border-slate-900 transition-colors flex items-center gap-2 mb-1"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Control Panel
                    </button>
                  )}

                  <div className="border-t-2 border-slate-900 my-1.5"></div>

                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full text-left px-2 py-2 text-xs font-extrabold text-[#ef4444] hover:bg-[#ef4444]/20 border-2 border-transparent hover:border-slate-900 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="bg-[#facc15] hover:bg-[#e2b80d] border-3 border-slate-900 shadow-[3px_3px_0_0_rgba(15,23,42,1)] text-slate-900 font-extrabold text-xs px-4 py-2 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_0_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_rgba(15,23,42,1)] transition-all flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
