import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah, formatMonthLabel, formatIndoDate } from '../utils/api';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle2, ChevronRight, X, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function TenantRekapView({ onShowToast }) {
  const currentYear = new Date().getFullYear().toString();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [monthDailyHistory, setMonthDailyHistory] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchTenantHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const [res] = await Promise.all([
        apiFetch('/recap/tenant/monthly-history'),
        new Promise((r) => setTimeout(r, 400))
      ]);
      if (res.success) {
        setHistoryData(res);
      } else {
        throw new Error(res.message || 'Gagal memuat rekap tenant');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Koneksi ke server terputus.');
      onShowToast?.(err.message || 'Gagal memuat rekap tahunan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantHistory();
  }, []);

  const handleOpenMonthDetail = async (monthItem) => {
    setSelectedMonthDetail(monthItem);
    setLoadingDetail(true);
    const monthCode = monthItem.bulan_code || monthItem.bulan;
    try {
      const res = await apiFetch(`/deposits/tenant/current?month=${monthCode}`);
      if (res.success) {
        setMonthDailyHistory(res.riwayat || []);
      }
    } catch (err) {
      onShowToast?.('Gagal memuat rincian harian bulan ini.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const months = historyData?.data || historyData?.months || [];
  const accSummary = historyData?.summary_akumulasi || historyData?.summary || {};
  const totalSetorTahun = accSummary.total_setor || 0;
  const totalTargetTahun = accSummary.total_target || 0;
  const saldoBersih = accSummary.saldo_bersih || 0;
  const persentaseTahun = accSummary.persentase_tercapai || (totalTargetTahun > 0 ? Math.min(100, Math.round((totalSetorTahun / totalTargetTahun) * 100)) : 0);
  const bulanLunas = accSummary.bulan_lunas || 0;
  const bulanBelum = accSummary.bulan_belum || 0;

  if (loading && !historyData) {
    return (
      <div className="space-y-4 pb-24">
        <div className="w-36 h-6 rounded-full skeleton-shimmer" />
        <div className="w-full h-48 rounded-3xl skeleton-shimmer border border-slate-200" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-24 rounded-3xl skeleton-shimmer border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Rekap Setoran Bulanan
          </h2>
          <p className="text-xs text-slate-500">
            Kilas balik pemenuhan sewa kantin tahun {currentYear}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
          Tahun {currentYear}
        </span>
      </div>

      {error ? (
        <div className="p-6 text-center bg-white rounded-3xl border border-rose-200 shadow-card space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <div>
            <h4 className="text-xs font-bold text-rose-900">Gagal Memuat Rekap</h4>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchTenantHistory}
            className="px-4 py-2 rounded-full btn-emerald-brand text-xs font-bold shadow-xs"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Annual Summary Hero Card (Ultra-Compact FinTech Layout - No Truncation) */}
          <div className="card-hero-emerald rounded-3xl p-4 sm:p-5 space-y-3 shadow-elevated">
            {/* Header Card */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-200 uppercase flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
                Akumulasi Tahun {currentYear}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/10 backdrop-blur-xs">
                {historyData?.kiosk?.nama_kantin || 'Kantin Anda'}
              </span>
            </div>

            {/* Total Setoran Display */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-emerald-200/80 tracking-wide uppercase block">
                Total Setoran Terkumpul
              </span>
              <div className="text-2xl sm:text-3xl font-black font-financial tracking-tight text-white whitespace-nowrap">
                {formatRupiah(totalSetorTahun)}
              </div>
              <p className="text-[11px] text-emerald-100/85 font-medium">
                Target Kewajiban: <span className="font-bold text-white font-financial">{formatRupiah(totalTargetTahun)}</span>
              </p>
            </div>

            {/* Slim Modern Progress Bar */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-100 font-medium">Ketercapaian Target</span>
                <span className="text-emerald-300 font-financial font-extrabold">{persentaseTahun}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, persentaseTahun)}%` }}
                />
              </div>
            </div>

            {/* 3 Dedicated Distinct Elements (Full Saldo Ribbon + 2 Stat Tiles) */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              {/* Element 1: Saldo Bersih Banner (Full Width, Never Truncates) */}
              <div className={`p-3 rounded-2xl border backdrop-blur-xs flex items-center justify-between gap-2.5 ${
                saldoBersih > 0
                  ? 'bg-emerald-400/20 border-emerald-300/30'
                  : saldoBersih < 0
                  ? 'bg-rose-500/20 border-rose-300/30'
                  : 'bg-white/10 border-white/15'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    saldoBersih > 0
                      ? 'bg-emerald-400/30 text-emerald-200'
                      : saldoBersih < 0
                      ? 'bg-rose-400/30 text-rose-200'
                      : 'bg-white/20 text-white'
                  }`}>
                    {saldoBersih > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : saldoBersih < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/80 block">
                      {saldoBersih > 0 ? 'Saldo Surplus' : saldoBersih < 0 ? 'Sisa Tunggakan' : 'Status Saldo'}
                    </span>
                    <span className={`text-xs sm:text-sm font-black font-financial ${
                      saldoBersih > 0 ? 'text-emerald-300' : saldoBersih < 0 ? 'text-rose-300' : 'text-white'
                    }`}>
                      {saldoBersih > 0
                        ? `+${formatRupiah(saldoBersih)}`
                        : saldoBersih < 0
                        ? `-${formatRupiah(Math.abs(saldoBersih))}`
                        : 'Lunas Pas (Rp 0)'}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                  saldoBersih > 0
                    ? 'bg-emerald-400/30 text-emerald-200'
                    : saldoBersih < 0
                    ? 'bg-rose-400/30 text-rose-200'
                    : 'bg-white/20 text-white'
                }`}>
                  {saldoBersih > 0 ? 'Surplus' : saldoBersih < 0 ? 'Tunggakan' : 'Lunas'}
                </span>
              </div>

              {/* 2 Dedicated Separate Elements: Bulan Lunas & Belum Genap */}
              <div className="grid grid-cols-2 gap-2">
                {/* Element 2: Bulan Lunas */}
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/80 block truncate">
                      Bulan Lunas
                    </span>
                    <span className="text-xs font-black text-white font-financial block">
                      {bulanLunas} Bulan
                    </span>
                  </div>
                </div>

                {/* Element 3: Belum Genap */}
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/80 block truncate">
                      Belum Genap
                    </span>
                    <span className="text-xs font-black text-amber-200 font-financial block">
                      {bulanBelum} Bulan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Cards List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Catatan Tiap Periode Bulan
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {months.length} Periode
              </span>
            </div>

            {months.map((m) => {
              const isSurplus = (m.surplus || 0) > 0 || (m.selisih || 0) > 0;
              const isLunasMurni = m.selisih === 0;
              const isLunasKompensasi = m.status_kompensasi === 'lunas_kompensasi';
              const progress = isLunasKompensasi ? 100 : (m.progress_percent || 0);
              const label = m.bulan_label || formatMonthLabel(m.bulan_code || m.bulan);

              return (
                <div
                  key={m.bulan_code || m.bulan}
                  onClick={() => handleOpenMonthDetail(m)}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card space-y-3 hover:border-slate-300 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        {label}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Akad: {formatRupiah(m.tarif_sewa)} / bln
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSurplus ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          Surplus +{formatRupiah(m.surplus || m.selisih)}
                        </span>
                      ) : isLunasKompensasi ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1" title="Kekurangan bulan ini lunas ditutup kompensasi surplus">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Ditutup Surplus (Lunas)
                        </span>
                      ) : isLunasMurni ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Lunas Pas
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                          Kurang {formatRupiah(m.sisa_kewajiban_setelah_kompensasi || m.kekurangan || Math.abs(m.selisih))}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Keterangan Kompensasi Surplus jika ada */}
                  {isLunasKompensasi && (
                    <div className="px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Setoran {formatRupiah(m.total_setor)} (kurang {formatRupiah(m.kekurangan)}), <strong>lunas ditutupi kompensasi saldo surplus</strong>.</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="font-financial text-slate-900">
                        {formatRupiah(m.total_setor)}
                        <span className="font-normal text-slate-500"> terkumpul</span>
                      </span>
                      <span className="text-xs font-bold text-slate-900">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (isSurplus || isLunasMurni || isLunasKompensasi) ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Month Detail Modal */}
      <AnimatePresence>
        {selectedMonthDetail && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              onClick={() => setSelectedMonthDetail(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto no-scrollbar space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Rincian Setoran Harian
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedMonthDetail.bulan_label || formatMonthLabel(selectedMonthDetail.bulan_code || selectedMonthDetail.bulan)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total: <span className="font-bold text-emerald-800 font-financial">{formatRupiah(selectedMonthDetail.total_setor)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMonthDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="p-8 text-center text-xs text-slate-500">Memuat rincian harian...</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {(!monthDailyHistory || monthDailyHistory.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Tidak ada catatan setoran pada bulan ini.
                    </div>
                  ) : (
                    monthDailyHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {formatIndoDate(item.tanggal)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.status === 'libur' ? 'Libur / Tutup' : `${item.metode || 'Tunai'} • ${item.waktu || ''} WIB`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-financial font-extrabold text-xs ${
                              item.status === 'libur' ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {item.status === 'libur' ? 'Rp 0' : `+${formatRupiah(item.nominal)}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
