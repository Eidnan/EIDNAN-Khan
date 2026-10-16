import React from 'react';
import { Mic, Radio, Sparkles, Volume2, Globe } from 'lucide-react';

interface NavbarProps {
  currentTab: 'studio' | 'live';
  setCurrentTab: (tab: 'studio' | 'live') => void;
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a1010]/85 border-b border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-600 p-0.5 shadow-lg shadow-emerald-900/40">
            <div className="w-full h-full bg-[#080d0d] rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white font-bangla flex items-center space-x-1.5">
                <span className="text-amber-400 font-black tracking-wider">EIDNAN</span>
                <span>{lang === 'bn' ? 'ভয়েস স্টুডিও' : 'Voice Studio'}</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-emerald-200/60 font-bangla">
              {lang === 'bn'
                ? 'পেশাদার ভয়েস অ্যাক্টিং ও লাইভ রিয়েল-টাইম কনভারসেশন'
                : 'Cinematic Voice Narration & Real-time Live Voice AI'}
            </p>
          </div>
        </div>

        {/* Navigation tabs & Language switch */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center bg-[#101b1b] p-1 rounded-xl border border-emerald-800/40 shadow-inner">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'studio'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="font-bangla">
                {lang === 'bn' ? 'ভয়েসঅভার স্টুডিও' : 'Studio Voiceover'}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('live')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'live'
                  ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-md shadow-amber-950/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mic className="w-4 h-4 text-amber-300" />
              <span className="font-bangla flex items-center space-x-1">
                <span>{lang === 'bn' ? 'লাইভ ভয়েস AI' : 'Live Voice AI'}</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </span>
            </button>
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#111c1c] hover:bg-[#162424] text-xs font-semibold text-emerald-300 border border-emerald-800/40 transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
