import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Camera,
  Check,
  Copy,
  Sparkles,
  MessageCircle,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { AdminAvatar } from './AdminAvatar';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const fbUrl = 'https://www.facebook.com/EIDNAN.KHAN.5';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fbUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          localStorage.setItem('eidnan_custom_avatar', base64);
          setPhotoSaved(true);
          setTimeout(() => setPhotoSaved(false), 2500);
          // Trigger custom event so other components update immediately
          window.dispatchEvent(new Event('eidnan_avatar_updated'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    localStorage.removeItem('eidnan_custom_avatar');
    window.dispatchEvent(new Event('eidnan_avatar_updated'));
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background Liquid Light Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-[#bfa065]/20 via-[#403060]/10 to-[#22d3ee]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md liquid-glass-elevated rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 bg-white/95 overflow-hidden">
        {/* Top Iridescent Liquid Sheen */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#bfa065] to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#64748b] hover:text-[#0f172a] transition border border-slate-200 cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Avatar & Info */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Avatar with Liquid Glass Ring */}
          <div className="relative mb-4">
            <div className="p-1 rounded-full bg-gradient-to-tr from-[#bfa065] via-amber-200 to-[#bfa065] shadow-[0_0_25px_rgba(191,160,101,0.3)]">
              <AdminAvatar size="xl" showOnlineDot={true} allowUpload={true} />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-[#bfa065] hover:text-[#0f172a] border border-slate-200 shadow-md hover:scale-110 transition cursor-pointer"
              title="Upload your photo or avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPhoto}
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono-code text-[#bfa065] mb-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>সিস্টেম অ্যাডমিন ও ক্রিয়েটর</span>
          </div>

          <h3 className="font-editorial text-2xl font-bold text-[#0f172a] tracking-tight mb-1">
            EIDNAN Khan
          </h3>

          <p className="font-bangla text-xs text-[#475569] max-w-xs leading-relaxed mb-5">
            {lang === 'bn'
              ? 'খাঁটি বাংলাদেশি প্রমিত বাংলা ভয়েস ও সিড্যান্স ২.৫ ভিডিও স্টুডিওর প্রতিষ্ঠাতা। জরুরি সাপোর্ট, অনুমোদন ও সহযোগিতার জন্য যোগাযোগ করুন।'
              : 'Founder & System Admin of The Boring Voice Studio. Contact for instant approvals & custom voice quotas.'}
          </p>

          {photoSaved && (
            <div className="mb-4 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bangla flex items-center space-x-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>আপনার ছবি সফলভাবে আপডেট হয়েছে!</span>
            </div>
          )}

          {/* Liquid Glass Contact Actions */}
          <div className="w-full space-y-2.5">
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl boring-button flex items-center justify-center space-x-2 text-sm font-semibold text-white group cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#bfa065] group-hover:scale-110 transition-transform" />
              <span className="font-bangla">
                {lang === 'bn' ? 'ফেসবুকে সরাসরি মেসেজ পাঠান' : 'Direct Message on Facebook'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-mono-code text-[#475569] truncate text-[11px] select-all">
                {fbUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#bfa065] text-xs font-mono-code transition flex items-center space-x-1 border border-slate-200 cursor-pointer shadow-xs"
                title="Copy Link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>কপি লিংক</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick upload photo notice */}
          <div className="mt-4 pt-4 border-t border-slate-200/80 w-full flex items-center justify-between text-[11px] text-[#64748b]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#bfa065] hover:text-[#e0cb9d] transition flex items-center space-x-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>ছবি পরিবর্তন / আপলোড</span>
            </button>

            <button
              onClick={handleResetPhoto}
              className="hover:text-white transition text-[10px] cursor-pointer"
              title="Reset to default portrait"
            >
              ডিফল্ট ছবি
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
