// API Base URL Resolver
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : '/api';

// Formatting Utilities
export function formatRupiah(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAYS_NAME_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'
];

export function getTodayFormatted() {
  const now = new Date();
  const dayName = DAYS_NAME_ID[now.getDay()];
  const day = now.getDate();
  const month = MONTH_NAMES_ID[now.getMonth()];
  const year = now.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export function formatIndoFullDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayName = DAYS_NAME_ID[d.getDay()];
      const day = d.getDate();
      const month = MONTH_NAMES_ID[d.getMonth()];
      const year = d.getFullYear();
      return `${dayName}, ${day} ${month} ${year}`;
    }
  } catch {}
  return dateStr;
}

export function formatIndoDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const day = d.getDate();
      const month = MONTH_NAMES_ID[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch {}
  return dateStr;
}

export function formatMonthLabel(monthCode) {
  if (!monthCode) return 'Bulan Berjalan';
  const [y, m] = monthCode.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MONTH_NAMES_ID[idx] || m} ${y}`;
}

// Fetch wrapper with auth token
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('siseka_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request gagal (${res.status})`);
  }
  return data;
}
