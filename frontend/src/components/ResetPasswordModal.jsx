import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Key, X, Check, Copy } from 'lucide-react';

export default function ResetPasswordModal({ isOpen, kiosk, onClose, onReset }) {
  if (!isOpen || !kiosk) return null;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleExecuteReset = async () => {
    setLoading(true);
    try {
      const res = await onReset(kiosk.id);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `*Informasi Akun SISEKA WASI'I*\nUnit Usaha: ${kiosk.nama_kantin}\nUsername: ${result.username}\nPassword Baru: ${result.password_baru}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setResult(null);
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Box - Rounded 3xl */}
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 z-10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <Key className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Reset Sandi Tenant
                </h3>
                <p className="text-xs text-slate-500">{kiosk.nama_kantin}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-2">
                <p className="text-xs font-bold text-emerald-900">
                  Password berhasil direset ke nilai awal:
                </p>
                <div className="text-xs space-y-1 font-mono bg-white p-3 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 font-sans">Username:</span>{' '}
                    <strong className="text-slate-900">{result.username}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">Password Baru:</span>{' '}
                    <strong className="text-emerald-800 font-bold">{result.password_baru}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-3 rounded-full btn-emerald-brand font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Info Akun'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan mengembalikan kata sandi akun <strong>{kiosk.nama_kantin}</strong> ke PIN default/acak baru.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleExecuteReset}
                  className="flex-1 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Ya, Reset Sandi'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
