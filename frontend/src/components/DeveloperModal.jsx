import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Code, ExternalLink, Mail } from 'lucide-react';

export default function DeveloperModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Tentang Pengembang
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hero Developer Card */}
          <div className="card-hero-emerald rounded-3xl p-5 text-center space-y-3 relative overflow-hidden shadow-elevated">
            <div className="w-16 h-16 rounded-full bg-white text-emerald-900 flex items-center justify-center font-black text-2xl mx-auto shadow-md border-2 border-emerald-300">
              M
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Makhasin Muhammad
              </h3>
              <p className="text-xs font-semibold text-emerald-200 mt-0.5">
                @mascinnn &bull; Full-Stack Developer
              </p>
            </div>
            <p className="text-xs text-emerald-100/90 italic leading-relaxed px-2">
              &ldquo;Mengembangkan aplikasi web dan sistem informasi untuk mempermudah tata kelola secara digital.&rdquo;
            </p>

            {/* Social Connect Buttons */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {/* GitHub */}
              <a
                href="https://github.com/mascinn"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-900 flex items-center justify-center shadow-xs transition-transform active:scale-95"
                title="GitHub: mascinn"
              >
                <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/mascinnn"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-rose-600 flex items-center justify-center shadow-xs transition-transform active:scale-95"
                title="Instagram: @mascinnn"
              >
                <svg className="w-4 h-4 fill-rose-600" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/mascinn"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-blue-600 flex items-center justify-center shadow-xs transition-transform active:scale-95"
                title="LinkedIn: mascinn"
              >
                <svg className="w-4 h-4 fill-blue-600" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* Email */}
              <a
                href="mailto:makhasinmuhammad03@gmail.com"
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-rose-600 flex items-center justify-center shadow-xs transition-transform active:scale-95"
                title="Email Developer"
              >
                <Mail className="w-4 h-4 text-rose-600" />
              </a>
            </div>
          </div>

          {/* Tech Stack Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              Teknologi &amp; Arsitektur SISEKA:
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">React 19 + Vite</span>
                <span className="text-[10px] text-slate-500">Modern SPA Frontend</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Turso LibSQL</span>
                <span className="text-[10px] text-slate-500">Cloud Distributed DB</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Node &amp; Express</span>
                <span className="text-[10px] text-slate-500">REST API Backend</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Google Sheets API</span>
                <span className="text-[10px] text-slate-500">Webhook Auto-Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
