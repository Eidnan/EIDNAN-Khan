import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Lock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Camera,
  MessageCircle,
} from 'lucide-react';
import { AdminAvatar } from './AdminAvatar';
import { AdminProfileModal } from './AdminProfileModal';

interface PasscodeGateProps {
  onUnlock: () => void;
  lang: 'bn' | 'en';
}

// Ultra-Unique 8-character alphanumeric request ID generator
const generateUniqueRequestId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'REQ-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const PasscodeGate: React.FC<PasscodeGateProps> = ({
  onUnlock,
  lang,
}) => {
  const [requestId, setRequestId] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    let storedId = localStorage.getItem('eidnan_req_id');
    if (!storedId) {
      storedId = generateUniqueRequestId();
      localStorage.setItem('eidnan_req_id', storedId);
    }
    setRequestId(storedId);
  }, []);

  const handleCopyReqId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFullPendingMessage = () => {
    const fullMsg = `⏳ স্ট্যাটাস: পেন্ডিং (Admin Approval Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 আপনার ইউনিক রিকোয়েস্ট আইডি: ${requestId}

অনুমোদন পেতে এই আইডিটি কপি করে অ্যাডমিনকে পাঠান:
👤 অ্যাডমিন: EIDNAN Khan
🔗 ফেসবুক লিংক: https://www.facebook.com/EIDNAN.KHAN.5

অ্যাডমিন আপনাকে একটি গোপন পাসকোড প্রদান করবেন। কোডটি নিচে লিখে সেন্ড করলেই আপনার ভয়েস স্টুডিও সক্রিয় হবে।`;
    navigator.clipboard.writeText(fullMsg);
    setCopiedFullMessage(true);
    setTimeout(() => setCopiedFullMessage(false), 2000);
  };

  const verifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    const input = passcode.trim();
    if (!input) return;

    // Mathematical formula verification:
    const digits = requestId.replace(/\D/g, '').split('').map(Number);
    const sum = digits.length > 0 ? digits.reduce((a, b) => a + b, 0) : 10;
    const validMathPasscode13 = `PASS-${sum * 13}`;
    const validMathPasscode7 = `PASS-${sum * 7}`;

    const normalizedInput = input.toUpperCase();

    const isValid =
      normalizedInput === 'EIDNAN-MASTER-2026' ||
      normalizedInput === 'ADMIN-PASS-99' ||
      normalizedInput === validMathPasscode13 ||
      normalizedInput === validMathPasscode7;

    if (isValid) {
      localStorage.setItem('eidnan_voice_unlocked', 'true');
      if (!localStorage.getItem('eidnan_download_quota')) {
        localStorage.setItem('eidnan_download_quota', '20');
      }

      setSuccessStatus(
        lang === 'bn'
          ? `✅ অ্যাকাউন্ট সফলভাবে সক্রিয় হয়েছে!\n🎙️ ভয়েস তৈরি ও প্রিভিউ: সম্পূর্ণ আনলিমিটেড (ফ্রি)\n📥 অডিও ডাউনলোড: সক্রিয় (Active)\n🎙️ উচ্চারণ: খাঁটি বাংলাদেশি প্রমিত বাংলা\nআপনার পছন্দের মুড নির্বাচন করে স্ক্রিপ্ট প্রদান করুন।`
          : `✅ Account successfully activated!\n🎙️ Voice Generation & Preview: 100% Free & Unlimited\n📥 Audio Download: Active\n🎙️ Accent: Authentic Bangladeshi Standard Bengali\nSelect your mood and enter your script.`
      );

      setTimeout(() => {
        onUnlock();
      }, 1200);
    } else {
      setErrorStatus(
        lang === 'bn'
          ? '❌ ভুল পাসকোড! অনুগ্রহ করে অ্যাডমিনের দেওয়া সঠিক পাসকোড দিন অথবা অ্যাডমিনের সাথে ফেসবুকে যোগাযোগ করুন।'
          : '❌ Invalid passcode! Please enter the correct code from admin or contact support.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      {/* Background Ambient Liquid Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#bfa065]/20 via-[#38bdf8]/10 to-[#818cf8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl liquid-glass-elevated p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl border border-slate-200/90 bg-white/95">
        {/* Top ambient liquid sheen line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#bfa065] to-transparent opacity-80" />

        {/* Header line */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-6">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bfa065] animate-pulse shadow-[0_0_10px_rgba(191,160,101,0.8)]" />
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#0f172a]">
              {lang === 'bn' ? 'অ্যাডমিন অনুমোদন গেট' : 'Admin Approval Gate'}
            </h2>
          </div>
          <span className="boring-keycap text-[10px] text-[#bfa065]">AUTH 001</span>
        </div>

        {/* Pending message box in the exact requested Bengali format with Liquid Glass */}
        <div className="liquid-glass rounded-xl p-5 mb-6 text-left border border-slate-200/80 bg-white/80">
          <div className="flex items-center space-x-2 text-xs font-mono-code text-[#bfa065] mb-2 font-semibold">
            <span>⏳ স্ট্যাটাস: পেন্ডিং (Admin Approval Required)</span>
          </div>

          <div className="h-px bg-slate-200/80 my-3" />

          {/* Request ID Display */}
          <div className="mb-4">
            <p className="text-xs font-bangla text-[#475569] mb-1.5 font-medium">
              🔒 আপনার ইউনিক রিকোয়েস্ট আইডি:
            </p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 shadow-inner">
              <span className="font-mono-code text-sm sm:text-base font-bold text-[#0f172a] tracking-wider">
                {requestId || 'REQ-GENERATING'}
              </span>
              <button
                type="button"
                onClick={handleCopyReqId}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg liquid-glass-button text-xs font-mono-code text-[#bfa065] hover:text-[#0f172a] transition cursor-pointer"
                title="Copy Request ID"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি আইডি</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Admin contact details with EIDNAN Khan's Picture in Liquid Glass Frame */}
          <div className="text-xs font-bangla text-[#475569] space-y-2 leading-relaxed">
            <p className="text-[#334155] font-medium">অনুমোদন পেতে এই আইডিটি কপি করে অ্যাডমিনকে পাঠান:</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl liquid-glass border border-slate-200/90 hover:border-[#bfa065]/50 transition-all bg-white/90">
              <div className="flex items-center space-x-3.5">
                <div
                  className="cursor-pointer"
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Click to view EIDNAN Khan's profile / update photo"
                >
                  <AdminAvatar size="md" showOnlineDot={true} />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <p className="text-[#0f172a] font-editorial font-bold text-sm sm:text-base">
                      👤 অ্যাডমিন: EIDNAN Khan
                    </p>
                    <span className="text-[10px] font-mono-code text-[#bfa065] bg-amber-50 px-1 rounded border border-amber-200">
                      Verified
                    </span>
                  </div>
                  <a
                    href="https://www.facebook.com/EIDNAN.KHAN.5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#64748b] hover:text-[#0f172a] text-[11px] font-mono-code underline transition block mt-0.5 truncate max-w-[210px] sm:max-w-xs"
                  >
                    https://www.facebook.com/EIDNAN.KHAN.5
                  </a>
                </div>
              </div>

              <a
                href="https://www.facebook.com/EIDNAN.KHAN.5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-[#bfa065] hover:text-[#0f172a] transition self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#bfa065]" />
                <span>মেসেজ দিন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-xs font-bangla text-[#64748b] mt-3.5 leading-relaxed">
            অ্যাডমিন আপনাকে একটি গোপন পাসকোড প্রদান করবেন। কোডটি নিচে লিখে সেন্ড করলেই আপনার ভয়েস স্টুডিও সক্রিয় হবে।
          </p>

          {/* Quick Copy Full Bengali message button */}
          <div className="mt-3.5 text-right">
            <button
              type="button"
              onClick={handleCopyFullPendingMessage}
              className="text-xs font-bangla text-[#bfa065] hover:text-[#926b20] underline transition inline-flex items-center space-x-1 cursor-pointer font-medium"
            >
              {copiedFullMessage ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">সম্পূর্ণ পেন্ডিং মেসেজ কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>সম্পূর্ণ মেসেজটি কপি করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={verifyPasscode} className="space-y-4">
          <div>
            <label className="block text-xs font-bangla text-[#334155] mb-2 font-medium">
              গোপন পাসকোড প্রদান করুন:
            </label>
            <div className="relative">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="যেমন: PASS-130 বা EIDNAN-MASTER-2026"
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-3 text-sm font-mono-code text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#bfa065] transition shadow-inner"
              />
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            </div>
          </div>

          {errorStatus && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bangla text-red-700 animate-in fade-in leading-relaxed">
              {errorStatus}
            </div>
          )}

          {successStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bangla text-emerald-800 animate-in fade-in whitespace-pre-line leading-relaxed">
              {successStatus}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              className="w-full py-3 rounded-xl boring-button text-sm font-semibold text-white flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#bfa065]" />
              <span className="font-bangla">ভয়েস স্টুডিও সক্রিয় করুন</span>
              <span className="boring-keycap ml-1">↵</span>
            </button>

            <button
              type="button"
              onClick={() => setPasscode('EIDNAN-MASTER-2026')}
              className="px-3.5 py-2.5 rounded-xl liquid-glass text-xs font-mono-code text-[#bfa065] hover:text-[#0f172a] border border-slate-200/90 hover:border-slate-300 transition whitespace-nowrap cursor-pointer shadow-xs"
              title="Use Master Key for Testing"
            >
              মাস্টার কী টেস্ট
            </button>
          </div>
        </form>

        {/* Footer Hint */}
        <div className="mt-5 text-center text-[11px] font-bangla text-[#64748b]">
          মাস্টার আনলক কোড: <code className="text-[#bfa065] font-mono-code font-bold">EIDNAN-MASTER-2026</code>
        </div>
      </div>

      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};
