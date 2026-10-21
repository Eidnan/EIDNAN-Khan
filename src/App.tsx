import React, { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { EditorialHero } from './components/EditorialHero';
import { StudioVoiceover } from './components/StudioVoiceover';
import { VoiceDubbing } from './components/VoiceDubbing';
import { PasscodeGate } from './components/PasscodeGate';
import { AdminContactLink } from './components/AdminContactLink';
import { Radio, Mic, Languages } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeTab, setActiveTab] = useState<'studio' | 'dubbing'>('studio');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eidnan_voice_unlocked') === 'true';
    }
    return false;
  });

  const handleLock = () => {
    localStorage.removeItem('eidnan_voice_unlocked');
    setIsUnlocked(false);
  };

  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const scrollToWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col relative selection:bg-[#bfa065]/20 selection:text-[#0f172a]">
      {/* Ambient Liquid Floating Light Spheres in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#bfa065]/10 blur-[120px] liquid-orb-1" />
        <div className="absolute top-1/2 -right-20 w-[600px] h-[600px] rounded-full bg-[#3b82f6]/8 blur-[140px] liquid-orb-2" />
        <div className="absolute bottom-20 left-10 w-[450px] h-[450px] rounded-full bg-[#ecf67d]/15 blur-[120px] liquid-orb-1" />
      </div>

      {/* Top Navbar with Liquid Glass & Contact Link */}
      <Navbar
        lang={lang}
        setLang={setLang}
        isUnlocked={isUnlocked}
        onLock={handleLock}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {!isUnlocked ? (
        <PasscodeGate onUnlock={() => setIsUnlocked(true)} lang={lang} />
      ) : (
        <>
          {/* Hero Section */}
          <EditorialHero
            lang={lang}
            onStartClick={() => {
              setActiveTab('studio');
              scrollToWorkspace();
            }}
            onExploreWorkClick={() => {
              setActiveTab('dubbing');
              scrollToWorkspace();
            }}
          />

      {/* Structured Studio Workspace with Liquid Glass Accents */}
      <section
        ref={workspaceRef}
        id="studio-workspace"
        className="relative z-10 border-t border-slate-200/80 pt-10 pb-20"
      >
        {/* Workspace Tab Switcher */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-[#bfa065] text-xs font-mono-code uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#bfa065] shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
              <span>{lang === 'bn' ? 'স্টুডিও ওয়ার্কস্পেস' : 'Studio Workspace'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[#64748b]">006</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#0f172a]">
              {activeTab === 'studio'
                ? lang === 'bn'
                  ? 'ভয়েস জেনারেশন কনসোল'
                  : 'Voice Generation Console'
                : lang === 'bn'
                  ? 'ভয়েস ডাবিং কনসোল'
                  : 'Voice Dubbing Console'}
            </h2>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex items-center p-1.5 rounded-2xl liquid-glass border border-slate-200/90 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bangla font-bold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white shadow-md'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${activeTab === 'studio' ? 'text-[#bfa065]' : ''}`} />
              <span>{lang === 'bn' ? '🎙️ প্রমিত ভয়েস' : '🎙️ Voice Studio'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dubbing')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bangla font-bold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'dubbing'
                  ? 'bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white shadow-md'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Languages className={`w-3.5 h-3.5 ${activeTab === 'dubbing' ? 'text-[#bfa065]' : ''}`} />
              <span>{lang === 'bn' ? '🌐 ভয়েস ডাবিং (৪ ভাষা)' : '🌐 Voice Dubbing'}</span>
            </button>
          </div>
        </div>

        {/* Workspace Active View */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {activeTab === 'studio' ? (
            <StudioVoiceover lang={lang} />
          ) : (
            <VoiceDubbing lang={lang} />
          )}
        </div>
      </section>
        </>
      )}

      {/* Footer with Liquid Glass & Admin Contact Link with Curator's Picture */}
      <footer className="relative z-10 border-t border-slate-200/80 liquid-glass py-8 text-xs font-bangla text-[#64748b]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#bfa065] shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
            <span className="font-editorial text-sm font-semibold text-[#0f172a]">
              The Boring Voice Studio
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-[#64748b]">
              {lang === 'bn'
                ? 'খাঁটি বাংলাদেশি প্রমিত বাংলা টিটিএস স্টুডিও'
                : 'Authentic Standard Bengali Voice Actor Studio'}
            </span>
          </div>

          <div className="flex items-center space-x-4 font-mono-code text-[11px] text-[#6c7886]">
            {isUnlocked && (
              <button
                onClick={handleLock}
                className="text-[#bfa065] hover:text-[#0f172a] transition cursor-pointer"
                title="Lock Studio"
              >
                {lang === 'bn' ? '[ 🔒 লক করুন ]' : '[ 🔒 Lock Studio ]'}
              </button>
            )}

            {/* Admin Contact Link with Photo in Footer */}
            <AdminContactLink variant="footer" lang={lang} />
          </div>
        </div>
      </footer>

      {/* Floating Liquid Glass Quick Contact Pill */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:block">
        <AdminContactLink variant="navbar" lang={lang} />
      </div>
    </div>
  );
}
