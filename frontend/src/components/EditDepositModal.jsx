import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Banknote, CreditCard } from 'lucide-react';

export default function EditDepositModal({ isOpen, deposit, onClose, onSubmit, onDelete }) {
  if (!isOpen || !deposit) return null;

  const [nominal, setNominal] = useState(deposit.nominal || 0);
  const [metode, setMetode] = useState(deposit.metode || 'Tunai');
  const [catatan, setCatatan] = useState(deposit.catatan || '');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (deposit) {
      setNominal(deposit.nominal || 0);
      setMetode(deposit.metode || 'Tunai');
      setCatatan(deposit.catatan || '');
      setConfirmDelete(false);
    }
  }, [deposit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(deposit.deposit_id, {
        nominal,
        status: deposit.deposit_status || 'setor',
        metode,
        catatan: catatan.trim() || null
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      await onDelete(deposit.deposit_id);
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

        {/* Modal Content - Rounded 3xl */}
        <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Koreksi Catatan Setoran
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {deposit.nama_kantin}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nominal Setoran (Rp)
              </label>
              <input
                type="number"
                step="1000"
                value={nominal}
                onChange={(e) => setNominal(parseInt(e.target.value) || 0)}
                className="w-full text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-financial focus:outline-none focus:bg-white focus:border-emerald-800"
                required
              />
            </div>

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

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Keterangan Koreksi
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Alasan koreksi..."
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:bg-white focus:border-emerald-800"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                className={`py-3 px-4 rounded-full font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                  confirmDelete
                    ? 'bg-rose-600 text-white'
                    : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmDelete ? 'Yakin Hapus?' : 'Hapus'}</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-full btn-emerald-brand font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Koreksi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatePresence>
  );
}
