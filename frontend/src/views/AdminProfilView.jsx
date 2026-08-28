import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Database, Globe, LogOut, CheckCircle2, Code, ChevronRight } from 'lucide-react';
import DeveloperModal from '../components/DeveloperModal';

export default function AdminProfilView({ onShowToast }) {
  const { user, logout } = useAuth();
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const handleLogout = () => {
    logout();
    onShowToast?.('Berhasil keluar dari akun.', 'info');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Identity Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-card text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-brand text-white flex items-center justify-center font-black text-xl mx-auto shadow-sm">
          {user?.initials || 'BP'}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            {user?.name || "Pengurus BPH Masjid Al-Wasi'i"}
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Badan Pengelola Harian (BPH)
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Akses Administrator</span>
        </div>
      </div>

      {/* System Details */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-card space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Informasi Sistem
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Username Login
            </span>
            <span className="font-bold text-slate-900">{user?.username || 'bph'}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              Basis Data
            </span>
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Turso Cloud (LibSQL)
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              Infrastruktur Deploy
            </span>
            <span className="font-bold text-slate-900">Vercel Serverless</span>
          </div>
        </div>
      </div>

      {/* Tentang Pengembang Card */}
      <button
        type="button"
        onClick={() => setShowDeveloperModal(true)}
        className="w-full p-4 rounded-3xl bg-white border border-slate-200 shadow-card hover:border-slate-300 transition-all flex items-center justify-between text-left active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              Tentang Pengembang
            </h4>
            <p className="text-[11px] text-slate-500">
              Informasi developer, portfolio &amp; kontak sosial
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>

      {/* Logout Button (Merah) */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4 text-rose-600" />
        <span>Keluar dari Akun BPH</span>
      </button>

      {/* Developer Modal */}
      <DeveloperModal
        isOpen={showDeveloperModal}
        onClose={() => setShowDeveloperModal(false)}
      />
    </div>
  );
}
