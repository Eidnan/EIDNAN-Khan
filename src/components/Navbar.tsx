import React from 'react';
import { Sparkles, Radio, Mic, Globe, ExternalLink, ShieldCheck, Key } from 'lucide-react';
import { AdminContactLink } from './AdminContactLink';

interface NavbarProps {
  currentTab: 'studio' | 'live';
  setCurrentTab: (tab: 'studio' | 'live') => void;
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  onOpenPasscodeModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  onOpenPasscodeModal,
}) => {
  const reqId = typeof window !== 'undefined' ? localStorage.getItem('eidnan_req_id') : null;
  const isUnlocked = typeof window !== 'undefined' && localStorage.getItem('eidnan_voice_unlocked') === 'true';

  return (
    <header className="sticky top-0 z-40 liquid-glass border-b border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand identity - TheBoringBlog typographic style with Liquid Glass glow */}
        <div className="flex items-center space-x-3.5">
          <a href="#" className="group flex items-center space-x-2 text-decoration-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bfa065] group-hover:scale-125 transition-transform shadow-[0_0_12px_rgba(191,160,101,0.8)]" />
            <div className="flex items-baseline space-x-1.5">
              <span className="font-editorial text-base sm:text-lg font-bold tracking-tight text-[#0f172a]">
                EIDNAN
              </span>
              <span className="font-editorial text-sm sm:text-base italic text-[#bfa065]">
                {lang === 'bn' ? 'ভয়েসস্টুডিও' : 'Voice Studio'}
              </span>
            </div>
          </a>

          {/* Micro status badge */}
          <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full liquid-glass-pill text-[11px] font-mono-code text-[#64748b]">
            <span className="text-[#bfa065]">006</span>
            <span>·</span>
            <span>PRO 3.8</span>
          </span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Navigation Tab Switcher with Liquid Glass Styling */}
          <div className="flex items-center p-1 rounded-xl liquid-glass border border-slate-200/80">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'studio'
                  ? 'liquid-glass-button text-[#0f172a] shadow-sm font-semibold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${currentTab === 'studio' ? 'text-[#bfa065]' : ''}`} />
              <span className="font-bangla">{lang === 'bn' ? 'স্টুডিও' : 'Studio'}</span>
            </button>

            <button
              onClick={() => setCurrentTab('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'live'
                  ? 'liquid-glass-button text-[#0f172a] shadow-sm font-semibold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${currentTab === 'live' ? 'text-[#bfa065]' : ''}`} />
              <span className="font-bangla">{lang === 'bn' ? 'লাইভ AI' : 'Live AI'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#bfa065] animate-pulse" />
            </button>
          </div>

          {/* Status info pill */}
          {isUnlocked ? (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-mono-code text-[#475569]">
              <span className="text-[#10b981] animate-pulse">●</span>
              <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
            </div>
          ) : reqId ? (
            <button
              onClick={onOpenPasscodeModal}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-mono-code text-[#926b20] hover:border-[#bfa065]/50 transition cursor-pointer"
              title="Click to enter passcode"
            >
              <Key className="w-3 h-3 text-[#bfa065]" />
              <span>{reqId}</span>
            </button>
          ) : null}

          {/* Admin Contact Link with EIDNAN Khan's Picture in Liquid Glass */}
          <AdminContactLink variant="navbar" lang={lang} />

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
