import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavbarTop({ onOpenProfile }) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-3 z-30 px-3.5 pointer-events-none mb-1">
      <div className="max-w-md mx-auto pointer-events-auto relative">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full pl-2.5 pr-2.5 py-1.5 shadow-sm flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-brand flex items-center justify-center shadow-xs shrink-0">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                SISEKA WASI'I
              </h1>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">
                Sistem Informasi Setoran Sewa Kantin
              </p>
            </div>
          </div>

          {/* User Profile Direct Circle Button (Tanpa Wadah Luar) */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full bg-emerald-brand text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-emerald-800/30 transition-all active:scale-95 shrink-0"
              title="Menu Akun"
            >
              {user?.initials || (isAdmin ? 'BP' : 'TN')}
            </button>

            {/* Dropdown Menu Popup */}
            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    onClick={() => setShowMenu(false)}
                    className="fixed inset-0 z-40"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 space-y-1"
                  >
                    {/* User Info Header */}
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user?.name || 'Pengguna'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {isAdmin ? "Pengurus BPH • Admin" : (user?.kios_nama || "Mitra Penyewa")}
                      </p>
                    </div>

                    {/* Menu Item: Profil */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onOpenProfile();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Lihat Profil Akun</span>
                    </button>

                    {/* Menu Item: Keluar (Merah) */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
