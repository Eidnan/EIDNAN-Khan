import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  Volume2,
  ExternalLink,
  Mic,
  Radio,
  Sliders,
  ShieldCheck,
  Disc3,
  Bookmark,
} from 'lucide-react';
import { AdminContactLink } from './AdminContactLink';

interface EditorialHeroProps {
  onStartClick: () => void;
  onExploreWorkClick: () => void;
  lang: 'bn' | 'en';
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onStartClick,
  onExploreWorkClick,
  lang,
}) => {
  return (
    <section className="relative overflow-hidden boring-sky-gradient boring-grid border-b border-slate-200/80 pt-14 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6">
      {/* Soft atmospheric dawn glow & Liquid Light Reflections */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-[#e3b88b]/20 via-[#c99065]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#bfa065]/10 rounded-full blur-3xl pointer-events-none liquid-orb-1" />
      <div className="absolute top-40 left-10 w-80 h-80 bg-[#3b82f6]/10 rounded-full blur-3xl pointer-events-none liquid-orb-2" />

      <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Editorial Liquid Glass Pill Tagline */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full liquid-glass text-xs font-mono-code text-[#475569] mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#bfa065] animate-pulse shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
          <span className="text-[#bfa065] font-semibold">006</span>
          <span className="text-slate-300">·</span>
          <span>{lang === 'bn' ? 'খাঁটি বাংলাদেশি প্রমিত উচ্চারণ' : 'Authentic Standard Bengali Voice'}</span>
        </div>

        {/* TheBoringBlog Iconic Headline Style */}
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0f172a] leading-[1.08] mb-6 drop-shadow-sm">
          <span>The</span>{' '}
          <em className="font-serif italic font-normal text-[#bfa065] px-1 font-editorial">
            not
          </em>{' '}
          <span>Boring</span>
          <br className="hidden sm:inline" />
          <span className="sm:ml-3">Voice Studio</span>{' '}
          <span className="text-[#bfa065] font-light">?</span>
        </h1>

        {/* Bengali subtitle & English blurb */}
        <p className="font-bangla text-lg sm:text-2xl text-[#1e293b] max-w-2xl leading-relaxed font-normal mb-3">
          {lang === 'bn'
            ? 'খাঁটি বাংলাদেশি প্রমিত উচ্চারণ, শৈল্পিক আবৃত্তি ও জীবন্ত কণ্ঠস্বর।'
            : 'Artisanal Bengali audio narration, cinematic baritone, and real-time voice intelligence.'}
        </p>

        <p className="text-sm sm:text-base text-[#64748b] max-w-xl leading-relaxed mb-9">
          {lang === 'bn'
            ? 'যেখানে কৃত্রিমতা ছাড়া প্রতিটি শব্দে ধ্বনিত হয় সঠিক ব্যাকরণ, য-ফলা, এ-কার ও প্রাকৃতিক মানুষের মতো শ্বাস-প্রশ্বাসের ছন্দ।'
            : 'Unapologetically human. Precise phonetics, cinematic presence, and natural respiratory pauses engineered with Gemini 3.8.'}
        </p>

        {/* Action Buttons with Liquid Glass & Contact Link with Picture */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
          <button
            onClick={onStartClick}
            className="boring-button px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center space-x-2.5 text-white cursor-pointer"
          >
            <Radio className="w-4 h-4 text-[#bfa065]" />
            <span className="font-bangla">
              {lang === 'bn' ? 'ভয়েস স্টুডিও চালু করুন' : 'Open Voice Studio'}
            </span>
            <span className="boring-keycap ml-1">↵ Enter</span>
          </button>

          {/* Liquid Glass Contact Link with EIDNAN Khan's Picture */}
          <AdminContactLink variant="hero" lang={lang} />
        </div>

        {/* TheBoringBlog Chapter / Index Grid (001 - 006) for Voice Moods in Liquid Glass */}
        <div className="w-full text-left pt-6 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono-code text-[#64748b] uppercase tracking-wider font-semibold">
              {lang === 'bn' ? '৬টি বিশেষায়িত আবৃত্তি মুড' : '6 Specialized Voice Moods'}
            </div>
            <div className="text-xs font-mono-code text-[#bfa065] font-semibold px-2 py-0.5 rounded liquid-glass">
              001 — 006
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                idx: '001',
                title: 'গভীর ও সিনামেটিক',
                en: 'Cinematic Baritone',
                desc: 'গম্ভীর, ভারী ব্যক্তিত্বপূর্ণ ও গভীর আবেগ। তথ্যচিত্র ও গভীর কথার জন্য।',
              },
              {
                idx: '002',
                title: 'আবেগঘন ও হৃদয়স্পর্শী',
                en: 'Emotional & Touching',
                desc: 'ধীরস্থির, নরম ও ব্যাকুল সুর। মোনাজাত ও ব্যথিত অনুভূতির জন্য।',
              },
              {
                idx: '003',
                title: 'অনুপ্রেরণাদায়ী ও বলিষ্ঠ',
                en: 'Inspirational & Bold',
                desc: 'উদ্যমী, প্রত্যয়ী, বলিষ্ঠ ও তেজস্বী কণ্ঠ। জাগরণী কথার জন্য।',
              },
              {
                idx: '004',
                title: 'রহস্যময় ও শান্ত',
                en: 'Mysterious Soft',
                desc: 'ফিসফিসানি, নিস্তব্ধ রাতের মতো গভীর ও কৌতূহলোদ্দীপক সুর।',
              },
              {
                idx: '005',
                title: 'স্নেহময় ও প্রশান্তিময়',
                en: 'Peaceful Narrative',
                desc: 'শান্ত, দরদি, মমতাভরা ও স্নিগ্ধ উচ্চারণ। স্নিগ্ধ বার্তার জন্য।',
              },
              {
                idx: '006',
                title: 'ঐতিহাসিক ও আখ্যানমূলক',
                en: 'Epic Storyteller',
                desc: 'প্রাচীন গল্পের রূপরেখায় ক্লাসিক আবহ তৈরি করা সুর।',
              },
            ].map((mood) => (
              <div
                key={mood.idx}
                className="liquid-glass p-4 rounded-xl relative overflow-hidden group hover:scale-[1.01] cursor-pointer"
                onClick={onStartClick}
              >
                {/* Micro corner highlight */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-900/[0.02] group-hover:bg-[#bfa065]/10 rounded-bl-full transition-colors pointer-events-none" />

                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-mono-code text-xs font-semibold text-[#bfa065]">
                    {mood.idx}
                  </span>
                  <span className="font-mono-code text-[11px] text-[#64748b] group-hover:text-[#0f172a] transition-colors">
                    {mood.en}
                  </span>
                </div>
                <h4 className="font-editorial text-base font-bold text-[#0f172a] mb-1.5 group-hover:text-[#bfa065] transition-colors">
                  {mood.title}
                </h4>
                <p className="font-bangla text-xs text-[#64748b] leading-relaxed">
                  {mood.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
