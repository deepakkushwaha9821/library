import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('readpulse_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('readpulse_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    setUser(res.data);
    localStorage.setItem('readpulse_user', JSON.stringify(res.data));
    return res.data;
  };

  const register = async (name, email, password, role, adminSecretKey) => {
    const res = await API.post('/auth/register', { name, email, password, role, adminSecretKey });
    setUser(res.data);
    localStorage.setItem('readpulse_user', JSON.stringify(res.data));
    return res.data;
  };

  const becomeSeller = async () => {
    const res = await API.post('/auth/become-seller');
    const updated = { ...user, role: 'seller', isSellerApproved: true };
    setUser(updated);
    localStorage.setItem('readpulse_user', JSON.stringify(updated));
    return res.data;
  };

  // Update wallet balance in global state + localStorage
  const updateWalletBalance = (newBalance) => {
    const updated = { ...user, walletBalance: newBalance };
    setUser(updated);
    localStorage.setItem('readpulse_user', JSON.stringify(updated));
  };

  // Update subscription status in global state + localStorage
  const updateSubscriptionStatus = (status, plan) => {
    const updated = { ...user, subscriptionStatus: status, subscriptionPlan: plan };
    setUser(updated);
    localStorage.setItem('readpulse_user', JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('readpulse_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      becomeSeller, 
      updateWalletBalance,
      updateSubscriptionStatus, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
