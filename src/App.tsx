import React, { useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { EditorialHero } from './components/EditorialHero';
import { StudioVoiceover } from './components/StudioVoiceover';
import { LiveConversation } from './components/LiveConversation';
import { PasscodeGate } from './components/PasscodeGate';
import { AdminContactLink } from './components/AdminContactLink';
import { Radio, Lock, ShieldCheck, Layers, Sparkles, ExternalLink, MessageCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'live'>('studio');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('eidnan_voice_unlocked') === 'true'
  );
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);

  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const scrollToWorkspace = (tab?: 'studio' | 'live') => {
    if (tab) setCurrentTab(tab);
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

      {/* Passcode & Admin Approval Gate if locked or requested */}
      {(!isUnlocked || showPasscodeModal) && (
        <PasscodeGate
          lang={lang}
          onUnlock={() => {
            setIsUnlocked(true);
            setShowPasscodeModal(false);
          }}
        />
      )}

      {/* Top Navbar with Liquid Glass & Contact Link */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        onOpenPasscodeModal={() => setShowPasscodeModal(true)}
      />

      {/* Hero Section */}
      <EditorialHero
        lang={lang}
        onStartClick={() => scrollToWorkspace('studio')}
        onExploreWorkClick={() => scrollToWorkspace('studio')}
      />

      {/* Structured Studio Workspace with Liquid Glass Accents */}
      <section
        ref={workspaceRef}
        id="studio-workspace"
        className="relative z-10 border-t border-slate-200/80 pt-12 pb-20"
      >
        {/* Section Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-[#bfa065] text-xs font-mono-code uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#bfa065] shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
              <span>{lang === 'bn' ? 'স্টুডিও ওয়ার্কস্পেস' : 'Studio Workspace'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[#64748b]">006</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#0f172a]">
              {currentTab === 'studio'
                ? lang === 'bn'
                  ? 'ভয়েস জেনারেশন কনসোল'
                  : 'Voice Generation Console'
                : lang === 'bn'
                ? 'রিয়েল-টাইম লাইভ ভয়েস ইন্টারফেস'
                : 'Real-time Live Voice Interface'}
            </h2>
          </div>

          {/* Tab switcher pill in Liquid Glass */}
          <div className="flex items-center space-x-1.5 liquid-glass p-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <button
              onClick={() => setCurrentTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-bangla transition cursor-pointer ${
                currentTab === 'studio'
                  ? 'liquid-glass-button text-[#0f172a] shadow-sm font-semibold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              {lang === 'bn' ? '🎙️ ভয়েসঅভার স্টুডিও' : 'Studio Voiceover'}
            </button>
            <button
              onClick={() => setCurrentTab('live')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-bangla transition flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'live'
                  ? 'liquid-glass-button text-[#0f172a] shadow-sm font-semibold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <span>{lang === 'bn' ? '✨ লাইভ ভয়েস AI' : 'Live Voice AI'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#bfa065] animate-pulse" />
            </button>
          </div>
        </div>

        {/* Workspace Active View */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {currentTab === 'studio' ? (
            <StudioVoiceover lang={lang} />
          ) : (
            <LiveConversation lang={lang} />
          )}
        </div>
      </section>

      {/* Footer with Liquid Glass & Admin Contact Link with EIDNAN Khan's Picture */}
      <footer className="relative z-10 border-t border-slate-200/80 liquid-glass py-8 text-xs font-bangla text-[#64748b]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#bfa065] shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
            <span className="font-editorial text-sm font-semibold text-[#0f172a]">
              EIDNAN ভয়েসস্টুডিও
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-[#64748b]">
              {lang === 'bn'
                ? 'জেমিনি ৩.৮ লাইভ ও খাঁটি বাংলাদেশি টিটিএস'
                : 'Powered by Gemini 3.8 Live & Pure Bangladeshi TTS'}
            </span>
          </div>

          <div className="flex items-center space-x-4 font-mono-code text-[11px] text-[#6c7886]">
            {isUnlocked && (
              <button
                onClick={() => {
                  localStorage.removeItem('eidnan_voice_unlocked');
                  setIsUnlocked(false);
                }}
                className="text-[#bfa065] hover:text-[#d8c198] transition cursor-pointer"
                title="Lock Session"
              >
                {lang === 'bn' ? '[ লক করুন ]' : '[ Lock Studio ]'}
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
