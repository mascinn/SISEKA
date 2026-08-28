import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah, formatMonthLabel, formatIndoDate } from '../utils/api';
import { 
  BarChart3, TrendingUp, TrendingDown, CheckCircle2, FileSpreadsheet, 
  Eye, RefreshCw, X, ArrowUpRight, ChevronRight, Calendar, Store,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function AdminRekapView({ onShowToast }) {
  const currentMonthCode = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  
  // Mode: 'bulanan' (Per Periode Bulan) vs 'kantin' (Per Unit Usaha Semua Bulan)
  const [viewMode, setViewMode] = useState('bulanan');

  // --- State Mode Per Bulan ---
  const [selectedMonth, setSelectedMonth] = useState(currentMonthCode);
  const [recapData, setRecapData] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');

  // --- State Mode Per Kantin ---
  const [kiosksList, setKiosksList] = useState([]);
  const [selectedKioskId, setSelectedKioskId] = useState('');
  const [yearlyData, setYearlyData] = useState(null);
  const [loadingYearly, setLoadingYearly] = useState(false);

  // --- State Modal Detail Harian ---
  const [detailKiosk, setDetailKiosk] = useState(null);
  const [detailMonth, setDetailMonth] = useState('');
  const [kioskHistory, setKioskHistory] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Master Kiosks for Per-Kantin pills
  const fetchKiosks = async () => {
    try {
      const res = await apiFetch('/kiosks');
      if (res.success && res.data?.length > 0) {
        setKiosksList(res.data);
        if (!selectedKioskId) {
          setSelectedKioskId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Rekap Per Bulan
  const fetchRecapMonth = async (month, isRefresh = false) => {
    try {
      setLoadingMonth(true);
      if (isRefresh) setRecapData(null);

      const [res] = await Promise.all([
        apiFetch(`/recap/admin/monthly?month=${month}`),
        new Promise((r) => setTimeout(r, 400))
      ]);

      if (res.success) {
        setRecapData(res);
      }
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal memuat data rekap bulanan.', 'error');
    } finally {
      setLoadingMonth(false);
    }
  };

  // Fetch Rekap Per Kantin (Yearly - Semua Bulan)
  const fetchRecapKioskYearly = async (kioskId, isRefresh = false) => {
    if (!kioskId) return;
    try {
      setLoadingYearly(true);
      if (isRefresh) setYearlyData(null);

      const [res] = await Promise.all([
        apiFetch(`/recap/admin/kiosk/${kioskId}/yearly`),
        new Promise((r) => setTimeout(r, 400))
      ]);

      if (res.success) {
        setYearlyData(res);
      }
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal memuat rekap unit usaha tahunan.', 'error');
    } finally {
      setLoadingYearly(false);
    }
  };

  const fetchSheetsUrl = async () => {
    try {
      const res = await apiFetch('/recap/sheets-url');
      if (res.success && res.sheetsUrl) {
        setSheetsUrl(res.sheetsUrl);
      }
    } catch {}
  };

  useEffect(() => {
    fetchKiosks();
    fetchSheetsUrl();
  }, []);

  useEffect(() => {
    if (viewMode === 'bulanan') {
      fetchRecapMonth(selectedMonth);
    } else if (viewMode === 'kantin' && selectedKioskId) {
      fetchRecapKioskYearly(selectedKioskId);
    }
  }, [viewMode, selectedMonth, selectedKioskId]);

  const handleSyncSheets = async () => {
    try {
      setSyncing(true);
      const res = await apiFetch(`/recap/sync-sheets?month=${selectedMonth}`, {
        method: 'POST'
      });
      if (res.success) {
        onShowToast?.('Data berhasil disinkronkan ke Google Spreadsheet!', 'success');
        if (res.sheetsUrl) setSheetsUrl(res.sheetsUrl);
      }
    } catch (err) {
      onShowToast?.(err.message || 'Gagal sinkronisasi ke Google Sheets.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Buka Modal Riwayat Harian
  const handleViewDetail = async (kioskObj, monthCode) => {
    const m = monthCode || selectedMonth;
    const kId = kioskObj.kiosk_id || kioskObj.id;
    setDetailKiosk(kioskObj);
    setDetailMonth(m);
    setLoadingDetail(true);
    try {
      const res = await apiFetch(`/recap/admin/kiosk/${kId}?month=${m}`);
      if (res.success) {
        setKioskHistory(res);
      }
    } catch (err) {
      onShowToast?.('Gagal memuat riwayat harian kios.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const summaryMonth = recapData?.summary || {
    total_kios: 0,
    total_target: 0,
    total_setoran: 0,
    persentase_tercapai: 0,
    jumlah_lunas_surplus: 0,
    jumlah_kurang: 0
  };

  const monthsAvailable = [
    { code: '2026-08', label: 'Agustus 2026' },
    { code: '2026-07', label: 'Juli 2026' },
    { code: '2026-06', label: 'Juni 2026' },
    { code: '2026-05', label: 'Mei 2026' },
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* View Mode Toggle Pill Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 rounded-full border border-slate-200 shadow-xs">
        <button
          onClick={() => setViewMode('bulanan')}
          className={`py-2 px-3 rounded-full font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'bulanan'
              ? 'btn-emerald-brand shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Rekap Per Bulan</span>
        </button>

        <button
          onClick={() => setViewMode('kantin')}
          className={`py-2 px-3 rounded-full font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'kantin'
              ? 'btn-emerald-brand shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Rekap Per Kantin</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: REKAP PER BULAN (Semua Kantin di Bulan Terpilih) */}
      {/* ========================================================================= */}
      {viewMode === 'bulanan' && (
        <>
          {/* Month Selector Pills */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {monthsAvailable.map((m) => (
                <button
                  key={m.code}
                  onClick={() => setSelectedMonth(m.code)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                    selectedMonth === m.code
                      ? 'btn-emerald-brand border-transparent shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchRecapMonth(selectedMonth, true)}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs flex items-center justify-center transition-colors shrink-0"
              title="Segarkan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMonth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Skeleton or Content */}
          {loadingMonth && !recapData ? (
            <div className="space-y-4">
              <div className="rounded-3xl p-6 space-y-4 skeleton-shimmer border border-slate-200 shadow-sm">
                <div className="w-48 h-9 rounded-2xl bg-slate-300/70" />
                <div className="w-full h-2.5 rounded-full bg-slate-300/70" />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div className="h-12 rounded-2xl bg-slate-300/70" />
                  <div className="h-12 rounded-2xl bg-slate-300/70" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3">
                    <div className="w-36 h-4 rounded-full skeleton-shimmer" />
                    <div className="w-full h-2 rounded-full skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Hero Recap Card (Prestigious Forest Emerald) */}
              <div className="card-hero-emerald rounded-3xl p-6 space-y-4 shadow-elevated">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-emerald-200 uppercase flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-emerald-300" />
                    Rekap: {recapData?.bulan_label || formatMonthLabel(selectedMonth)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/15 text-white">
                    {summaryMonth.total_kios} Unit Usaha
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-black font-financial tracking-tight text-white">
                    {formatRupiah(summaryMonth.total_setoran)}
                  </div>
                  <p className="text-xs font-medium text-emerald-100/90 mt-0.5">
                    Target Akad: <span className="font-bold text-white">{formatRupiah(summaryMonth.total_target)}</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-100">Target Tercapai</span>
                    <span className="text-emerald-300 font-financial">{summaryMonth.persentase_tercapai}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-emerald-300 rounded-full transition-all duration-500"
                      style={{ width: `${summaryMonth.persentase_tercapai}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-100/80 font-semibold block">Lunas / Surplus</span>
                      <span className="text-xs font-extrabold text-white font-financial">{summaryMonth.jumlah_lunas_surplus} Unit</span>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                      <TrendingDown className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-100/80 font-semibold block">Belum Lunas</span>
                      <span className="text-xs font-extrabold text-white font-financial">{summaryMonth.jumlah_kurang} Unit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Spreadsheet Sync Card */}
              <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Google Spreadsheet BPH
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Format tabel bulanan &amp; ringkasan eksekutif.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSyncSheets}
                    disabled={syncing}
                    className="px-4 py-2 rounded-full btn-emerald-brand text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Sync...' : 'Sync'}</span>
                  </button>
                  {sheetsUrl && (
                    <a
                      href={sheetsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all"
                      title="Buka Spreadsheet di Tab Baru"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Kiosk Breakdown List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Rincian Per Unit Usaha ({formatMonthLabel(selectedMonth)})
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {recapData?.data?.length || 0} Unit
                  </span>
                </div>

                {(recapData?.data || []).map((kiosk) => {
                  const isSurplus = kiosk.status === 'surplus';
                  const isKurang = kiosk.status === 'kurang';
                  const progress = kiosk.progress_percent || 0;

                  return (
                    <div
                      key={kiosk.kiosk_id}
                      className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card space-y-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {kiosk.nama_kantin}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Penyewa: <span className="text-slate-800 font-semibold">{kiosk.nama_penyewa || '-'}</span>
                          </p>
                        </div>

                        {isSurplus ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            Surplus +{formatRupiah(kiosk.selisih)}
                          </span>
                        ) : isKurang ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            Kurang {formatRupiah(Math.abs(kiosk.selisih))}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Lunas Pas
                          </span>
                        )}
                      </div>

                      {/* Progress & Numbers */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="font-financial text-slate-900">
                            {formatRupiah(kiosk.total_setor)}
                            <span className="font-normal text-slate-500"> / {formatRupiah(kiosk.tarif_sewa)}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-900">{progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isSurplus ? 'bg-emerald-500' : isKurang ? 'bg-amber-500' : 'bg-emerald-800'
                            }`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-0.5 flex justify-end">
                        <button
                          onClick={() => handleViewDetail(kiosk, selectedMonth)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Riwayat Harian</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: REKAP PER KANTIN (Satu Kantin, Seluruh Periode Bulan)             */}
      {/* ========================================================================= */}
      {viewMode === 'kantin' && (
        <>
          {/* Kiosks Horizontal Selector Pills */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {kiosksList.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKioskId(k.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                    selectedKioskId === k.id
                      ? 'btn-emerald-brand border-transparent shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {k.nama_kantin}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchRecapKioskYearly(selectedKioskId, true)}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs flex items-center justify-center transition-colors shrink-0"
              title="Segarkan Data Kantin"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingYearly ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Skeleton or Yearly Content */}
          {loadingYearly && !yearlyData ? (
            <div className="space-y-4">
              <div className="rounded-3xl p-6 space-y-4 skeleton-shimmer border border-slate-200 shadow-sm">
                <div className="w-48 h-9 rounded-2xl bg-slate-300/70" />
                <div className="w-full h-2.5 rounded-full bg-slate-300/70" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3">
                    <div className="w-36 h-4 rounded-full skeleton-shimmer" />
                    <div className="w-full h-2 rounded-full skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Hero Card Kantin Terpilih (Ultra-Compact FinTech Layout) */}
              <div className="card-hero-emerald rounded-3xl p-4 sm:p-5 space-y-3 shadow-elevated">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-200 uppercase flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-300" />
                    {yearlyData?.kiosk?.nama_kantin}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/10 backdrop-blur-xs">
                    Penyewa: {yearlyData?.kiosk?.nama_penyewa || '-'}
                  </span>
                </div>

                {/* Total Setoran Display */}
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-200/80 tracking-wide uppercase block">
                    Total Setoran Terkumpul
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-financial tracking-tight text-white whitespace-nowrap">
                    {formatRupiah(yearlyData?.summary_akumulasi?.total_setor)}
                  </div>
                  <p className="text-[11px] text-emerald-100/85 font-medium">
                    Target Kewajiban: <span className="font-bold text-white font-financial">{formatRupiah(yearlyData?.summary_akumulasi?.total_target)}</span>
                  </p>
                </div>

                {/* Slim Modern Progress Bar */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-100 font-medium">Ketercapaian Target</span>
                    <span className="text-emerald-300 font-financial font-extrabold">
                      {yearlyData?.summary_akumulasi?.persentase_tercapai}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${yearlyData?.summary_akumulasi?.persentase_tercapai}%` }}
                    />
                  </div>
                </div>

                {/* 3 Dedicated Distinct Elements (Full Saldo Ribbon + 2 Stat Tiles) */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {/* Element 1: Saldo Bersih Banner (Full Width, Never Truncates) */}
                  <div className={`p-3 rounded-2xl border backdrop-blur-xs flex items-center justify-between gap-2.5 ${
                    (yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0
                      ? 'bg-emerald-400/20 border-emerald-300/30'
                      : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0
                      ? 'bg-rose-500/20 border-rose-300/30'
                      : 'bg-white/10 border-white/15'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        (yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0
                          ? 'bg-emerald-400/30 text-emerald-200'
                          : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0
                          ? 'bg-rose-400/30 text-rose-200'
                          : 'bg-white/20 text-white'
                      }`}>
                        {(yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/80 block">
                          {(yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0
                            ? 'Saldo Surplus'
                            : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0
                            ? 'Sisa Tunggakan'
                            : 'Status Saldo'}
                        </span>
                        <span className={`text-xs sm:text-sm font-black font-financial ${
                          (yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0
                            ? 'text-emerald-300'
                            : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0
                            ? 'text-rose-300'
                            : 'text-white'
                        }`}>
                          {(yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0
                            ? `+${formatRupiah(yearlyData?.summary_akumulasi?.saldo_bersih)}`
                            : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0
                            ? `-${formatRupiah(Math.abs(yearlyData?.summary_akumulasi?.saldo_bersih))}`
                            : 'Lunas Pas (Rp 0)'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      (yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0
                        ? 'bg-emerald-400/30 text-emerald-200'
                        : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0
                        ? 'bg-rose-400/30 text-rose-200'
                        : 'bg-white/20 text-white'
                    }`}>
                      {(yearlyData?.summary_akumulasi?.saldo_bersih || 0) > 0 ? 'Surplus' : (yearlyData?.summary_akumulasi?.saldo_bersih || 0) < 0 ? 'Tunggakan' : 'Lunas'}
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
                          {yearlyData?.summary_akumulasi?.bulan_lunas || 0} Bulan
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
                          {yearlyData?.summary_akumulasi?.bulan_belum || 0} Bulan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Months Breakdown for This Kiosk */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Histori Seluruh Bulan ({yearlyData?.data?.length || 0} Periode)
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    Tarif: {formatRupiah(yearlyData?.kiosk?.tarif_sewa)}/bln
                  </span>
                </div>

                {(yearlyData?.data || []).map((m) => {
                  const isSurplus = (m.surplus || 0) > 0 || (m.selisih || 0) > 0;
                  const isLunasMurni = m.selisih === 0;
                  const isLunasKompensasi = m.status_kompensasi === 'lunas_kompensasi';
                  const progress = m.progress_percent || 0;

                  return (
                    <div
                      key={m.bulan_code}
                      className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card space-y-3 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {m.bulan_label}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {m.hari_aktif} hari setor &bull; {m.hari_libur} hari libur
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
                        </div>
                      </div>

                      {/* Keterangan Kompensasi Surplus jika ada */}
                      {isLunasKompensasi && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Setoran {formatRupiah(m.total_setor)} (kurang {formatRupiah(m.kekurangan)}), lunas ditutup kompensasi surplus.</span>
                        </div>
                      )}

                      {/* Progress & Numbers */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="font-financial text-slate-900">
                            {formatRupiah(m.total_setor)}
                            <span className="font-normal text-slate-500"> / {formatRupiah(m.tarif_sewa)}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-900">{progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (isSurplus || isLunasMurni || isLunasKompensasi) ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-0.5 flex justify-end">
                        <button
                          onClick={() => handleViewDetail(yearlyData.kiosk, m.bulan_code)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Riwayat Harian</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL RIWAYAT HARIAN (Fixed: Reads both .riwayat and .data)               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {detailKiosk && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              onClick={() => setDetailKiosk(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 max-h-[85vh] overflow-y-auto no-scrollbar space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Riwayat Kalender Harian
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {detailKiosk.nama_kantin}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periode: <span className="font-bold text-slate-800">{formatMonthLabel(detailMonth)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setDetailKiosk(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="p-8 text-center text-xs text-slate-500">Memuat rincian setoran harian...</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {/* Fixed bug: Read kioskHistory?.riwayat OR kioskHistory?.data */}
                  {((kioskHistory?.riwayat || kioskHistory?.data || []).length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      Tidak ada catatan setoran untuk periode ini.
                    </div>
                  ) : (
                    (kioskHistory?.riwayat || kioskHistory?.data || []).map((dep, idx) => (
                      <div
                        key={dep.id || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {formatIndoDate(dep.tanggal)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {dep.status === 'libur' ? 'Libur / Tutup' : `${dep.metode || 'Tunai'} • ${dep.waktu || ''} WIB`}
                            {dep.catatan && <span className="block text-[10px] text-slate-400 italic mt-0.5">&ldquo;{dep.catatan}&rdquo;</span>}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-financial font-extrabold text-xs sm:text-sm ${
                              dep.status === 'libur' ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {dep.status === 'libur' ? 'Rp 0' : `+${formatRupiah(dep.nominal)}`}
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
