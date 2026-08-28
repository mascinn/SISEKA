import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavbarTop from './components/NavbarTop';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';

import LoginView from './views/LoginView';
import AdminPenarikanView from './views/AdminPenarikanView';
import AdminRekapView from './views/AdminRekapView';
import AdminKantinView from './views/AdminKantinView';
import AdminProfilView from './views/AdminProfilView';

import TenantBerandaView from './views/TenantBerandaView';
import TenantRekapView from './views/TenantRekapView';
import TenantProfilView from './views/TenantProfilView';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Set default tab on login
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setActiveTab('penarikan');
      } else {
        setActiveTab('beranda');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 text-white flex items-center justify-center shadow-sm">
          <span className="font-extrabold text-lg">S</span>
        </div>
        <p className="text-xs font-bold text-slate-500 tracking-wide">
          Memuat SISEKA WASI'I...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <LoginView onShowToast={showToast} />
      </>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Navbar */}
      <NavbarTop onOpenProfile={() => setActiveTab('profil')} />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        {isAdmin ? (
          <>
            {activeTab === 'penarikan' && <AdminPenarikanView onShowToast={showToast} />}
            {activeTab === 'rekap' && <AdminRekapView onShowToast={showToast} />}
            {activeTab === 'kantin' && <AdminKantinView onShowToast={showToast} />}
            {activeTab === 'profil' && <AdminProfilView onShowToast={showToast} />}
          </>
        ) : (
          <>
            {activeTab === 'beranda' && <TenantBerandaView onShowToast={showToast} />}
            {activeTab === 'rekap' && <TenantRekapView onShowToast={showToast} />}
            {activeTab === 'profil' && <TenantProfilView onShowToast={showToast} />}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
