import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginView({ onShowToast }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap isi username dan password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      onShowToast?.('Login berhasil! Selamat datang di SISEKA.', 'success');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa username dan password.');
      onShowToast?.(err.message || 'Login gagal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8 relative">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-emerald-brand text-white shadow-sm mb-1">
            <Store className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            SISEKA WASI'I
          </h1>
          <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
            Sistem Informasi Setoran Sewa Kantin &bull; Masjid Al-Wasi'i
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-7 shadow-xl border border-slate-200 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Kata Sandi / PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full btn-emerald-brand font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Badan Pengelola Harian (BPH) Masjid Al-Wasi'i</span>
        </div>
      </div>
    </div>
  );
}
