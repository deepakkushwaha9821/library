import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import EbookReader from './components/EbookReader';
import AuthModal from './components/AuthModal';
import WalletModal from './components/WalletModal';

import Marketplace from './pages/Marketplace';
import BookDetail from './pages/BookDetail';
import Library from './pages/Library';
import Subscription from './pages/Subscription';
import SellerDashboard from './pages/SellerDashboard';
import AdminPanel from './pages/AdminPanel';

import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Ebook Reader Modal State
  const [readerState, setReaderState] = useState({
    isOpen: false,
    bookId: null,
    title: ''
  });

  const handleSelectBook = (book) => {
    setSelectedBookId(book._id);
    setActiveTab('detail');
  };

  const handleOpenReader = (bookId, title) => {
    setReaderState({
      isOpen: true,
      bookId,
      title
    });
  };

  const handleCloseReader = () => {
    setReaderState({
      isOpen: false,
      bookId: null,
      title: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f0ec] text-slate-900 font-sans selection:bg-[#facc15] selection:text-slate-900">
      
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenWallet={() => setShowWalletModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {activeTab === 'marketplace' && (
          <Marketplace onSelectBook={handleSelectBook} />
        )}

        {activeTab === 'detail' && selectedBookId && (
          <BookDetail 
            bookId={selectedBookId} 
            onBack={() => setActiveTab('marketplace')} 
            onOpenReader={handleOpenReader}
            onOpenWallet={() => setShowWalletModal(true)}
          />
        )}

        {activeTab === 'library' && (
          <Library onOpenReader={handleOpenReader} />
        )}

        {activeTab === 'subscription' && (
          <Subscription />
        )}

        {activeTab === 'seller-dashboard' && (
          <SellerDashboard />
        )}

        {activeTab === 'admin-panel' && (
          <AdminPanel />
        )}
      </main>

      {/* Auth Modal Overlay */}
      {activeTab === 'auth' && (
        <AuthModal onClose={() => setActiveTab('marketplace')} />
      )}

      {/* Digital Wallet Modal Overlay */}
      {showWalletModal && (
        <WalletModal 
          onClose={() => setShowWalletModal(false)} 
        />
      )}

      {/* In-App DRM Protected Ebook Reader Overlay */}
      {readerState.isOpen && (
        <EbookReader
          bookId={readerState.bookId}
          title={readerState.title}
          onClose={handleCloseReader}
        />
      )}

      {/* Global Audio Player Bar */}
      <AudioPlayer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </AuthProvider>
  );
}
