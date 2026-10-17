import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { AdminAvatar } from './AdminAvatar';
import { AdminProfileModal } from './AdminProfileModal';

interface AdminContactLinkProps {
  variant?: 'navbar' | 'hero' | 'banner' | 'footer' | 'card';
  lang?: 'bn' | 'en';
  className?: string;
  showModalOnClick?: boolean;
}

export const AdminContactLink: React.FC<AdminContactLinkProps> = ({
  variant = 'navbar',
  lang = 'bn',
  className = '',
  showModalOnClick = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fbUrl = 'https://www.facebook.com/EIDNAN.KHAN.5';

  if (variant === 'navbar') {
    return (
      <>
        <div className={`flex items-center space-x-1.5 ${className}`}>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-pill py-1 px-2.5 rounded-full flex items-center space-x-2 text-xs text-[#0f172a] hover:text-[#bfa065] transition-all group border border-slate-200/90 hover:border-[#bfa065]/60 hover:shadow-xs shadow-2xs"
            title="EIDNAN Khan - Facebook Contact"
          >
            <AdminAvatar
              size="xs"
              showOnlineDot={true}
              onOpenProfile={() => setIsModalOpen(true)}
            />
            <div className="flex items-center space-x-1">
              <span className="font-editorial text-[11px] font-semibold tracking-tight text-[#0f172a] group-hover:text-[#bfa065] transition-colors">
                EIDNAN Khan
              </span>
              <span className="hidden xl:inline text-[9px] font-mono-code text-[#bfa065] bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                Admin
              </span>
            </div>
            <ExternalLink className="w-2.5 h-2.5 text-[#64748b] group-hover:text-[#bfa065] group-hover:translate-x-0.5 transition-transform opacity-70" />
          </a>
        </div>
        <AdminProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lang={lang}
        />
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`liquid-glass-button py-2.5 px-4 rounded-xl flex items-center space-x-3 text-xs sm:text-sm font-medium text-[#0f172a] border border-slate-200/90 hover:border-[#bfa065]/50 transition-all shadow-xs group cursor-pointer ${className}`}
        >
          <AdminAvatar
            size="sm"
            showOnlineDot={true}
            onOpenProfile={() => setIsModalOpen(true)}
          />
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <span className="font-editorial font-bold text-[#0f172a] group-hover:text-[#bfa065] transition-colors">
                EIDNAN Khan
              </span>
              <span className="text-[10px] font-mono-code text-[#bfa065] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold">
                অ্যাডমিন
              </span>
            </div>
            <span className="text-[11px] font-bangla text-[#64748b]">
              ফেসবুকে যোগাযোগ করুন
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#bfa065] group-hover:translate-x-0.5 transition-transform" />
        </a>
        <AdminProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lang={lang}
        />
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 p-3 rounded-xl liquid-glass border border-slate-200/90 ${className}`}
        >
          <div className="flex items-center space-x-3">
            <AdminAvatar
              size="md"
              showOnlineDot={true}
              onOpenProfile={() => setIsModalOpen(true)}
            />
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="font-editorial font-bold text-xs sm:text-sm text-[#0f172a]">
                  EIDNAN Khan
                </span>
                <span className="text-[10px] font-mono-code text-[#bfa065] bg-amber-50 border border-amber-200 px-1 rounded font-semibold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-[#64748b] truncate max-w-[200px] sm:max-w-xs">
                https://www.facebook.com/EIDNAN.KHAN.5
              </p>
            </div>
          </div>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 liquid-glass-pill px-3 py-1.5 rounded-lg text-xs font-semibold text-[#bfa065] hover:text-[#0f172a] flex items-center space-x-1.5 border border-[#bfa065]/40 hover:bg-amber-50 transition"
          >
            <span>মেসেজ দিন</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <AdminProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lang={lang}
        />
      </>
    );
  }

  // Footer / Card default
  return (
    <>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center space-x-2 liquid-glass-pill px-3 py-1.5 rounded-full border border-slate-200/90 hover:border-[#bfa065]/40 text-xs text-[#475569] hover:text-[#0f172a] transition group cursor-pointer shadow-2xs ${className}`}
      >
        <AdminAvatar
          size="xs"
          showOnlineDot={true}
          onOpenProfile={() => setIsModalOpen(true)}
        />
        <span className="font-editorial font-semibold text-[#0f172a] group-hover:text-[#bfa065] transition-colors">
          EIDNAN Khan
        </span>
        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
      </a>
      <AdminProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />
    </>
  );
};
