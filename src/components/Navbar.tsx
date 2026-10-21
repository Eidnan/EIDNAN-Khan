import React from 'react';
import { Sparkles, Radio, Mic, Globe, ExternalLink, ShieldCheck, Key } from 'lucide-react';
import { AdminContactLink } from './AdminContactLink';

interface NavbarProps {
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  isUnlocked?: boolean;
  onLock?: () => void;
  activeTab?: 'studio' | 'dubbing';
  setActiveTab?: (tab: 'studio' | 'dubbing') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  setLang,
  isUnlocked = true,
  onLock,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 liquid-glass border-b border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand identity - The Boring Voice Studio with Liquid Glass glow */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <a href="#" className="group flex items-center space-x-2 text-decoration-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bfa065] group-hover:scale-125 transition-transform shadow-[0_0_12px_rgba(191,160,101,0.8)]" />
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-base sm:text-lg font-bold tracking-tight text-[#0f172a]">
                The Boring
              </span>
              <span className="font-editorial text-sm sm:text-base italic text-[#bfa065]">
                {lang === 'bn' ? 'ভয়েস স্টুডিও' : 'Voice Studio'}
              </span>
            </div>
          </a>

          {/* Quick tab switcher inside Navbar */}
          {setActiveTab && (
            <div className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bangla font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'studio'
                    ? 'bg-white text-[#0f172a] shadow-xs font-bold'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                🎙️ {lang === 'bn' ? 'ভয়েস স্টুডিও' : 'Studio'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dubbing')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'dubbing'
                    ? 'bg-white text-[#0f172a] shadow-xs font-bold'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                🌐 {lang === 'bn' ? 'ভয়েস ডাবিং (৪ ভাষা)' : 'Dubbing (4 Langs)'}
              </button>
            </div>
          )}
          {/* Micro status badge */}
          <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full liquid-glass-pill text-[11px] font-mono-code text-[#64748b]">
            <span className="text-[#bfa065]">006</span>
            <span>·</span>
            <span>{lang === 'bn' ? 'প্রমিত বাংলা স্টুডিও' : 'PRO BENGALI STUDIO'}</span>
          </span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Status info pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-mono-code text-[#475569]">
            <span className="text-[#10b981] animate-pulse">●</span>
            <span>{lang === 'bn' ? 'সক্রিয় ইঞ্জিন' : 'Engine Ready'}</span>
          </div>

          {/* Admin Contact Link with EIDNAN Khan's Picture in Liquid Glass */}
          <AdminContactLink variant="navbar" lang={lang} />

          {/* Lock Studio Session toggle if onLock provided */}
          {onLock && isUnlocked && (
            <button
              onClick={onLock}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl liquid-glass text-xs font-mono-code text-[#64748b] hover:text-[#0f172a] border border-slate-200/80 hover:border-slate-300 transition-colors cursor-pointer"
              title={lang === 'bn' ? 'স্টুডিও লক করুন' : 'Lock Studio'}
            >
              <span className="text-[11px]">{lang === 'bn' ? '🔒 লক' : '🔒 Lock'}</span>
            </button>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl liquid-glass text-xs font-mono-code text-[#475569] hover:text-[#0f172a] border border-slate-200/80 hover:border-slate-300 transition-colors cursor-pointer"
            title="Toggle Language"
          >
            <Globe className="w-3 h-3 text-[#bfa065]" />
            <span className="text-[11px] font-bold">{lang === 'bn' ? 'EN' : 'বাং'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
