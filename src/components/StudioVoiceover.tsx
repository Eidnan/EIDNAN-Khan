import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Sparkles,
  Sliders,
  Copy,
  Check,
  Music,
  FileText,
  Mic,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { SCRIPT_PRESETS, VOICE_OPTIONS, ScriptPreset, VoiceOption } from '../data/presets';
import { createAmbientGenerator } from '../utils/audioUtils';
import { AudioHistory, saveAudioClipToHistory } from './AudioHistory';
import { parseQuotaError, QuotaErrorInfo, toBengaliDigits } from '../utils/quotaHelper';
import { AdminAvatar } from './AdminAvatar';
import { AdminContactLink } from './AdminContactLink';

interface StudioVoiceoverProps {
  lang: 'bn' | 'en';
}

export const StudioVoiceover: React.FC<StudioVoiceoverProps> = ({ lang }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('gaze_protection_main');
  const [scriptText, setScriptText] = useState<string>(SCRIPT_PRESETS[0].text);
  const [selectedVoice, setSelectedVoice] = useState<string>('Fenrir');
  const [deliveryStyle, setDeliveryStyle] = useState<string>(SCRIPT_PRESETS[0].suggestedStyle);
  const [customStyleActive, setCustomStyleActive] = useState<boolean>(false);

  // Audio state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // 20-Download quota state
  const [downloadQuota, setDownloadQuota] = useState<number>(() => {
    const saved = localStorage.getItem('eidnan_download_quota');
    return saved !== null ? parseInt(saved, 10) : 20;
  });
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [downloadQuotaExhaustedModal, setDownloadQuotaExhaustedModal] = useState<boolean>(false);

  // Quota error state
  const [quotaInfo, setQuotaInfo] = useState<QuotaErrorInfo | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Ambient soundscape
  const [ambientActive, setAmbientActive] = useState<boolean>(false);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.12);
  const ambientGenRef = useRef<ReturnType<typeof createAmbientGenerator> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer for quota reset
  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  // Format seconds into Bengali / English string (hours and minutes)
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (lang === 'bn') {
      if (hours > 0 && minutes > 0) {
        return `${toBengaliDigits(hours)} ঘণ্টা ${toBengaliDigits(minutes)} মিনিট`;
      } else if (hours > 0) {
        return `${toBengaliDigits(hours)} ঘণ্টা`;
      } else if (minutes > 0) {
        return `${toBengaliDigits(minutes)} মিনিট`;
      }
      return `${toBengaliDigits(Math.max(1, seconds))} সেকেন্ড`;
    }
    if (hours > 0 && minutes > 0) {
      return `${hours} hours ${minutes} minutes`;
    } else if (hours > 0) {
      return `${hours} hours`;
    } else if (minutes > 0) {
      return `${minutes} minutes`;
    }
    return `${Math.max(1, seconds)} seconds`;
  };

  // Initialize Web Audio Context for ambient sound
  useEffect(() => {
    return () => {
      if (ambientGenRef.current) {
        ambientGenRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleToggleAmbient = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!ambientGenRef.current) {
      ambientGenRef.current = createAmbientGenerator(audioContextRef.current);
    }

    if (ambientActive) {
      ambientGenRef.current.stop();
      setAmbientActive(false);
    } else {
      ambientGenRef.current.start();
      ambientGenRef.current.setVolume(ambientVolume);
      setAmbientActive(true);
    }
  };

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    if (ambientGenRef.current) {
      ambientGenRef.current.setVolume(newVol);
    }
  };

  const handleSelectPreset = (preset: ScriptPreset) => {
    setSelectedPresetId(preset.id);
    setScriptText(preset.text);
    setSelectedVoice(preset.suggestedVoice);
    setDeliveryStyle(preset.suggestedStyle);
  };

  // Generate TTS Audio via Gemini API backend
  const handleGenerateVoice = async () => {
    if (!scriptText.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          voiceName: selectedVoice,
          style: deliveryStyle,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const parsed = parseQuotaError(data);
        if (res.status === 429 || parsed.isQuotaExceeded) {
          setQuotaInfo(parsed);
          if (parsed.retrySeconds) {
            setCountdownSeconds(parsed.retrySeconds);
          }
          return;
        }
        throw new Error(data.message || data.error || `Failed with status ${res.status}`);
      }

      if (!data.audioBase64) {
        throw new Error('No audio data received.');
      }

      // Clear quota error if successful
      setQuotaInfo(null);

      // Create object URL from base64 WAV
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const newUrl = URL.createObjectURL(blob);

      setAudioUrl(newUrl);

      // Save clip metadata and audio to persistent history
      try {
        const firstSentence = scriptText.split(/[।!?\n]/)[0]?.trim();
        const derivedTitle =
          firstSentence && firstSentence.length > 5
            ? firstSentence.length > 40
              ? firstSentence.slice(0, 40) + '...'
              : firstSentence
            : SCRIPT_PRESETS.find((p) => p.text === scriptText)?.titleBn ||
              'ভয়েসঅভার অডিও ক্লিপ';

        const voiceBn =
          VOICE_OPTIONS.find((v) => v.voiceName === selectedVoice)?.nameBn ||
          selectedVoice;

        saveAudioClipToHistory({
          title: derivedTitle,
          text: scriptText,
          voiceName: selectedVoice,
          voiceNameBn: voiceBn,
          timestamp: new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          audioBase64: data.audioBase64,
        });
      } catch (histErr) {
        console.warn('History save notice:', histErr);
      }

      // Auto play newly generated audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.log('Auto-play prevented:', e));
        }
      }, 100);
    } catch (err: any) {
      const parsed = parseQuotaError(err?.message || err);
      if (parsed.isQuotaExceeded) {
        setQuotaInfo(parsed);
        if (parsed.retrySeconds) {
          setCountdownSeconds(parsed.retrySeconds);
        }
      } else {
        console.warn('TTS Generation notice:', err?.message || err);
        setErrorMessage(
          err?.message ||
            (lang === 'bn'
              ? 'ভয়েসঅভার তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।'
              : 'Failed to generate voice audio. Please try again.')
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadFromHistory = (
    text: string,
    voiceName: string,
    loadedAudioUrl?: string
  ) => {
    setScriptText(text);
    setSelectedVoice(voiceName);
    setSelectedPresetId('custom');
    if (loadedAudioUrl) {
      setAudioUrl(loadedAudioUrl);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.log('Auto-play prevented:', e));
        }
      }, 100);
    }
  };

  // Enforces exactly 20 downloads quota rule (Generating / Listening remains 100% UNLIMITED)
  const handleDownloadAudio = (clipAudioUrl?: string, clipTitle?: string) => {
    if (downloadQuota <= 0) {
      setDownloadQuotaExhaustedModal(true);
      return;
    }

    const newRemaining = downloadQuota - 1;
    setDownloadQuota(newRemaining);
    localStorage.setItem('eidnan_download_quota', String(newRemaining));

    const targetUrl = clipAudioUrl || audioUrl;
    if (targetUrl) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = `${(clipTitle || 'eidnan_voiceover').replace(/[^\w\u0980-\u09FF]/gi, '_')}.wav`;
      a.click();
    }

    setDownloadSuccessToast(
      lang === 'bn'
        ? '📥 আপনার অডিও ফাইলটি সফলভাবে ডাউনলোড হয়েছে।'
        : '📥 Audio file downloaded successfully.'
    );
    setTimeout(() => setDownloadSuccessToast(null), 5000);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // The 6 expanded Bangladeshi voice moods
  const moodPresets = [
    {
      id: 'cinematic_baritone',
      idx: '001',
      titleBn: 'গভীর ও সিনামেটিক',
      titleEn: 'Cinematic Baritone',
      descBn: 'গম্ভীর, ভারী ব্যক্তিত্বপূর্ণ ও গভীর আবেগ। তথ্যচিত্র ও গভীর কথার জন্য।',
      prompt:
        'Deep, emotional, clear, and cinematic Bangladeshi Bengali accent. Pure Bangladeshi Standard Bengali phonetics. Warm solemn baritone with natural human breathing pauses at punctuation. No foreign accent.',
    },
    {
      id: 'emotional_touching',
      idx: '002',
      titleBn: 'আবেগঘন ও হৃদয়স্পর্শী',
      titleEn: 'Emotional & Moving',
      descBn: 'ধীরস্থির, নরম ও ভেতর থেকে ছুঁয়ে যাওয়া ব্যাকুল সুর। মোনাজাত ও ব্যথিত অনুভূতির জন্য।',
      prompt:
        'Deeply moving, emotional, heartfelt, gentle Bangladeshi Bengali voice acting. Soft solemn tone, tender pauses, intimate spiritual reflection and sincere warmth with natural Bengali cadence.',
    },
    {
      id: 'inspirational_bold',
      idx: '003',
      titleBn: 'অনুপ্রেরণাদায়ী ও বলিষ্ঠ',
      titleEn: 'Inspirational & Bold',
      descBn: 'উদ্যমী, প্রত্যয়ী, বলিষ্ঠ ও তেজস্বী কণ্ঠ। অনুপ্রেরণামূলক ও জাগরণী কথার জন্য।',
      prompt:
        'Inspiring, firm, articulate, powerful baritone Bangladeshi Bengali voiceover. Confident, warm, persuasive, and dignified with crisp Bengali pronunciation and energetic delivery.',
    },
    {
      id: 'mysterious_soft',
      idx: '004',
      titleBn: 'রহস্যময় ও শান্ত',
      titleEn: 'Mysterious Soft',
      descBn: 'ফিসফিসানি, নিস্তব্ধ রাতের মতো গভীর ও কৌতূহলোদ্দীপক সুর।',
      prompt:
        'Mysterious, whispered, contemplative, low-pitched gentle Bangladeshi Bengali. Quiet and deeply atmospheric delivery for solitary nocturnal reflection.',
    },
    {
      id: 'gentle_peaceful',
      idx: '005',
      titleBn: 'স্নেহময় ও প্রশান্তিময়',
      titleEn: 'Peaceful Narrative',
      descBn: 'শান্ত, দরদি, মমতাভরা ও স্নিগ্ধ উচ্চারণ। শিশু বা ইতিবাচক বার্তার জন্য।',
      prompt:
        'Gentle, melodic, serene, tranquil Bangladeshi Bengali voice delivery. Soothing tempo, relaxed human breath pauses, peaceful, tender and reassuring resonance.',
    },
    {
      id: 'epic_storyteller',
      idx: '006',
      titleBn: 'ঐতিহাসিক ও আখ্যানমূলক',
      titleEn: 'Epic Storyteller',
      descBn: 'প্রাচীন গল্পের রূপরেখায় ক্লাসিক আবহ তৈরি করা সুর।',
      prompt:
        'Epic classical narrator voice in pure Bangladeshi Bengali. Varied pitch and pacing suitable for historical storytelling and timeless parables.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
      />

      {/* Quota Exhaustion Notice - Formatted strictly to requirement */}
      {quotaInfo && (
        <div className="liquid-glass-elevated p-6 sm:p-7 rounded-2xl border border-[#bfa065]/40 space-y-4 font-bangla animate-in fade-in relative overflow-hidden">
          {/* Subtle liquid amber glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#bfa065]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10 relative">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-xl liquid-glass border border-[#bfa065]/50 flex items-center justify-center shrink-0 text-[#bfa065] shadow-[0_0_15px_rgba(191,160,101,0.3)]">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-bold text-[#faf8f2]">
                  {lang === 'bn'
                    ? '⚠️ দৈনিক ফ্রি ভয়েস কোটা শেষ হয়ে গেছে!'
                    : '⚠️ Daily free voice quota has been exhausted!'}
                </h4>
                <p className="text-sm font-medium text-[#d8c198] flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#bfa065] shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? `⏳ আপনি পুনরায় ভয়েস তৈরি করতে পারবেন: ${
                          countdownSeconds !== null
                            ? formatCountdown(countdownSeconds)
                            : quotaInfo.remainingTimeFormattedBn
                        } পর।`
                      : `⏳ You can generate voice again in: ${
                          countdownSeconds !== null
                            ? formatCountdown(countdownSeconds)
                            : quotaInfo.remainingTimeFormattedEn
                        }.`}
                  </span>
                </p>
                <div className="text-xs text-[#9d8964] leading-relaxed pt-1">
                  {lang === 'bn' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <span>(জরুরি সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন:</span>
                      <a
                        href="https://www.facebook.com/EIDNAN.KHAN.5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[#e8d7b5] hover:text-white transition font-mono break-all font-semibold"
                      >
                        https://www.facebook.com/EIDNAN.KHAN.5
                      </a>
                      <span>)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <span>(For urgent support, contact admin:</span>
                      <a
                        href="https://www.facebook.com/EIDNAN.KHAN.5"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[#e8d7b5] hover:text-white transition font-mono break-all font-semibold"
                      >
                        https://www.facebook.com/EIDNAN.KHAN.5
                      </a>
                      <span>)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0 pt-1">
              <button
                onClick={handleGenerateVoice}
                className="liquid-glass-button px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 text-[#faf8f2] border border-white/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#bfa065]" />
                <span>{lang === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}</span>
              </button>

              <AdminContactLink variant="navbar" lang={lang} />
            </div>
          </div>

          {/* Embedded Liquid Glass Admin Card */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl liquid-glass border border-white/15">
            <div className="flex items-center space-x-3">
              <AdminAvatar size="sm" showOnlineDot={true} />
              <div>
                <p className="font-editorial text-xs font-bold text-[#faf8f2]">EIDNAN Khan (অ্যাডমিন)</p>
                <p className="text-[11px] font-bangla text-[#9eaebb]">কোটা বৃদ্ধি বা জরুরি সমাধানের জন্য ফেসবুক ইনবক্স করুন</p>
              </div>
            </div>
            <a
              href="https://www.facebook.com/EIDNAN.KHAN.5"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-pill px-3 py-1.5 rounded-lg text-xs font-semibold text-[#bfa065] hover:text-white flex items-center space-x-1.5 border border-[#bfa065]/40"
            >
              <span>মেসেজ দিন</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Main Studio Console - Designed with Liquid Glass & Precision */}
      <div className="liquid-glass rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200/90 shadow-sm">
        {/* Stage Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#bfa065]" />
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#0f172a]">
              {lang === 'bn' ? 'স্ক্রিপ্ট ও ভয়েসঅভার কনসোল' : 'Script & Voiceover Console'}
            </h3>
            <span className="boring-keycap text-[10px]">24kHz WAV</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyScript}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-mono-code text-[#475569] hover:text-[#0f172a] border border-slate-200/90 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>স্ক্রিপ্ট কপি</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggleAmbient}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code border transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                ambientActive
                  ? 'bg-amber-50 text-[#bfa065] border-amber-300 font-semibold'
                  : 'bg-white text-[#64748b] border-slate-200/90 hover:text-[#0f172a]'
              }`}
              title="Toggle subtle atmospheric tone"
            >
              <Music className="w-3.5 h-3.5" />
              <span>{ambientActive ? 'আবহ: চালু' : 'আবহ: বন্ধ'}</span>
            </button>
          </div>
        </div>

        {/* Preset Script Selection Pills */}
        <div>
          <div className="text-xs font-mono-code text-[#64748b] mb-2 uppercase tracking-wider font-semibold">
            {lang === 'bn' ? 'স্ক্রিপ্ট প্রিসেট নির্বাচন:' : 'Curated Script Presets:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {SCRIPT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bangla transition flex items-center space-x-1.5 border cursor-pointer ${
                  selectedPresetId === p.id
                    ? 'bg-amber-50 text-[#0f172a] border-[#bfa065] shadow-xs font-semibold'
                    : 'bg-white text-[#475569] hover:text-[#0f172a] border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${selectedPresetId === p.id ? 'text-[#bfa065]' : 'text-slate-400'}`} />
                <span>{lang === 'bn' ? p.titleBn : p.titleEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Teleprompter / Script Input */}
        <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 sm:p-5 focus-within:border-[#bfa065] focus-within:bg-white transition shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono-code text-[#64748b] mb-2">
            <span className="flex items-center space-x-1 text-[#bfa065]">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-bangla font-semibold text-[#0f172a]">
                {lang === 'bn' ? 'বাংলা স্ক্রিপ্ট (সরাসরি সম্পাদনাযোগ্য)' : 'Bengali Script'}
              </span>
            </span>
            <span>
              {scriptText.trim().split(/\s+/).filter(Boolean).length} {lang === 'bn' ? 'শব্দ' : 'words'} ·{' '}
              {scriptText.length} অক্ষর
            </span>
          </div>

          <textarea
            value={scriptText}
            onChange={(e) => {
              setScriptText(e.target.value);
              setSelectedPresetId('custom');
            }}
            rows={5}
            className="w-full bg-transparent text-base sm:text-lg font-bangla font-normal text-[#0f172a] placeholder-[#94a3b8] leading-relaxed focus:outline-none resize-y selection:bg-[#bfa065]/20 selection:text-[#0f172a]"
            placeholder={
              lang === 'bn'
                ? 'এখানে যেকোনো বাংলা স্ক্রিপ্ট লিখুন...'
                : 'Write your Bengali script here...'
            }
          />
        </div>

        {/* 6 Expanded Voice Moods (001 - 006) - TheBoringBlog Chapter Cards */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono-code text-[#64748b] mb-2.5 uppercase tracking-wider font-semibold">
            <span>{lang === 'bn' ? 'আবৃত্তি মুড ও কণ্ঠের প্রকাশভঙ্গি' : 'Select Mood & Tone'}</span>
            <span className="text-[#bfa065]">001 — 006</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {moodPresets.map((m) => {
              const isSelected = deliveryStyle === m.prompt && !customStyleActive;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setDeliveryStyle(m.prompt);
                    setCustomStyleActive(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 border-[#bfa065] text-[#0f172a] shadow-xs'
                      : 'bg-white border-slate-200/90 text-[#475569] hover:border-slate-300 hover:text-[#0f172a]'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`font-mono-code text-xs font-bold ${isSelected ? 'text-[#bfa065]' : 'text-slate-400'}`}>
                      {m.idx}
                    </span>
                    <span className="text-[10px] font-mono-code text-[#64748b]">
                      {m.titleEn}
                    </span>
                  </div>
                  <h4 className="font-bangla font-semibold text-xs text-[#0f172a] mb-0.5">
                    {m.titleBn}
                  </h4>
                  <p className="font-bangla text-[11px] text-[#64748b] line-clamp-2 leading-relaxed">
                    {m.descBn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Persona Selector & Generation Trigger */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Persona selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono-code text-[#64748b] font-semibold">
              {lang === 'bn' ? 'কণ্ঠশিল্পী:' : 'Voice:'}
            </span>
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.voiceName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition border cursor-pointer ${
                  selectedVoice === v.voiceName
                    ? 'bg-amber-50 text-[#0f172a] border-[#bfa065] font-semibold shadow-xs'
                    : 'bg-white text-[#475569] border-slate-200/90 hover:text-[#0f172a] hover:bg-slate-50'
                }`}
              >
                <span>{v.voiceName}</span>
                {v.voiceName === 'Fenrir' && (
                  <span className="ml-1 text-[10px] text-[#bfa065]">★</span>
                )}
              </button>
            ))}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleGenerateVoice}
            disabled={isGenerating || !scriptText.trim()}
            className="boring-button px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="font-bangla">ভয়েসঅভার তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-[#bfa065] text-[#bfa065]" />
                <span className="font-bangla">
                  {lang === 'bn' ? 'গভীর ও প্রমিত কণ্ঠে শুনুন' : 'Generate Voiceover'}
                </span>
                <span className="boring-keycap text-[10px] ml-1">↵</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Non-quota Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bangla text-red-700 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Audio Player Card - Audiophile Stage with Liquid Glass */}
      {audioUrl && (
        <div className="liquid-glass-elevated p-6 sm:p-7 rounded-2xl space-y-5 border border-slate-200/90 animate-in fade-in shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
            {/* Play/Pause & Title */}
            <div className="flex items-center space-x-3.5">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition shadow-sm cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-[#bfa065] text-[#bfa065] translate-x-0.5" />
                )}
              </button>

              <div>
                <h4 className="font-editorial text-base font-bold text-[#0f172a] flex items-center space-x-2">
                  <span>{lang === 'bn' ? 'স্টুডিও মাস্টার প্লেয়ার' : 'Studio Master Player'}</span>
                  {isPlaying && (
                    <span className="flex space-x-1 items-end h-3.5">
                      <span className="w-1 bg-[#bfa065] rounded-full wave-bar-1" />
                      <span className="w-1 bg-[#bfa065] rounded-full wave-bar-2" />
                      <span className="w-1 bg-[#bfa065] rounded-full wave-bar-3" />
                      <span className="w-1 bg-[#bfa065] rounded-full wave-bar-4" />
                    </span>
                  )}
                </h4>
                <p className="text-xs font-mono-code text-[#64748b]">
                  24kHz WAV · {selectedVoice} · {formatSeconds(currentTime)} / {formatSeconds(duration)}
                </p>
              </div>
            </div>

            {/* Playback Speeds & Download Action */}
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono-code">
                {[0.8, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2 py-0.5 rounded transition ${
                      playbackRate === rate
                        ? 'bg-white text-[#0f172a] font-semibold shadow-xs'
                        : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownloadAudio()}
                className="boring-button px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 text-white cursor-pointer"
                title={lang === 'bn' ? 'অডিও ফাইল ডাউনলোড করুন' : 'Download Audio File'}
              >
                <Download className="w-3.5 h-3.5 text-[#bfa065]" />
                <span className="font-bangla">
                  {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                </span>
              </button>
            </div>
          </div>

          {/* Timeline Range Scrubber */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 rounded-lg bg-slate-200 appearance-none cursor-pointer accent-[#bfa065]"
            />
            <div className="flex justify-between text-[11px] font-mono-code text-[#64748b]">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Download Toast Notification */}
          {downloadSuccessToast && (
            <div className="flex items-center justify-between gap-2 text-xs font-bangla pt-2 border-t border-slate-200/80">
              <span className="text-emerald-700 text-xs font-semibold animate-in fade-in">
                {downloadSuccessToast}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Download Quota Exhausted Modal with Liquid Glass & Photo */}
      {downloadQuotaExhaustedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="liquid-glass-elevated max-w-md w-full p-6 sm:p-7 rounded-2xl space-y-4 border border-[#bfa065]/50 text-left shadow-2xl relative overflow-hidden bg-white/95">
            <div className="flex items-center space-x-2 text-[#bfa065]">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-editorial text-base font-bold text-[#0f172a]">
                {lang === 'bn' ? 'ডাউনলোড কোটা পূর্ণ হয়েছে' : 'Download Quota Exhausted'}
              </h4>
            </div>
            <p className="font-bangla text-xs text-[#475569] leading-relaxed">
              {lang === 'bn'
                ? 'আপনার ফ্রি অডিও ফাইল ডাউনলোড কোটা শেষ হয়েছে। তবে ভয়েস তৈরি করা ও সরাসরি প্রিভিউ শোনা সম্পূর্ণ আনলিমিটেড ও ফ্রি থাকবে।'
                : 'Your free audio file download quota has been exhausted. However, generating voice and streaming previews remains 100% free and unlimited.'}
            </p>
            <div className="p-3.5 rounded-xl liquid-glass border border-slate-200/90 space-y-2">
              <p className="text-xs font-bangla text-[#926b20] font-medium">
                অতিরিক্ত ডাউনলোড কোটা পেতে অ্যাডমিনের সাথে ফেসবুকে যোগাযোগ করুন:
              </p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2.5">
                  <AdminAvatar size="sm" showOnlineDot={true} />
                  <div>
                    <span className="font-editorial text-xs font-bold text-[#0f172a] block">
                      EIDNAN Khan
                    </span>
                    <span className="text-[10px] font-mono-code text-[#64748b]">
                      System Admin
                    </span>
                  </div>
                </div>
                <a
                  href="https://www.facebook.com/EIDNAN.KHAN.5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-glass-pill px-3 py-1.5 rounded-lg text-xs font-semibold text-[#bfa065] hover:text-[#0f172a] flex items-center space-x-1.5 border border-[#bfa065]/50"
                >
                  <span>ইনবক্স করুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <button
              onClick={() => setDownloadQuotaExhaustedModal(false)}
              className="w-full liquid-glass-button py-2.5 rounded-xl text-xs font-semibold text-[#0f172a] cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Audio Archive / History Component */}
      <AudioHistory
        onLoadScript={handleLoadFromHistory}
        onDownloadClip={(item) => handleDownloadAudio(undefined, item.title)}
        lang={lang}
      />
    </div>
  );
};
