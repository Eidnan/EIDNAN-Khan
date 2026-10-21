import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { AdminAvatar } from './AdminAvatar';

interface PasscodeGateProps {
  onUnlock: () => void;
  lang: 'bn' | 'en';
}

// 1-Billion+ Combination Generator (36^10 = 3.65 Quadrillion unique combinations)
const generate1BillionUniqueRequestId = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let random10 = '';
  for (let i = 0; i < 10; i++) {
    random10 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REQ-${random10}`;
};

export const PasscodeGate: React.FC<PasscodeGateProps> = ({ onUnlock, lang }) => {
  const [requestId, setRequestId] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedFullMessage, setCopiedFullMessage] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [unlockedSuccess, setUnlockedSuccess] = useState<boolean>(false);

  useEffect(() => {
    let stored = localStorage.getItem('eidnan_req_id');
    // Ensure 10-char alphanumeric format after REQ-
    if (!stored || !stored.startsWith('REQ-') || stored.replace(/^REQ-/, '').length !== 10) {
      stored = generate1BillionUniqueRequestId();
      localStorage.setItem('eidnan_req_id', stored);
    }
    setRequestId(stored);
  }, []);

  const fullAdminMessage = `⏳ স্ট্যাটাস: পেন্ডিং (Admin Approval Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 আপনার ইউনিক রিকোয়েস্ট আইডি: ${requestId}

অনুমোদন পেতে এই আইডিটি কপি করে কিউরেটরকে পাঠান:
👤 কিউরেটর: EIDNAN Khan
🔗 ফেসবুক লিংক: https://www.facebook.com/EIDNAN.KHAN.5

অ্যাডমিন আপনাকে একটি গোপন পাসকোড প্রদান করবেন। কোডটি নিচে পাঠিয়ে আপনার সেশন সক্রিয় করুন।`;

  const handleCopyReqId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(fullAdminMessage);
    setCopiedFullMessage(true);
    setTimeout(() => setCopiedFullMessage(false), 2500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = passcode.trim();
    if (!cleanInput) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে গোপন পাসকোডটি প্রবেশ করান।'
          : 'Please enter the access passcode.'
      );
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      const cleanUpper = cleanInput.toUpperCase();

      // Rule 1 & Rule 2: Derive last 4 characters reversed
      const rawCode = requestId.replace(/^REQ-/i, '').trim().toUpperCase();
      const last4 = rawCode.slice(-4);
      const reversedLast4 = last4.split('').reverse().join('');
      const expectedPasscode = `PASS-${reversedLast4}`;

      // Rule 3: Universal Master Key
      const UNIVERSAL_MASTER_KEY = 'EIDNAN-MASTER-2026';

      const isValid =
        cleanUpper === expectedPasscode ||
        cleanUpper === reversedLast4 ||
        cleanUpper === `PASS${reversedLast4}` ||
        (cleanUpper.startsWith('PASS-') && cleanUpper.includes(reversedLast4)) ||
        cleanUpper === UNIVERSAL_MASTER_KEY ||
        cleanUpper === 'EIDNAN786' ||
        cleanUpper === '7860';

      if (isValid) {
        localStorage.setItem('eidnan_voice_unlocked', 'true');
        // Initialize download quota to 20
        if (!localStorage.getItem('eidnan_download_quota')) {
          localStorage.setItem('eidnan_download_quota', '20');
        }
        setIsVerifying(false);
        setUnlockedSuccess(true);
      } else {
        setIsVerifying(false);
        setErrorMessage(
          lang === 'bn'
            ? 'ভুল পাসকোড। অনুমোদিত গোপন পাসকোড পেতে কিউরেটরের সাথে যোগাযোগ করুন।'
            : 'Incorrect passcode. Please contact Curator EIDNAN Khan to receive your code.'
        );
      }
    }, 250);
  };

  // Screen 4: Success Notification Screen
  if (unlockedSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-full max-w-lg liquid-glass-elevated rounded-3xl p-6 sm:p-9 border border-emerald-300 shadow-2xl bg-white/95 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400" />

          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2">
            ✅ অ্যাকাউন্ট সফলভাবে সক্রিয় হয়েছে!
          </h3>
          <p className="font-editorial text-base text-[#bfa065] font-semibold mb-6">
            স্বাগতম The Boring Voice Studio-তে।
          </p>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 mb-6 shadow-inner">
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-bangla text-[#0f172a]">
              <span className="text-base">🎙️</span>
              <span><strong>ভয়েস তৈরি ও ডাবিং:</strong> সম্পূর্ণ আনলিমিটেড (ফ্রি)</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-bangla text-[#0f172a]">
              <span className="text-base">📥</span>
              <span><strong>অডিও ডাউনলোড কোটা:</strong> মোট ২০টি ফাইল</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-bangla text-[#0f172a]">
              <span className="text-base">🎙️</span>
              <span><strong>খাঁটি বাংলাদেশি প্রমিত বাংলা উচ্চারণ:</strong> ১২টি বিশেষায়িত মুড সক্রিয়</span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs font-bangla text-[#64748b]">
              ✨ আপনার স্ক্রিপ্ট বা অডিও ফাইল প্রদান করুন।
            </div>
          </div>

          <button
            onClick={onUnlock}
            className="w-full boring-button py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all"
          >
            <span className="font-bangla">স্টুডিওতে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4 text-[#bfa065]" />
          </button>
        </div>
      </div>
    );
  }

  // Screen 2: Locked Pending Screen (STRICT ZERO SUGGESTIONS / ZERO MASTER KEY SHOWN IN PASS BOX)
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg liquid-glass-elevated rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-2xl bg-white/95 relative overflow-hidden">
        {/* Top Iridescent Sheen */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#bfa065] to-transparent opacity-80" />

        {/* Section Header */}
        <div className="text-center pb-5 border-b border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center justify-center text-[#bfa065] mx-auto mb-3 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bangla text-[#926b20] font-semibold mb-2">
            <span>⏳ স্ট্যাটাস: পেন্ডিং (Admin Approval Required)</span>
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0f172a]">
            The Boring Voice Studio
          </h2>
          <p className="font-bangla text-xs text-[#bfa065] font-semibold">
            দ্যা বোরিং ভয়েস স্টুডিও
          </p>
        </div>

        {/* 1-Billion Request ID Box */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono-code text-[#64748b]">
            <span className="font-semibold text-[#0f172a] flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#bfa065]" />
              <span>🔒 আপনার ইউনিক রিকোয়েস্ট আইডি:</span>
            </span>
            <span className="text-[10px] font-mono-code text-[#bfa065] bg-amber-100/70 px-2 py-0.5 rounded font-bold">
              1-BILLION ID
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="font-mono-code text-base sm:text-lg font-bold text-[#0f172a] tracking-wider select-all pl-1">
              {requestId}
            </span>
            <button
              onClick={handleCopyReqId}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono-code text-[#0f172a] transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Copy Request ID"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bangla text-xs font-semibold text-emerald-700">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#64748b]" />
                  <span className="font-bangla text-xs">আইডি কপি</span>
                </>
              )}
            </button>
          </div>

          {/* Curator EIDNAN Khan Facebook Link */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <p className="font-bangla text-xs text-[#475569] leading-relaxed">
              অনুমোদন পেতে এই আইডিটি কপি করে কিউরেটরকে পাঠান:
            </p>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/90">
              <div className="flex items-center space-x-2.5">
                <AdminAvatar size="sm" showOnlineDot={true} />
                <div>
                  <span className="font-editorial text-xs font-bold text-[#0f172a] block">
                    👤 কিউরেটর: EIDNAN Khan
                  </span>
                  <span className="text-[10px] font-mono-code text-[#64748b]">
                    Facebook Support Admin
                  </span>
                </div>
              </div>

              <a
                href="https://www.facebook.com/EIDNAN.KHAN.5"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-pill px-3 py-1.5 rounded-lg text-xs font-semibold text-[#bfa065] hover:text-[#0f172a] flex items-center space-x-1.5 border border-[#bfa065]/50 shrink-0"
              >
                <span>ফেসবুক লিংক</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-right pt-0.5">
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="text-[11px] font-bangla text-[#64748b] hover:text-[#0f172a] underline cursor-pointer"
              >
                {copiedFullMessage ? 'অনুমোদন বার্তা কপি হয়েছে!' : '📋 পূর্ণ অনুমোদন বার্তা কপি করুন'}
              </button>
            </div>
          </div>
        </div>

        <p className="font-bangla text-xs text-[#64748b] mb-4 text-center">
          অ্যাডমিন আপনাকে একটি গোপন পাসকোড প্রদান করবেন। কোডটি নিচে পাঠিয়ে আপনার সেশন সক্রিয় করুন।
        </p>

        {/* Pass Box Form - STRICT ZERO SUGGESTIONS / ZERO MASTER KEY SHOWN */}
        <form onSubmit={handleVerify} className="space-y-4" autoComplete="off">
          <div>
            <label
              htmlFor="studio_access_passcode_input"
              className="block text-xs font-bangla font-semibold text-[#0f172a] mb-1.5"
            >
              গোপন পাসকোড প্রবেশ করান:
            </label>

            <div className="relative">
              <input
                id="studio_access_passcode_input"
                name="studio_secure_pin_field"
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                /* Strictly prevent browser autofill, password manager suggestions, and master key popups */
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                aria-autocomplete="none"
                placeholder="এখানে গোপন পাসকোডটি লিখুন..."
                className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-50 border border-slate-300 focus:border-[#bfa065] focus:bg-white text-base font-mono-code text-[#0f172a] placeholder-[#94a3b8] focus:outline-none transition shadow-inner"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#0f172a] transition cursor-pointer"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bangla text-red-700 flex items-center space-x-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Unlock Action */}
          <button
            type="submit"
            disabled={isVerifying || !passcode.trim()}
            className="w-full boring-button py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md transition-all"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="font-bangla">পাসকোড যাচাই হচ্ছে...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-[#bfa065]" />
                <span className="font-bangla">সেশন সক্রিয় করুন</span>
                <span className="boring-keycap text-[10px] ml-1">↵</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
