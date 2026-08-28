import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah } from '../utils/api';
import { Store, Search, Key, Phone, Edit3, X, Check, User } from 'lucide-react';
import ResetPasswordModal from '../components/ResetPasswordModal';

export default function AdminKantinView({ onShowToast }) {
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetKiosk, setResetKiosk] = useState(null);

  // Edit Kiosk Modal
  const [editingKiosk, setEditingKiosk] = useState(null);
  const [editNamaKantin, setEditNamaKantin] = useState('');
  const [editNamaPenyewa, setEditNamaPenyewa] = useState('');
  const [editTarif, setEditTarif] = useState(1000000);
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState('aktif');
  const [submitting, setSubmitting] = useState(false);

  const fetchKiosks = async () => {
    try {
      setLoading(true);
      const [res] = await Promise.all([
        apiFetch('/kiosks'),
        new Promise((r) => setTimeout(r, 400))
      ]);
      if (res.success) {
        setKiosks(res.data || []);
      }
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal memuat master unit usaha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKiosks();
  }, []);

  const handleResetPassword = async (kioskId) => {
    try {
      const res = await apiFetch(`/kiosks/${kioskId}/reset-password`, {
        method: 'POST'
      });
      if (res.success) {
        onShowToast?.('Password tenant berhasil direset!', 'success');
        return res;
      }
      throw new Error(res.message || 'Gagal reset password');
    } catch (err) {
      onShowToast?.(err.message || 'Gagal reset password.', 'error');
      throw err;
    }
  };

  const handleOpenEdit = (kiosk) => {
    setEditingKiosk(kiosk);
    setEditNamaKantin(kiosk.nama_kantin || '');
    setEditNamaPenyewa(kiosk.nama_penyewa || '');
    setEditTarif(kiosk.tarif_sewa || 1000000);
    setEditPhone(kiosk.nomor_hp || '');
    setEditStatus(kiosk.status || 'aktif');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingKiosk) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/kiosks/${editingKiosk.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nama_kantin: editNamaKantin.trim(),
          nama_penyewa: editNamaPenyewa.trim(),
          tarif_sewa: editTarif,
          nomor_hp: editPhone.trim() || null,
          status: editStatus
        })
      });
      if (res.success) {
        onShowToast?.('Informasi unit usaha berhasil diperbarui!', 'success');
        setEditingKiosk(null);
        fetchKiosks();
      }
    } catch (err) {
      onShowToast?.(err.message || 'Gagal mengubah data unit usaha.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredKiosks = kiosks.filter((k) =>
    !search ||
    k.nama_kantin.toLowerCase().includes(search.toLowerCase()) ||
    (k.nama_penyewa && k.nama_penyewa.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3.5 pb-24">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Master Unit Usaha
          </h2>
          <p className="text-xs text-slate-500">
            Kelola data profil sewa kantin &amp; akun pedagang
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
          {kiosks.length} Unit
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cari unit usaha atau pedagang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-800 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Skeletons when Loading */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3.5 rounded-full skeleton-shimmer" />
                    <div className="w-20 h-2.5 rounded-full skeleton-shimmer" />
                  </div>
                </div>
                <div className="w-14 h-5 rounded-full skeleton-shimmer" />
              </div>
              <div className="w-full h-12 rounded-2xl skeleton-shimmer" />
              <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-full skeleton-shimmer" />
                <div className="flex-1 h-8 rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Kiosks List */
        <div className="space-y-2.5">
          {filteredKiosks.map((kiosk) => (
            <div
              key={kiosk.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-brand text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    {kiosk.id}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {kiosk.nama_kantin}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Penyewa: <span className="font-semibold text-slate-800">{kiosk.nama_penyewa || '-'}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    kiosk.status === 'aktif'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {kiosk.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Tarif Sewa</span>
                  <span className="font-financial font-extrabold text-slate-900">
                    {formatRupiah(kiosk.tarif_sewa)}
                    <span className="font-normal text-[10px] text-slate-500"> / bln</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">WhatsApp</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {kiosk.nomor_hp || '-'}
                  </span>
                </div>
              </div>

              {/* Actions: Reset Sandi & Edit Info */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setResetKiosk(kiosk)}
                  className="flex-1 py-2 px-3.5 rounded-full border border-amber-200 bg-amber-50/60 text-amber-900 font-bold text-xs hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reset Sandi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(kiosk)}
                  className="flex-1 py-2 px-3.5 rounded-full border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:border-slate-300 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Edit Info</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={Boolean(resetKiosk)}
        kiosk={resetKiosk}
        onClose={() => setResetKiosk(null)}
        onReset={handleResetPassword}
      />

      {/* Edit Info Modal (Full Info: Nama, Penyewa, WA, Tarif, Status) */}
      {editingKiosk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditingKiosk(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Edit Informasi Unit Usaha
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Unit Usaha #{editingKiosk.id}
                </h3>
              </div>
              <button
                onClick={() => setEditingKiosk(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Unit Usaha / Kantin
                </label>
                <input
                  type="text"
                  value={editNamaKantin}
                  onChange={(e) => setEditNamaKantin(e.target.value)}
                  placeholder="Misal: Fotocopy Aleaf.com"
                  className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Pedagang / Penyewa
                </label>
                <input
                  type="text"
                  value={editNamaPenyewa}
                  onChange={(e) => setEditNamaPenyewa(e.target.value)}
                  placeholder="Misal: Mas Budi"
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tarif Sewa Per Bulan (Rp)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={editTarif}
                  onChange={(e) => setEditTarif(parseInt(e.target.value) || 0)}
                  className="w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-financial focus:outline-none focus:bg-white focus:border-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nomor WhatsApp Pedagang
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Misal: 081234567890"
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Status Operasional
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-emerald-800"
                >
                  <option value="aktif">Aktif Digunakan</option>
                  <option value="kosong">Kosong / Belum Ada Penyewa</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl btn-emerald-brand font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan Info'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
