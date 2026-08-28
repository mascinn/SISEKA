import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah, getTodayFormatted } from '../utils/api';
import { Search, CheckCircle2, Coffee, Clock, Edit2, Share2, Copy, RefreshCw } from 'lucide-react';
import DepositModal from '../components/DepositModal';
import EditDepositModal from '../components/EditDepositModal';

export default function AdminPenarikanView({ onShowToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');

  const [selectedKiosk, setSelectedKiosk] = useState(null);
  const [editingDeposit, setEditingDeposit] = useState(null);

  const fetchTodayData = async (isRefresh = false) => {
    try {
      setLoading(true);
      if (isRefresh) setData(null); // Clear data so full skeleton shimmers on manual refresh

      const [res] = await Promise.all([
        apiFetch('/deposits/today'),
        new Promise((resolve) => setTimeout(resolve, 400)) // 400ms smooth shimmer buffer
      ]);

      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
      onShowToast?.('Gagal memuat data penarikan hari ini.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
  }, []);

  const handleRecordDeposit = async (payload) => {
    try {
      const res = await apiFetch('/deposits', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        onShowToast?.('Setoran berhasil dicatat!', 'success');
        fetchTodayData();
      }
    } catch (err) {
      onShowToast?.(err.message || 'Gagal mencatat setoran.', 'error');
      throw err;
    }
  };

  const handleEditDeposit = async (depositId, payload) => {
    try {
      const res = await apiFetch(`/deposits/${depositId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        onShowToast?.('Setoran berhasil dikoreksi!', 'success');
        fetchTodayData();
      }
    } catch (err) {
      onShowToast?.(err.message || 'Gagal mengoreksi setoran.', 'error');
      throw err;
    }
  };

  const handleDeleteDeposit = async (depositId) => {
    try {
      const res = await apiFetch(`/deposits/${depositId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        onShowToast?.('Setoran berhasil dibatalkan.', 'info');
        fetchTodayData();
      }
    } catch (err) {
      onShowToast?.(err.message || 'Gagal membatalkan setoran.', 'error');
      throw err;
    }
  };

  const generateWAReport = () => {
    if (!data?.data) return '';
    const today = getTodayFormatted();
    const total = data.summary?.total_kas_hari_ini || 0;

    let msg = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
    msg += `*Laporan Setoran Harian Kantin Masjid Al-Wasi'i*\n`;
    msg += `📅 ${today}\n\n`;
    msg += `*Rincian Setoran:*\n`;

    data.data.forEach((k, i) => {
      if (k.deposit_status === 'setor') {
        msg += `${i + 1}. *${k.nama_kantin}*: ${formatRupiah(k.nominal)} (${k.metode || 'Tunai'})\n`;
      } else if (k.deposit_status === 'libur') {
        msg += `${i + 1}. *${k.nama_kantin}*: _Tutup / Libur_\n`;
      } else {
        msg += `${i + 1}. *${k.nama_kantin}*: _Belum Disetor_\n`;
      }
    });

    msg += `\n*Total Kas Terkumpul: ${formatRupiah(total)}*\n\n`;
    msg += `Terima kasih atas kerja samanya.\n`;
    msg += `*Badan Pengelola Harian (BPH) Masjid Al-Wasi'i*`;
    return msg;
  };

  const handleShareWA = () => {
    const text = encodeURIComponent(generateWAReport());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyWA = () => {
    navigator.clipboard.writeText(generateWAReport());
    onShowToast?.('Teks laporan WhatsApp berhasil disalin!', 'success');
  };

  const kiosksList = (data?.data || []).filter((k) => {
    const matchesFilter =
      filter === 'semua' ||
      (filter === 'belum' && k.deposit_status === 'belum') ||
      (filter === 'setor' && k.deposit_status === 'setor') ||
      (filter === 'libur' && k.deposit_status === 'libur');

    const matchesSearch =
      !search ||
      k.nama_kantin.toLowerCase().includes(search.toLowerCase()) ||
      (k.nama_penyewa && k.nama_penyewa.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const summary = data?.summary || {
    total_kas_hari_ini: 0,
    total_kios: 0,
    total_dicatat: 0,
    total_setor: 0,
    total_libur: 0,
    total_belum: 0,
    progress_percent: 0
  };

  // FULL SKELETON SHIMMER VIEW
  if (loading && !data) {
    return (
      <div className="space-y-4 pb-24">
        {/* Skeleton Hero Card */}
        <div className="rounded-3xl p-6 space-y-4 skeleton-shimmer border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="w-32 h-3.5 rounded-full bg-slate-300/70" />
            <div className="w-8 h-8 rounded-full bg-slate-300/70" />
          </div>
          <div className="w-52 h-9 rounded-2xl bg-slate-300/70" />
          <div className="w-36 h-3 rounded-full bg-slate-300/70" />
          <div className="w-full h-2.5 rounded-full bg-slate-300/70" />
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80">
            <div className="h-12 rounded-2xl bg-slate-300/70" />
            <div className="h-12 rounded-2xl bg-slate-300/70" />
            <div className="h-12 rounded-2xl bg-slate-300/70" />
          </div>
        </div>

        {/* Skeleton Search & Filter */}
        <div className="w-full h-10 rounded-full skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="w-20 h-7 rounded-full skeleton-shimmer" />
          <div className="w-20 h-7 rounded-full skeleton-shimmer" />
          <div className="w-20 h-7 rounded-full skeleton-shimmer" />
        </div>

        {/* Skeleton Kiosks List */}
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl skeleton-shimmer shrink-0" />
                <div className="space-y-2">
                  <div className="w-36 h-3.5 rounded-full skeleton-shimmer" />
                  <div className="w-24 h-2.5 rounded-full skeleton-shimmer" />
                </div>
              </div>
              <div className="w-16 h-8 rounded-full skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Hero Card: Prestigious Emerald Gradient (Super Rounded-3xl) */}
      <div className="card-hero-emerald rounded-3xl p-6 space-y-4 shadow-elevated">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-emerald-200 uppercase">
            Kas Setoran Hari Ini
          </span>
          <button
            onClick={() => fetchTodayData(true)}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shadow-xs"
            title="Perbarui Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-black font-financial tracking-tight text-white">
            {formatRupiah(summary.total_kas_hari_ini)}
          </div>
          <p className="text-xs font-medium text-emerald-100/90 mt-1">
            {getTodayFormatted()}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-100">Pencatatan Unit Usaha</span>
            <span className="text-emerald-300 font-financial">{summary.total_dicatat} / {summary.total_kios} Unit ({summary.progress_percent}%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${summary.progress_percent}%` }}
            />
          </div>
        </div>

        {/* Mini Counter Stats */}
        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/15 text-center">
          <div className="bg-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] text-emerald-100/80 font-semibold block">Sudah Setor</span>
            <span className="text-sm font-extrabold text-emerald-300 font-financial">{summary.total_setor} Unit</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] text-emerald-100/80 font-semibold block">Libur/Tutup</span>
            <span className="text-sm font-extrabold text-amber-300 font-financial">{summary.total_libur} Unit</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] text-emerald-100/80 font-semibold block">Belum Dicatat</span>
            <span className="text-sm font-extrabold text-rose-300 font-financial">{summary.total_belum} Unit</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Ready-to-Send Banner */}
      {summary.total_dicatat > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">
                Laporan WhatsApp
              </h4>
              <p className="text-[11px] text-slate-500">
                {summary.total_dicatat === summary.total_kios ? 'Semua unit usaha selesai dicatat.' : `${summary.total_dicatat} unit sudah siap dilaporkan.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyWA}
              className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all"
              title="Salin Teks WA"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleShareWA}
              className="px-4 py-2 rounded-full btn-emerald-brand text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Kirim WA</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari kantin atau nama pedagang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-800 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'semua', label: `Semua (${summary.total_kios})` },
            { id: 'belum', label: `Belum (${summary.total_belum})` },
            { id: 'setor', label: `Setor (${summary.total_setor})` },
            { id: 'libur', label: `Libur (${summary.total_libur})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                filter === tab.id
                  ? 'btn-emerald-brand border-transparent shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kiosk Cards List */}
      <div className="space-y-2.5">
        {kiosksList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
            Tidak ada unit usaha yang cocok.
          </div>
        ) : (
          kiosksList.map((kiosk) => {
            const isSetor = kiosk.deposit_status === 'setor';
            const isLibur = kiosk.deposit_status === 'libur';
            const isBelum = kiosk.deposit_status === 'belum';

            return (
              <div
                key={kiosk.id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-card flex items-center justify-between transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSetor
                        ? 'bg-emerald-50 text-emerald-700'
                        : isLibur
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isSetor ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isLibur ? (
                      <Coffee className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {kiosk.nama_kantin}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {kiosk.nama_penyewa || '-'}
                      {isSetor && (
                        <span className="text-[11px] font-semibold text-emerald-700 ml-1">
                          &bull; {kiosk.waktu} WIB ({kiosk.metode || 'Tunai'})
                        </span>
                      )}
                      {isLibur && (
                        <span className="text-[11px] font-semibold text-amber-700 ml-1">
                          &bull; Tutup / Libur
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  {isBelum ? (
                    <button
                      onClick={() => setSelectedKiosk(kiosk)}
                      className="px-4 py-2 rounded-full btn-emerald-brand font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      Catat
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-financial font-black text-xs sm:text-sm ${
                          isSetor ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isSetor ? `+${formatRupiah(kiosk.nominal)}` : 'Rp 0'}
                      </span>
                      <button
                        onClick={() => setEditingDeposit(kiosk)}
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                        title="Edit Catatan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Deposit Modal */}
      <DepositModal
        isOpen={Boolean(selectedKiosk)}
        kiosk={selectedKiosk}
        onClose={() => setSelectedKiosk(null)}
        onSubmit={handleRecordDeposit}
      />

      {/* Edit Deposit Modal */}
      <EditDepositModal
        isOpen={Boolean(editingDeposit)}
        deposit={editingDeposit}
        onClose={() => setEditingDeposit(null)}
        onSubmit={handleEditDeposit}
        onDelete={handleDeleteDeposit}
      />
    </div>
  );
}
