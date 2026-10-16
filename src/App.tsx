import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { StudioVoiceover } from './components/StudioVoiceover';
import { LiveConversation } from './components/LiveConversation';
import { PasscodeGate } from './components/PasscodeGate';
import { Radio, Lock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'live'>('studio');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    () => localStorage.getItem('eidnan_voice_unlocked') === 'true'
  );

  return (
    <div className="min-h-screen bg-[#070b0b] text-[#e3ebe8] bg-islamic-pattern flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Dynamic Passcode & Admin Approval Gate if locked */}
      {!isUnlocked && (
        <PasscodeGate
          lang={lang}
          onUnlock={() => setIsUnlocked(true)}
        />
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {currentTab === 'studio' ? (
          <StudioVoiceover lang={lang} />
        ) : (
          <LiveConversation lang={lang} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/30 bg-[#060a0a] py-6 text-center text-xs text-zinc-500 font-bangla">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-emerald-400/70">
            <Radio className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn'
                ? 'EIDNAN ভয়েস স্টুডিও • জেমিনি ৩.৮ লাইভ ও টিটিএস মডেল দ্বারা চালিত'
                : 'EIDNAN Voice Studio • Powered by Gemini 3.8 Live & TTS Models'}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-zinc-400">
            {isUnlocked && (
              <button
                onClick={() => {
                  localStorage.removeItem('eidnan_voice_unlocked');
                  setIsUnlocked(false);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#142020] hover:bg-[#1a2c2c] text-amber-400 border border-amber-600/30 transition text-[11px]"
                title="Lock Session"
              >
                <Lock className="w-3 h-3" />
                <span>{lang === 'bn' ? 'লক করুন' : 'Lock Studio'}</span>
              </button>
            )}
            <span>24kHz Studio Audio</span>
            <span>•</span>
            <span>Admin Approval Gate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
