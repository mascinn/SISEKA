import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Wallet, BarChart3, Store, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminTabs = [
    { id: 'penarikan', label: 'Penarikan', icon: Wallet },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 },
    { id: 'kantin', label: 'Unit Usaha', icon: Store },
    { id: 'profil', label: 'Profil', icon: User }
  ];

  const tenantTabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'rekap', label: 'Rekap', icon: BarChart3 },
    { id: 'profil', label: 'Profil', icon: User }
  ];

  const tabs = isAdmin ? adminTabs : tenantTabs;

  return (
    <nav className="fixed bottom-3.5 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      <div className="pointer-events-auto">
        {/* Floating pill dock: comfortably sized, slightly fuller, perfectly centered */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full p-2 shadow-xl flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-full transition-all duration-150 ${
                  isActive
                    ? 'text-emerald-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePillIndicator"
                    className="absolute inset-0 bg-emerald-50 border border-emerald-200/80 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    isActive ? 'scale-105 text-emerald-800' : ''
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
