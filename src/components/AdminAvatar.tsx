import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, ExternalLink, Sparkles, Upload, User } from 'lucide-react';

interface AdminAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnlineDot?: boolean;
  className?: string;
  allowUpload?: boolean;
  onOpenProfile?: () => void;
}

export const AdminAvatar: React.FC<AdminAvatarProps> = ({
  size = 'md',
  showOnlineDot = true,
  className = '',
  allowUpload = false,
  onOpenProfile,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check localStorage for saved custom avatar or fallback
    const saved = localStorage.getItem('eidnan_custom_avatar');
    if (saved) {
      setPhotoUrl(saved);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          localStorage.setItem('eidnan_custom_avatar', base64);
          setPhotoUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-24 h-24 text-base',
  }[size];

  const dotClasses = {
    xs: 'w-1.5 h-1.5 ring-1 -bottom-0.5 -right-0.5',
    sm: 'w-2 h-2 ring-1.5 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 ring-2 bottom-0 right-0',
    lg: 'w-3.5 h-3.5 ring-2 bottom-0.5 right-0.5',
    xl: 'w-5 h-5 ring-3 bottom-1 right-1',
  }[size];

  return (
    <div
      className={`relative inline-flex shrink-0 group ${className}`}
      onClick={(e) => {
        if (onOpenProfile) {
          e.stopPropagation();
          onOpenProfile();
        }
      }}
    >
      <div
        className={`${sizeClasses} rounded-full overflow-hidden liquid-glass-avatar relative transition-all duration-300 group-hover:scale-105 cursor-pointer`}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="EIDNAN Khan"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          /* High-fidelity vector artistic portrait matching EIDNAN Khan (Navy suit, crisp white shirt, burgundy tie, styled dark hair) */
          <div className="w-full h-full bg-gradient-to-b from-[#1e2732] via-[#141b24] to-[#0d1218] flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Studio Warm Backlight */}
              <circle cx="50" cy="50" r="48" fill="url(#avatarGlow)" />
              
              {/* Suit Jacket - Elegant Navy Blue */}
              <path
                d="M12 98 C18 68, 30 62, 50 62 C70 62, 82 68, 88 98 Z"
                fill="#152438"
                stroke="#2a3c54"
                strokeWidth="1.5"
              />
              {/* Suit Lapels */}
              <path d="M34 68 L50 88 L38 98 Z" fill="#0f1a29" />
              <path d="M66 68 L50 88 L62 98 Z" fill="#0f1a29" />
              
              {/* White Dress Shirt V */}
              <path d="M42 63 L50 84 L58 63 Z" fill="#f8fafc" />
              
              {/* Burgundy/Dark Red Necktie */}
              <path d="M47 68 L53 68 L52 86 L50 90 L48 86 Z" fill="#881337" />
              <path d="M48 67 L52 67 L53 71 L47 71 Z" fill="#9f1239" />
              
              {/* Neck */}
              <path d="M43 48 L43 65 L57 65 L57 48 Z" fill="#d4a373" />
              
              {/* Face Contour */}
              <ellipse cx="50" cy="44" rx="16" ry="19" fill="#e0b084" />
              
              {/* Ears */}
              <ellipse cx="33" cy="45" rx="2.5" ry="5" fill="#d4a373" />
              <ellipse cx="67" cy="45" rx="2.5" ry="5" fill="#d4a373" />
              
              {/* Hair - Neat stylish dark hair parted to side */}
              <path
                d="M32 40 C32 25, 42 20, 50 20 C60 20, 68 25, 68 40 C65 33, 58 30, 48 31 C38 32, 34 36, 32 40 Z"
                fill="#111827"
              />
              <path
                d="M32 38 C35 28, 48 23, 64 25 C68 28, 68 36, 68 38 C62 30, 52 28, 38 32 Z"
                fill="#1f2937"
              />
              
              {/* Eyebrows */}
              <path d="M38 38 Q43 36 47 38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M53 38 Q57 36 62 38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
              
              {/* Eyes */}
              <circle cx="43" cy="42" r="1.8" fill="#1e293b" />
              <circle cx="57" cy="42" r="1.8" fill="#1e293b" />
              <circle cx="43.5" cy="41.5" r="0.6" fill="#ffffff" />
              <circle cx="57.5" cy="41.5" r="0.6" fill="#ffffff" />
              
              {/* Nose */}
              <path d="M50 42 L48.5 48 L51.5 48" stroke="#c28c5a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Confident Warm Smile */}
              <path d="M44 53 Q50 58 56 53" stroke="#993d3d" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M45.5 53.5 Q50 56.5 54.5 53.5" fill="#ffffff" />

              <defs>
                <radialGradient id="avatarGlow" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#bfa065" stopOpacity="0.3" />
                  <stop offset="70%" stopColor="#1a222c" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10151c" stopOpacity="1" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        )}

        {/* Specular glass reflection overlay */}
        <div className="absolute inset-0 rounded-full pointer-events-none liquid-glass-gloss" />

        {/* Upload trigger overlay if allowed */}
        {allowUpload && (
          <label
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-white"
            title="Upload/Update your photo"
          >
            <Camera className="w-5 h-5 text-[#bfa065]" />
            <span className="text-[10px] font-bangla mt-0.5 text-[#e5d5b8]">ছবি দিন</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Pulsing Liquid Active Beacon */}
      {showOnlineDot && (
        <span
          className={`absolute ${dotClasses} rounded-full bg-[#10b981] ring-[#14181c] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse`}
          title="Online / Admin Active"
        />
      )}
    </div>
  );
};
