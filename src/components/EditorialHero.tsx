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
import { VOCAL_MODES } from '../data/vocalModes';

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
          <span>{lang === 'bn' ? 'খাঁটি বাংলাদেশি প্রমিত কণ্ঠ ও ভয়েস ডাবিং' : 'Authentic Standard Bengali Voice & Multilingual Dubbing'}</span>
        </div>

        {/* The Boring Voice Studio Headline */}
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0f172a] leading-[1.08] mb-6 drop-shadow-sm">
          <span>The</span>{' '}
          <span className="font-editorial text-[#bfa065]">Boring</span>
          <br className="hidden sm:inline" />
          <span className="sm:ml-3">Voice Studio</span>
        </h1>

        {/* Bengali subtitle & English blurb */}
        <p className="font-bangla text-lg sm:text-2xl text-[#1e293b] max-w-2xl leading-relaxed font-normal mb-3">
          {lang === 'bn'
            ? 'খাঁটি বাংলাদেশি প্রমিত উচ্চারণ, ১২টি আবৃত্তি মুড ও অত্যাধুনিক ভয়েস ডাবিং স্টুডিও।'
            : 'Artisanal Bengali audio narration, 12 vocal modes, and multilingual voice dubbing.'}
        </p>

        <p className="text-sm sm:text-base text-[#64748b] max-w-xl leading-relaxed mb-9">
          {lang === 'bn'
            ? 'যেখানে কৃত্রিমতা ছাড়া প্রতিটি শব্দে ধ্বনিত হয় সঠিক ব্যাকরণ, য-ফলা, এ-কার ও প্রাকৃতিক শ্বাস-প্রশ্বাসের ছন্দ।'
            : 'Unapologetically human. Precise phonetics, cinematic presence, and natural respiratory pauses engineered with Gemini 3.8.'}
        </p>

        {/* Direct Action Buttons & Admin Contact Link */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
          <button
            onClick={onStartClick}
            className="boring-button px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center space-x-2.5 text-white cursor-pointer shadow-md"
          >
            <Radio className="w-4 h-4 text-[#bfa065]" />
            <span className="font-bangla">
              {lang === 'bn' ? '🎙️ ভয়েস তৈরি করুন' : '🎙️ Generate Voice'}
            </span>
            <span className="boring-keycap ml-1">↵ Enter</span>
          </button>

          <button
            onClick={onExploreWorkClick}
            className="liquid-glass-button px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center space-x-2 text-[#0f172a] border border-slate-200 cursor-pointer shadow-sm hover:border-[#bfa065]"
          >
            <span className="font-bangla">
              {lang === 'bn' ? '🌐 ভয়েস ডাবিং' : '🌐 Voice Dubbing'}
            </span>
          </button>

          {/* Liquid Glass Contact Link with Curator's Picture */}
          <AdminContactLink variant="hero" lang={lang} />
        </div>

        {/* 3 Core Essential Pillars (Focused & Clean) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-6 border-t border-slate-200/80">
          <div
            onClick={onStartClick}
            className="liquid-glass p-5 rounded-2xl border border-slate-200/90 cursor-pointer hover:scale-[1.02] transition-transform group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-[#bfa065] flex items-center justify-center mb-3">
              <Radio className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-sm font-bold text-[#0f172a] mb-1 group-hover:text-[#bfa065] transition-colors">
              {lang === 'bn' ? 'খাঁটি বাংলাদেশি প্রমিত বাংলা' : 'Standard Bangladeshi Bengali'}
            </h4>
            <p className="font-bangla text-xs text-[#64748b] leading-relaxed">
              {lang === 'bn'
                ? 'কমা ও দাঁড়ির সঠিক স্থানে স্বাভাবিক শ্বাস-প্রশ্বাস। কোনো কৃত্রিম বা রোবোটিক ভাব ছাড়া খাঁটি উচ্চারণ।'
                : 'Natural human breathing pauses at commas and periods with pure native articulation.'}
            </p>
          </div>

          <div
            onClick={onExploreWorkClick}
            className="liquid-glass p-5 rounded-2xl border border-slate-200/90 cursor-pointer hover:scale-[1.02] transition-transform group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-[#bfa065] flex items-center justify-center mb-3">
              <Volume2 className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-sm font-bold text-[#0f172a] mb-1 group-hover:text-[#bfa065] transition-colors">
              {lang === 'bn' ? 'মাল্টিলিঙ্গুয়াল ভয়েস ডাবিং' : 'Multilingual Voice Dubbing'}
            </h4>
            <p className="font-bangla text-xs text-[#64748b] leading-relaxed">
              {lang === 'bn'
                ? 'স্বয়ংক্রিয় ভাষা শনাক্তকরণ, মূল টেক্সট আলাদা এবং খাঁটি বাংলা, English, हिन्दी ও العربية ভাষায় ডাবিং।'
                : 'Auto-detect input language, extract spoken text, and dub natively into Bangla, English, Hindi, and Arabic.'}
            </p>
          </div>

          <div
            onClick={onStartClick}
            className="liquid-glass p-5 rounded-2xl border border-slate-200/90 cursor-pointer hover:scale-[1.02] transition-transform group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-[#bfa065] flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-sm font-bold text-[#0f172a] mb-1 group-hover:text-[#bfa065] transition-colors">
              {lang === 'bn' ? '১২টি আবৃত্তি ও অভিনয় মুড' : '12 Vocal & Acting Modes'}
            </h4>
            <p className="font-bangla text-xs text-[#64748b] leading-relaxed">
              {lang === 'bn'
                ? 'আধ্যাত্মিক ভাবগম্ভীরতা, গভীর আবৃত্তি, সংবাদ পাঠ, নাটকীয় কথন ও মোটিভেশনাল বাচনভঙ্গি।'
                : 'Spiritual reverence, deep recitation, dramatic storytelling, and motivational cadences.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
