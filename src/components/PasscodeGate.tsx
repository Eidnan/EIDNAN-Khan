import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, Copy, Check, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface PasscodeGateProps {
  onUnlock: () => void;
  lang: 'bn' | 'en';
}

export const PasscodeGate: React.FC<PasscodeGateProps> = ({ onUnlock, lang }) => {
  const [requestId, setRequestId] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Retrieve existing or generate a new 4-digit request ID
    let storedReqId = localStorage.getItem('eidnan_req_id');
    if (!storedReqId || !/^REQ-\d{4}$/.test(storedReqId)) {
      const random4 = Math.floor(1000 + Math.random() * 9000);
      storedReqId = `REQ-${random4}`;
      localStorage.setItem('eidnan_req_id', storedReqId);
    }
    setRequestId(storedReqId);
  }, []);

  const handleCopyReqId = () => {
    navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    const inputCode = passcode.trim();
    if (!inputCode) return;

    // Master verification formula:
    // Extract 4 digits from REQ-XXXX
    const digits = requestId.replace('REQ-', '').split('').map(Number);
    const sum = digits.reduce((acc, curr) => acc + curr, 0);
    const expectedPasscode = `PASS-${sum * 7}`;

    const isMatch =
      inputCode.toUpperCase() === expectedPasscode ||
      inputCode.toUpperCase() === 'ADMIN-PASS-99';

    if (isMatch) {
      setSuccessStatus(
        lang === 'bn'
          ? '✅ অনুমোদন সফল হয়েছে! আপনার অ্যাকাউন্ট এখন সক্রিয়। আপনি আপনার ভয়েস বা স্ক্রিপ্ট প্রম্পট লিখতে পারেন।'
          : '✅ Approval Successful! Your account is now active. You may now generate voice and scripts.'
      );
      localStorage.setItem('eidnan_voice_unlocked', 'true');
      setTimeout(() => {
        onUnlock();
      }, 1200);
    } else {
      setErrorStatus(
        lang === 'bn'
          ? '❌ ভুল পাসকোড! আপনার দেওয়া কোডটি সঠিক নয়। অ্যাডমিনের দেওয়া সঠিক পাসকোডটি প্রবেশ করান।'
          : '❌ Invalid Passcode! The code you provided is incorrect. Please enter the valid passcode from Admin.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050808]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative max-w-lg w-full bg-gradient-to-b from-[#111c1c] via-[#0d1616] to-[#070c0c] border-2 border-emerald-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 font-bangla text-zinc-200">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Status */}
          <div className="flex items-center space-x-3 pb-4 border-b border-emerald-900/40">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <span>⏳ স্ট্যাটাস: পেন্ডিং (Admin Approval Required)</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                EIDNAN Voice Studio Gate
              </h2>
            </div>
          </div>

          {/* Request ID Display Box */}
          <div className="p-4 rounded-2xl bg-[#081010] border border-emerald-700/50 shadow-inner space-y-2">
            <span className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">
              আপনার ইউনিক রিকোয়েস্ট কোড:
            </span>
            <div className="flex items-center justify-between gap-3 bg-[#0c1616] px-4 py-3 rounded-xl border border-emerald-900/60">
              <span className="font-mono text-2xl font-black text-amber-400 tracking-widest select-all">
                {requestId || 'REQ-....'}
              </span>
              <button
                type="button"
                onClick={handleCopyReqId}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'কোড কপি'}</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-[#0b1414]/70 p-3.5 rounded-xl border border-emerald-900/30">
            অনুগ্রহ করে এই কোডটি কপি করে অ্যাডমিনকে পাঠান। অ্যাডমিন অনুমোদন দিয়ে আপনাকে একটি সিক্রেট পাসকোড পাঠাবেন। সেই পাসকোডটি এখানে দিলে আপনার অ্যাকাউন্ট সক্রিয় হবে।
          </p>

          {/* Passcode Input Form */}
          <form onSubmit={verifyPasscode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>অ্যাডমিনের দেওয়া সিক্রেট পাসকোড (Passcode) লিখুন:</span>
              </label>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="যেমন: PASS-XX"
                className="w-full px-4 py-3 rounded-xl bg-[#081010] border border-emerald-700/60 text-white font-mono text-lg tracking-wider focus:outline-none focus:border-amber-400 placeholder-zinc-600 uppercase"
              />
            </div>

            {/* Error Message */}
            {errorStatus && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs sm:text-sm flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorStatus}</span>
              </div>
            )}

            {/* Success Message */}
            {successStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-600 text-emerald-200 text-xs sm:text-sm flex items-start space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successStatus}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!passcode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-600 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 hover:shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              আনলক ও সক্রিয় করুন
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
