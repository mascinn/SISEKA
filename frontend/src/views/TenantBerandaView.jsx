import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, formatRupiah, getTodayFormatted, formatIndoFullDate } from '../utils/api';
import { CheckCircle2, Clock, Coffee, RefreshCw, AlertCircle } from 'lucide-react';

export default function TenantBerandaView({ onShowToast }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTenantData = async (isRefresh = false) => {
    try {
      setLoading(true);
      if (isRefresh) setData(null);
      setError('');
      const [res] = await Promise.all([
        apiFetch('/deposits/tenant/current'),
        new Promise((r) => setTimeout(r, 400))
      ]);
      if (res.success) {
        setData(res);
      } else {
        throw new Error(res.message || 'Gagal memuat dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Koneksi ke server terputus.');
      onShowToast?.(err.message || 'Gagal memuat data sewa.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, []);

  const summary = data?.summary || {
    total_akumulasi: 0,
    tarif_sewa: 1000000,
    progress_percent: 0,
    kekurangan: 0,
    surplus: 0
  };

  const depositToday = data?.deposit_today;
  const isTodaySetor = depositToday && depositToday.status === 'setor';
  const isTodayLibur = depositToday && depositToday.status === 'libur';

  return (
    <div className="space-y-4 pb-24">
      {/* Greeting Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-medium text-slate-500">Selamat Datang 👋</span>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {user?.name || 'Mitra Pedagang'}
          </h2>
          <p className="text-xs font-semibold text-emerald-800">
            {data?.kiosk?.nama_kantin || user?.kios_nama || 'Kantin Al-Wasi\'i'}
          </p>
        </div>
        <button
          onClick={() => fetchTenantData(true)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
          title="Perbarui Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          <div className="w-full h-44 rounded-3xl skeleton-shimmer" />
          <div className="w-full h-16 rounded-2xl skeleton-shimmer" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-12 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-white rounded-2xl border border-rose-200 shadow-card space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <div>
            <h4 className="text-xs font-bold text-rose-900">Gagal Terhubung ke Server</h4>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchTenantData}
            className="px-4 py-2 rounded-xl btn-emerald-brand text-xs font-bold shadow-xs"
          >
            Coba Muat Ulang
          </button>
        </div>
      ) : (
        <>
          {/* Explicit Emerald Hero Card */}
          <div className="card-hero-emerald rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-emerald-200 uppercase">
                Akumulasi Setoran Bulan Ini
              </span>
              <span className="text-xs font-bold text-white font-financial px-2 py-0.5 rounded-full bg-white/15">
                {summary.progress_percent}%
              </span>
            </div>

            <div>
              <div className="text-3xl font-black font-financial tracking-tight text-white">
                {formatRupiah(summary.total_akumulasi)}
              </div>
              <p className="text-xs font-medium text-emerald-100/90 mt-0.5">
                Kewajiban Sewa: <span className="font-bold text-white">{formatRupiah(summary.tarif_sewa)}</span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-emerald-300 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, summary.progress_percent)}%` }}
                />
              </div>
            </div>

            {/* Balance Status */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/15 text-xs">
              <div className="bg-white/10 rounded-xl p-2.5">
                <span className="text-[10px] text-emerald-100/80 font-semibold block">Sewa Per Bulan</span>
                <span className="text-xs font-bold text-white font-financial">
                  {formatRupiah(summary.tarif_sewa)}
                </span>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <span className="text-[10px] text-emerald-100/80 font-semibold block">
                  {summary.surplus > 0 ? 'Surplus Tersedia' : 'Sisa Kekurangan'}
                </span>
                <span
                  className={`text-xs font-bold font-financial ${
                    summary.surplus > 0 ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {summary.surplus > 0 ? `+${formatRupiah(summary.surplus)}` : formatRupiah(summary.kekurangan)}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Real Status Card */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  isTodaySetor
                    ? 'bg-emerald-50 text-emerald-700'
                    : isTodayLibur
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isTodaySetor ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : isTodayLibur ? (
                  <Coffee className="w-5 h-5 text-amber-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Setoran Hari Ini
                </span>
                <h4 className="text-xs font-extrabold text-slate-900">
                  {isTodaySetor
                    ? `${depositToday.waktu || ''} WIB • Diterima BPH`
                    : isTodayLibur
                      ? 'Tutup / Libur (Rp 0)'
                      : 'Menunggu Pencatatan Petugas'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {getTodayFormatted()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`font-financial font-extrabold text-xs sm:text-sm ${
                  isTodaySetor ? 'text-emerald-700' : isTodayLibur ? 'text-amber-700' : 'text-slate-500'
                }`}
              >
                {isTodaySetor ? `+${formatRupiah(depositToday.nominal)}` : isTodayLibur ? 'Rp 0' : 'Menunggu'}
              </span>
            </div>
          </div>

          {/* Deposit History */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Riwayat Setoran Bulan Ini
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {data?.riwayat?.length || 0} Catatan
              </span>
            </div>

            {(!data?.riwayat || data.riwayat.length === 0) ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                Belum ada setoran tercatat untuk periode ini.
              </div>
            ) : (
              <div className="space-y-2">
                {data.riwayat.map((item, idx) => {
                  const isSetor = item.status === 'setor';
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-card"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                            isSetor ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSetor ? <CheckCircle2 className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {formatIndoFullDate(item.tanggal)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {isSetor ? `${item.waktu || '-'} WIB • ${item.metode || 'Tunai'}` : (item.catatan || 'Libur / Tutup')}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-financial font-bold text-xs ${
                          isSetor ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {isSetor ? `+${formatRupiah(item.nominal)}` : 'Rp 0'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
