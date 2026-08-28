import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Check, Coffee, Banknote, CreditCard, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/api';

const PRESET_AMOUNTS = [50000, 70000, 100000, 150000];

export default function DepositModal({ isOpen, kiosk, onClose, onSubmit }) {
  if (!isOpen || !kiosk) return null;

  const [mode, setMode] = useState('setor'); // 'setor' | 'libur'
  const [nominal, setNominal] = useState(50000);
  const [metode, setMetode] = useState('Tunai');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        kiosk_id: kiosk.id,
        nominal: mode === 'libur' ? 0 : nominal,
        status: mode,
        metode: mode === 'libur' ? null : metode,
        catatan: catatan.trim() || null
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Sheet - Super Rounded 3xl */}
        <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto no-scrollbar space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Catat Setoran Harian
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {kiosk.nama_kantin}
              </h3>
              <p className="text-xs text-slate-500">
                Penyewa: <span className="font-semibold text-slate-800">{kiosk.nama_penyewa || '-'}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode Switch: Setor vs Libur */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('setor')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'setor'
                    ? 'btn-emerald-brand shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Setor Kas
              </button>
              <button
                type="button"
                onClick={() => setMode('libur')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'libur'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Tutup / Libur
              </button>
            </div>

            {mode === 'setor' ? (
              <>
                {/* Nominal Input & Display */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nominal Setoran (Rp)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={nominal}
                    onChange={(e) => setNominal(parseInt(e.target.value) || 0)}
                    className="w-full text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-financial focus:outline-none focus:bg-white focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-all"
                  />
                </div>

                {/* Quick Amount Pills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Pilihan Cepat Sekali Klik:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNominal(amt)}
                        className={`py-2 rounded-full text-xs font-bold transition-all border ${
                          nominal === amt
                            ? 'btn-emerald-brand border-transparent shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {formatRupiah(amt).replace('Rp ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Metode Penyerahan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetode('Tunai')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        metode === 'Tunai'
                          ? 'btn-emerald-brand border-transparent shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-300" />
                      Tunai (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetode('Transfer')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        metode === 'Transfer'
                          ? 'btn-emerald-brand border-transparent shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-300" />
                      Transfer / QRIS
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Unit usaha ini akan dicatat sebagai <strong>Libur (Rp 0)</strong> untuk hari ini.
                </span>
              </div>
            )}

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Keterangan / Catatan (Opsional)
              </label>
              <input
                type="text"
                placeholder={mode === 'libur' ? 'Misal: Izin sakit / tutup' : 'Misal: Titip pengurus'}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:bg-white focus:border-emerald-800"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full btn-emerald-brand font-bold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Catatan Setoran'}</span>
            </button>
          </form>
        </div>
      </div>
    </AnimatePresence>
  );
}
