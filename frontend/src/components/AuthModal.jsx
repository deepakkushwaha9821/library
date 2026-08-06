import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, Key, X, Check, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const AuthModal = ({ onClose }) => {
  const { login, register } = useAuth();
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  
  // Login & Register Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  
  // Forgot & Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      if (view === 'login') {
        await login(email, password);
        onClose();
      } else if (view === 'register') {
        await register(name, email, password, role, adminSecretKey);
        onClose();
      } else if (view === 'forgot') {
        const res = await API.post('/auth/forgot-password', { email: forgotEmail });
        setSuccess(res.data.message);
        if (res.data.resetToken) {
          setResetToken(res.data.resetToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const res = await API.post(`/auth/reset-password/${resetToken}`, { password: newPassword });
      setSuccess('Password reset successfully! Logging you in...');
      setTimeout(() => {
        login(res.data.email || forgotEmail, newPassword);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#fafaf9] border-4 border-slate-900 p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0_0_rgba(15,23,42,1)] space-y-6 relative">
        
        {/* EXPLICIT CLOSE BUTTON (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white border-2 border-slate-900 hover:bg-slate-100 shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            {view === 'login' && 'Enter your email and password to access your account.'}
            {view === 'register' && 'Register as Buyer, Seller, or System Admin.'}
            {view === 'forgot' && 'MongoDB-backed token verification & reset flow.'}
          </p>
        </div>

        {error && (
          <div className="p-3 border-2 border-slate-900 bg-[#ef4444] text-white text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 border-2 border-slate-900 bg-[#a3e635] text-slate-900 text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
            {success}
          </div>
        )}

        {/* FORGOT / RESET PASSWORD VIEW */}
        {view === 'forgot' ? (
          resetToken ? (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="p-3 border-2 border-slate-900 bg-white shadow-[2px_2px_0_0_rgba(15,23,42,1)] text-[10px] font-mono break-all">
                <span className="font-black text-slate-900 block mb-1">Generated MongoDB Token:</span>
                {resetToken}
              </div>

              <div>
                <label className="block text-slate-900 uppercase mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#22c55e] hover:bg-[#1fa951] text-white border-3 border-slate-900 font-black uppercase py-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] transition-all cursor-pointer text-xs"
              >
                {loading ? 'Resetting...' : 'Save New Password & Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block text-slate-900 uppercase mb-1">Your Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#facc15] hover:bg-[#e2b80d] text-slate-900 border-3 border-slate-900 font-black uppercase py-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] transition-all cursor-pointer text-xs"
              >
                {loading ? 'Sending Request...' : 'Generate Reset Token'}
              </button>
            </form>
          )
        ) : (
          /* LOGIN AND REGISTER FORMS */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {view === 'register' && (
              <div>
                <label className="block text-slate-900 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-900 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2.5 text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-900 uppercase">Password</label>
                {view === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(null); }}
                    className="text-[10px] text-indigo-600 hover:underline uppercase font-black"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2.5 text-slate-900"
                />
              </div>
            </div>

            {view === 'register' && (
              <>
                <div>
                  <label className="block text-slate-900 uppercase mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white border-2 border-slate-900 rounded-none px-3 py-2.5 text-slate-900"
                  >
                    <option value="buyer">Buyer (Read & Stream Digital Books)</option>
                    <option value="seller">Author / Seller (Publish & Sell)</option>
                    <option value="admin">System Admin (Full Moderation Access)</option>
                  </select>
                </div>

                {role === 'admin' && (
                  <div className="p-3 bg-[#facc15]/20 border-2 border-slate-900 space-y-1">
                    <label className="block text-slate-900 uppercase text-[10px] font-black">
                      Admin Registration Key (READPULSE_ADMIN_2026)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-900 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={adminSecretKey}
                        onChange={(e) => setAdminSecretKey(e.target.value)}
                        placeholder="Enter secret key"
                        className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2 text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#facc15] hover:bg-[#e2b80d] text-slate-900 border-3 border-slate-900 font-black uppercase py-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_rgba(15,23,42,1)] transition-all cursor-pointer text-xs"
            >
              {loading ? 'Authenticating...' : view === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="text-center pt-1 border-t-2 border-slate-200 flex justify-between items-center text-xs">
          {view !== 'login' && (
            <button
              type="button"
              onClick={() => { setView('login'); setError(null); setSuccess(null); }}
              className="text-slate-600 hover:text-slate-900 font-extrabold uppercase flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}

          {view === 'login' && (
            <button
              type="button"
              onClick={() => { setView('register'); setError(null); setSuccess(null); }}
              className="text-indigo-600 hover:underline font-black uppercase ml-auto"
            >
              No Account? Create One
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
