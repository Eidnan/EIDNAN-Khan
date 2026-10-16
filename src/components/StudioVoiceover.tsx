import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Volume2,
  Sparkles,
  Sliders,
  Copy,
  Check,
  Music,
  FileText,
  Mic,
  Bookmark,
  ShieldCheck,
  AudioWaveform,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { SCRIPT_PRESETS, VOICE_OPTIONS, ScriptPreset, VoiceOption } from '../data/presets';
import { createAmbientGenerator } from '../utils/audioUtils';
import { parseQuotaError, QuotaErrorInfo } from '../utils/quotaHelper';

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

  // Format seconds into Bengali / English string
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (lang === 'bn') {
      return `${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
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
      console.error('TTS Generation error:', err);
      const parsed = parseQuotaError(err?.message || err);
      if (parsed.isQuotaExceeded) {
        setQuotaInfo(parsed);
        if (parsed.retrySeconds) {
          setCountdownSeconds(parsed.retrySeconds);
        }
      } else {
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

  // Emotion style chips
  const stylePresets = [
    {
      id: 'deep_cinematic',
      labelBn: 'গভীর ও সিনেম্যাটিক',
      labelEn: 'Deep & Cinematic',
      prompt:
        'Deep, emotional, clear, and cinematic Bangladeshi Bengali accent. Warm solemn baritone with natural pauses and spiritual reverence. Pronounce every Bengali word naturally without English.',
    },
    {
      id: 'emotional_soothing',
      labelBn: 'আবেগঘন ও হৃদয়স্পর্শী',
      labelEn: 'Emotional & Moving',
      prompt:
        'Deeply moving, emotional, heartfelt, gentle Bangladeshi Bengali voice acting. Soft solemn tone, tender pauses, intimate spiritual reflection.',
    },
    {
      id: 'solemn_whispers',
      labelBn: 'ভাবগম্ভীর ও অনুতপ্ত',
      labelEn: 'Solemn & Repentant',
      prompt:
        'Solemn, contemplative, low-pitched, whispery dignified Bangladeshi Bengali. Sincere, remorseful, heart-touching Islamic tone.',
    },
    {
      id: 'inspirational',
      labelBn: 'প্রেরণাদায়ী ও বলিষ্ঠ',
      labelEn: 'Inspirational & Bold',
      prompt:
        'Inspiring, firm, articulate, powerful baritone Bangladeshi Bengali voiceover. Confident, warm, persuasive and dignified.',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
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

      {/* Quota Exhaustion Formatted Card */}
      {quotaInfo && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#211707] via-[#1a1205] to-[#120e06] border-2 border-amber-500/70 shadow-2xl space-y-4 font-bangla animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-800/40">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-md shadow-amber-900/30">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-amber-200">
                  {lang === 'bn'
                    ? `⚠️ আপনার আজকের ফ্রি ভয়েস কোটা শেষ হয়ে গেছে${
                        quotaInfo.totalQuota
                          ? ` (মোট লিমিট ছিল: ${quotaInfo.totalQuota} টি)`
                          : ''
                      }!`
                    : `⚠️ Your daily free voice quota has been exhausted${
                        quotaInfo.totalQuota
                          ? ` (Total limit was: ${quotaInfo.totalQuota})`
                          : ''
                      }!`}
                </h4>
                <p className="text-sm font-semibold text-amber-300/90 flex items-center space-x-2 mt-0.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? `⏳ আপনি আবার নতুন ভয়েস তৈরি করতে পারবেন: ${
                          countdownSeconds !== null
                            ? formatCountdown(countdownSeconds)
                            : quotaInfo.remainingTimeFormattedBn
                        } পর।`
                      : `⏳ You will be able to generate new voice again in: ${
                          countdownSeconds !== null
                            ? formatCountdown(countdownSeconds)
                            : quotaInfo.remainingTimeFormattedEn
                        }.`}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateVoice}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#223030] hover:bg-[#2c3d3d] text-emerald-300 text-xs font-bold border border-emerald-700/50 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Cloud'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero script showcase banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111f1f] via-[#0d1616] to-[#090e0e] border border-emerald-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 font-bangla">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'ভয়েস অ্যাক্টর' : 'Voice Actor'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium font-bangla">
                {lang === 'bn' ? 'বাংলাদেশি বাংলা উচ্চারণ' : 'Bangladeshi Accent'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyScript}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#142323] hover:bg-[#1a2d2d] text-xs text-zinc-300 border border-emerald-900/40 transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="font-bangla">
                  {copied
                    ? lang === 'bn'
                      ? 'কপি হয়েছে'
                      : 'Copied'
                    : lang === 'bn'
                    ? 'স্ক্রিপ্ট কপি'
                    : 'Copy Script'}
                </span>
              </button>

              <button
                onClick={handleToggleAmbient}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  ambientActive
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-sm shadow-emerald-900/50'
                    : 'bg-[#142323] text-zinc-400 border-emerald-900/40 hover:text-zinc-200'
                }`}
                title={
                  lang === 'bn'
                    ? 'আবহ সুর অন/অফ'
                    : 'Toggle Ambient Atmosphere'
                }
              >
                <Music
                  className={`w-3.5 h-3.5 ${
                    ambientActive ? 'text-amber-400 animate-pulse' : ''
                  }`}
                />
                <span className="font-bangla">
                  {lang === 'bn'
                    ? ambientActive
                      ? 'আবহ সুর: চালু'
                      : 'আবহ সুর: বন্ধ'
                    : ambientActive
                    ? 'Atmosphere: On'
                    : 'Atmosphere: Off'}
                </span>
              </button>
            </div>
          </div>

          {/* Preset script selector pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {SCRIPT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition font-bangla flex items-center space-x-1.5 ${
                  selectedPresetId === p.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400/40'
                    : 'bg-[#101b1b] text-zinc-300 hover:bg-[#162525] border border-emerald-900/30'
                }`}
              >
                <Bookmark className="w-3 h-3 text-emerald-300" />
                <span>{lang === 'bn' ? p.titleBn : p.titleEn}</span>
              </button>
            ))}
          </div>

          {/* Teleprompter / Script Display Box */}
          <div className="relative group">
            <div className="w-full min-h-[140px] p-5 sm:p-6 rounded-2xl bg-[#091010]/90 border border-emerald-700/40 focus-within:border-emerald-500 shadow-inner">
              <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1 text-emerald-400 font-bangla">
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn'
                      ? 'মূল স্ক্রিপ্ট (এখানে সম্পাদনা করতে পারেন)'
                      : 'Teleprompter Script (Editable)'}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {scriptText.trim().split(/\s+/).filter(Boolean).length}{' '}
                  {lang === 'bn' ? 'শব্দ' : 'words'}
                </span>
              </div>

              <textarea
                value={scriptText}
                onChange={(e) => {
                  setScriptText(e.target.value);
                  setSelectedPresetId('custom');
                }}
                rows={4}
                className="w-full bg-transparent text-lg sm:text-xl font-bangla font-medium text-emerald-100/95 leading-relaxed focus:outline-none resize-y selection:bg-emerald-600 selection:text-white"
                placeholder={
                  lang === 'bn'
                    ? 'এখানে যেকোনো বাংলা স্ক্রিপ্ট লিখুন...'
                    : 'Write Bengali script here...'
                }
              />
            </div>
          </div>

          {/* Quick Voice & Action bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-emerald-900/30">
            {/* Active Voice Actor preview */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-emerald-600 p-0.5">
                <div className="w-full h-full bg-[#0d1616] rounded-[10px] flex items-center justify-center">
                  <Mic className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-bangla">
                  {lang === 'bn'
                    ? 'নির্বাচিত ভয়েস অ্যাক্টর:'
                    : 'Selected Voice Actor:'}
                </p>
                <p className="text-sm font-semibold text-white font-bangla">
                  {VOICE_OPTIONS.find((v) => v.voiceName === selectedVoice)
                    ?.nameBn || selectedVoice}
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleGenerateVoice}
              disabled={isGenerating || !scriptText.trim()}
              className="relative group overflow-hidden px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-600 text-white font-bold text-base shadow-xl shadow-emerald-900/40 hover:shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] transition duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2.5 font-bangla cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {lang === 'bn'
                      ? 'ভয়েসঅভার তৈরি হচ্ছে...'
                      : 'Generating Cinematic Voice...'}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>
                    {lang === 'bn'
                      ? 'এখনই গভীর আবেগময় কণ্ঠে আবৃত্তি শুনুন'
                      : 'Speak in Deep Voice Actor Tone'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error notification banner if any non-quota error */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center space-x-2 font-bangla">
          <ShieldCheck className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Audio Player Card (when audio is generated) */}
      {audioUrl && (
        <div className="rounded-3xl bg-gradient-to-b from-[#122020] to-[#0c1515] border border-emerald-600/40 p-6 sm:p-7 shadow-2xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center shadow-lg shadow-emerald-900/60 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black translate-x-0.5" />
                )}
              </button>

              <div>
                <h3 className="text-base font-bold text-white font-bangla flex items-center space-x-2">
                  <span>
                    {lang === 'bn'
                      ? 'প্রফেশনাল ভয়েসঅভার প্লেয়ার'
                      : 'Professional Voiceover Player'}
                  </span>
                  {isPlaying && (
                    <span className="flex space-x-0.5 items-end h-4">
                      <span className="w-1 bg-emerald-400 rounded-full animate-wave-1" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-wave-2" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-wave-3" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-wave-4" />
                    </span>
                  )}
                </h3>
                <p className="text-xs text-emerald-300/70 font-bangla">
                  24kHz Studio WAV •{' '}
                  {
                    VOICE_OPTIONS.find((v) => v.voiceName === selectedVoice)
                      ?.nameBn
                  }{' '}
                  • {formatSeconds(currentTime)} / {formatSeconds(duration)}
                </p>
              </div>
            </div>

            {/* Controls: Speed & Download */}
            <div className="flex items-center space-x-2">
              {/* Playback speed buttons */}
              <div className="flex items-center bg-[#091010] p-1 rounded-xl border border-emerald-900/40 text-xs">
                {[0.8, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-medium transition ${
                      playbackRate === rate
                        ? 'bg-emerald-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Download WAV button */}
              <a
                href={audioUrl}
                download="bangla_voiceover_hadith.wav"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md transition font-bangla"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ডাউনলোড WAV' : 'Download WAV'}</span>
              </a>
            </div>
          </div>

          {/* Progress Timeline Scrubber */}
          <div className="mt-5 space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg bg-[#091010] appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-xs text-zinc-400 font-mono">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Ambient atmosphere slider if enabled */}
          {ambientActive && (
            <div className="mt-4 pt-4 border-t border-emerald-900/30 flex items-center justify-between text-xs text-emerald-300/80 font-bangla bg-[#081010]/60 p-3 rounded-xl">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  {lang === 'bn'
                    ? 'আবহ সুরের ভলিউম (শান্ত আধ্যাত্মিক ড্রোন):'
                    : 'Atmospheric Drone Volume:'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.3}
                step={0.01}
                value={ambientVolume}
                onChange={(e) =>
                  handleAmbientVolumeChange(parseFloat(e.target.value))
                }
                className="w-32 h-1.5 bg-zinc-800 rounded-lg accent-amber-400 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* Voice Actor & Style Customizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Persona Selection */}
        <div className="rounded-2xl bg-[#0d1616]/90 border border-emerald-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-bangla flex items-center space-x-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === 'bn'
                  ? 'ভয়েস অ্যাক্টর নির্বাচন করুন'
                  : 'Select Voice Actor'}
              </span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-bangla">
              {lang === 'bn' ? '৫টি বিশেষ ভয়েস' : '5 Presets'}
            </span>
          </div>

          <div className="space-y-2.5">
            {VOICE_OPTIONS.map((v) => {
              const isSelected = selectedVoice === v.voiceName;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v.voiceName)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-950/50'
                      : 'bg-[#101919] border-emerald-900/20 hover:border-emerald-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#182626] text-zinc-400'
                      }`}
                    >
                      {v.voiceName[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-white font-bangla">
                          {lang === 'bn' ? v.nameBn : v.nameEn}
                        </h4>
                        {v.voiceName === 'Fenrir' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bangla">
                            {lang === 'bn'
                              ? 'অনুরোধে সুপারিশকৃত'
                              : 'Recommended'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-bangla">
                        {lang === 'bn' ? v.toneBn : v.toneEn}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Tone & Emotion Direction */}
        <div className="rounded-2xl bg-[#0d1616]/90 border border-emerald-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-bangla flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>
                {lang === 'bn'
                  ? 'আবৃত্তি ভঙ্গি ও অনুভূতির ডিরেকশন'
                  : 'Tone & Style Direction'}
              </span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-bangla">
              {lang === 'bn' ? 'ভয়েস ডিরেকশন প্রম্পট' : 'Direction Prompt'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {stylePresets.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setDeliveryStyle(st.prompt);
                  setCustomStyleActive(false);
                }}
                className={`p-2.5 rounded-xl text-left border transition font-bangla ${
                  deliveryStyle === st.prompt && !customStyleActive
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-sm'
                    : 'bg-[#101919] border-emerald-900/20 text-zinc-300 hover:border-emerald-800/40'
                }`}
              >
                <div className="text-xs font-semibold">
                  {lang === 'bn' ? st.labelBn : st.labelEn}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs text-zinc-400 font-bangla flex items-center justify-between">
              <span>
                {lang === 'bn'
                  ? 'কাস্টম ভয়েস ডিরেকশন (মডেলের নির্দেশিকা):'
                  : 'Custom Voice Acting Instructions:'}
              </span>
            </label>
            <textarea
              value={deliveryStyle}
              onChange={(e) => {
                setDeliveryStyle(e.target.value);
                setCustomStyleActive(true);
              }}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-[#081010] border border-emerald-900/40 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Tips card */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-200/80 font-bangla space-y-1">
            <p className="font-semibold text-emerald-300 flex items-center space-x-1">
              <AudioWaveform className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {lang === 'bn' ? 'কণ্ঠশিল্পীর পরামর্শ:' : 'Director Advice:'}
              </span>
            </p>
            <p>
              {lang === 'bn'
                ? 'বাংলা স্ক্রিপ্টে ড্যাশ (—) ও কমা (,) ব্যবহার করলে ভয়েস অ্যাক্টর স্বাভাবিক শ্বাস ও বিরতি গ্রহণ করে, যা আবৃত্তিকে আরো আকর্ষণীয় ও হৃদয়স্পর্শী করে তোলে।'
                : 'Punctuation like em-dashes (—) and commas guide the voice actor to insert dramatic breathing and emotional pauses.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
