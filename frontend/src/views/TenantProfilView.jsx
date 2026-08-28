import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatRupiah } from '../utils/api';
import { Store, User, LogOut, MessageCircle, FileText, Code, ChevronRight } from 'lucide-react';
import DeveloperModal from '../components/DeveloperModal';

export default function TenantProfilView({ onShowToast }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.success && res.user) {
        setProfile(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleContactBPH = () => {
    const text = encodeURIComponent(
      `Assalamu'alaikum Pengurus BPH Masjid Al-Wasi'i, saya penyewa *${user?.kios_nama || profile?.kios || 'Kantin'}* (${user?.name || ''}). Ingin menanyakan perihal data setoran sewa kantin.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    onShowToast?.('Berhasil keluar dari akun.', 'info');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Identity Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-forest-900 text-white flex items-center justify-center font-black text-xl mx-auto shadow-sm">
          {user?.initials || 'TN'}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            {user?.name || 'Mitra Pedagang'}
          </h2>
          <p className="text-xs font-semibold text-forest-800">
            {user?.kios_nama || profile?.kios || 'Unit Usaha Kantin'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 text-forest-800 border border-forest-100 text-xs font-semibold">
          <Store className="w-3.5 h-3.5 text-forest-700" />
          <span>Mitra Resmi BPH Masjid Al-Wasi'i</span>
        </div>
      </div>

      {/* Contract & Akad Info */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Informasi Akad &amp; Sewa Kios
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-400" />
              Nama Kantin
            </span>
            <span className="font-bold text-slate-900">{user?.kios_nama || profile?.kios || '-'}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Username Login
            </span>
            <span className="font-bold text-slate-900 font-mono">{user?.username || '-'}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Tarif Akad Sewa
            </span>
            <span className="font-bold text-slate-900 font-financial">
              {formatRupiah(profile?.tarif_sewa || 1000000)} / bln
            </span>
          </div>
        </div>
      </div>

      {/* Help & Contact BPH */}
      <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-100 text-forest-950 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-forest-900 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-forest-950">
              Pusat Layanan BPH
            </h4>
            <p className="text-[11px] text-forest-800">
              Ada kendala data setoran sewa?
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleContactBPH}
          className="px-3 py-1.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold shadow-xs shrink-0 transition-colors"
        >
          Chat WA
        </button>
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
        <span>Keluar dari Akun Penyewa</span>
      </button>

      {/* Developer Modal */}
      <DeveloperModal
        isOpen={showDeveloperModal}
        onClose={() => setShowDeveloperModal(false)}
      />
    </div>
  );
}
