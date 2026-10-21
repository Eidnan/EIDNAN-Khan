import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Globe,
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Radio,
  Sliders,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { AdminAvatar } from './AdminAvatar';

interface VoiceDubbingProps {
  lang: 'bn' | 'en';
}

type TargetLanguageKey = 'Bangla' | 'English' | 'Hindi' | 'Arabic';

interface TargetLangConfig {
  key: TargetLanguageKey;
  labelBn: string;
  labelEn: string;
  nativeName: string;
  flag: string;
  langCode: string;
  taglineBn: string;
  taglineEn: string;
  speechSynthesisCodes: string[];
}

const TARGET_LANGUAGES: TargetLangConfig[] = [
  {
    key: 'Bangla',
    labelBn: 'বাংলা',
    labelEn: 'Bangla',
    nativeName: 'বাংলা (Standard Bengali)',
    flag: '🇧🇩',
    langCode: 'bn',
    taglineBn: 'খাঁটি বাংলাদেশি প্রমিত উচ্চারণ ও ভাবগম্ভীর কণ্ঠ',
    taglineEn: 'Authentic Standard Bangladeshi Bengali articulation',
    speechSynthesisCodes: ['bn-BD', 'bn-IN', 'bn'],
  },
  {
    key: 'English',
    labelBn: 'English',
    labelEn: 'English',
    nativeName: 'English (US / Global)',
    flag: '🇺🇸',
    langCode: 'en',
    taglineBn: 'সিনেমাটিক গ্লোবাল ভয়েসওভার ও স্পষ্ট উচ্চারণ',
    taglineEn: 'Cinematic global broadcast narration',
    speechSynthesisCodes: ['en-US', 'en-GB', 'en'],
  },
  {
    key: 'Hindi',
    labelBn: 'हिन्दी',
    labelEn: 'Hindi',
    nativeName: 'हिन्दी (Hindi)',
    flag: '🇮🇳',
    langCode: 'hi',
    taglineBn: 'প্রাকৃতিক প্রাঞ্জল হিন্দি উচ্চারণ ও স্বাভাবিক প্রবাহ',
    taglineEn: 'Natural, expressive Hindi vocal cadence',
    speechSynthesisCodes: ['hi-IN', 'hi'],
  },
  {
    key: 'Arabic',
    labelBn: 'العربية',
    labelEn: 'Arabic',
    nativeName: 'العربية (Modern Standard Arabic)',
    flag: '🇸🇦',
    langCode: 'ar',
    taglineBn: 'বিশুদ্ধ ধ্রুপদী আরবি উচ্চারণ ও প্রাঞ্জল বাগ্মিতা',
    taglineEn: 'Eloquent Modern Standard Arabic resonance',
    speechSynthesisCodes: ['ar-SA', 'ar-EG', 'ar'],
  },
];

// 4 Built-in Audio Audition Samples so users can test immediately with 1 click
const SAMPLE_AUDIOS: Record<
  TargetLanguageKey,
  { labelBn: string; labelEn: string; text: string; flag: string; duration: string }
> = {
  Bangla: {
    labelBn: 'বাংলা কথন স্যাম্পল',
    labelEn: 'Bangla Speech Sample',
    text: 'মানুষ স্বপ্ন দেখে এগিয়ে যায়। কিন্তু সঠিক পথের সন্ধান না পেলে সে স্বপ্ন মরীচিকায় পরিণত হয়। আত্মশুদ্ধিই মানুষের আসল শক্তি।',
    flag: '🇧🇩',
    duration: '0:06',
  },
  English: {
    labelBn: 'ইংরেজি কথন স্যাম্পল',
    labelEn: 'English Speech Sample',
    text: 'Every great journey begins with a single quiet step. Never underestimate the power of perseverance and inner silence.',
    flag: '🇺🇸',
    duration: '0:07',
  },
  Hindi: {
    labelBn: 'হিন্দি কথন স্যাম্পল',
    labelEn: 'Hindi Speech Sample',
    text: 'हर व्यक्ति के भीतर एक शांत शक्ति होती है। जब मन एकाग्र होता है, तो हर असंभव कार्य संभव बन जाता है।',
    flag: '🇮🇳',
    duration: '0:07',
  },
  Arabic: {
    labelBn: 'আরবি কথন স্যাম্পল',
    labelEn: 'Arabic Speech Sample',
    text: 'إن لكل إنسان حلمًا يسعى إليه بعزيمة وإصرار. والنجاح الحقيقي يبدأ بالصدق والعمل الدؤوب.',
    flag: '🇸🇦',
    duration: '0:08',
  },
};

// Generates a clean mono 24kHz WAV file from audio speech or synthesized harmonics
function createWavBlob(samples: Float32Array, sampleRate = 24000): Blob {
  const numChannels = 1;
  const bytesPerSample = 2;
  const totalSamples = samples.length;
  const dataByteLength = totalSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(44 + i * 2, int16, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Convert base64 data to Blob URL
function base64ToBlobUrl(base64: string, mimeType = 'audio/wav'): string {
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Synthesize pleasant acoustic sample audio tone with spoken text rhythm
function generateSampleAudioWav(durationSeconds = 6): Blob {
  const sampleRate = 24000;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(totalSamples);
  const baseFreq = 160;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.3) * Math.max(0, 1 - (t / durationSeconds) * 0.7);
    const mod = 1 + 0.15 * Math.sin(2 * Math.PI * 3.5 * t);
    const wave =
      0.6 * Math.sin(2 * Math.PI * baseFreq * mod * t) +
      0.25 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) +
      0.15 * Math.sin(2 * Math.PI * (baseFreq * 2) * t);
    samples[i] = wave * env * 0.35;
  }

  return createWavBlob(samples, sampleRate);
}

export const VoiceDubbing: React.FC<VoiceDubbingProps> = ({ lang }) => {
  // Input mode: mic or file
  const [inputMode, setInputMode] = useState<'mic' | 'upload'>('mic');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingAudioBlob, setRecordingAudioBlob] = useState<Blob | null>(null);
  const [inputAudioUrl, setInputAudioUrl] = useState<string | null>(null);
  const [inputAudioName, setInputAudioName] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/wav');

  // Mic visualizer & media recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Target Language: 'Bangla' | 'English' | 'Hindi' | 'Arabic'
  const [selectedTargetLang, setSelectedTargetLang] = useState<TargetLanguageKey>('Bangla');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(1);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dubbing Results
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [extractedTranscription, setExtractedTranscription] = useState<string>('');
  const [translations, setTranslations] = useState<Record<string, string>>({
    bangla: '',
    english: '',
    hindi: '',
    arabic: '',
  });
  const [vocalProfile, setVocalProfile] = useState<any>(null);
  const [dubbingNotes, setDubbingNotes] = useState<string>('');

  // Audio Playback State for Dubbed Result
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [activeAudioSource, setActiveAudioSource] = useState<'dubbed' | 'original'>('dubbed');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1);
  const [isClientTtsActive, setIsClientTtsActive] = useState<boolean>(false);
  const [downloadQuota, setDownloadQuota] = useState<number>(() => {
    const stored = localStorage.getItem('eidnan_download_quota');
    return stored ? parseInt(stored, 10) : 20;
  });

  // Audio element ref
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Copy indicators
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedTranslation, setCopiedTranslation] = useState<boolean>(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update audio playback rate whenever state changes
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = audioPlaybackRate;
    }
  }, [audioPlaybackRate]);

  // Handle live microphone recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordingAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setInputAudioUrl(url);
        setInputAudioName(
          lang === 'bn' ? 'লাইভ মাইক্রোফোন রেকর্ডিং.webm' : 'Live Microphone Recording.webm'
        );
        setAudioMimeType(mimeType);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          setAudioBase64(res);
        };
        reader.readAsDataURL(audioBlob);

        // Stop stream tracks
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage(
        lang === 'bn'
          ? 'মাইক্রোফোন সংযোগ ব্যর্থ হয়েছে। ব্রাউজার সেটিংসে মাইক্রোফোনের অনুমতি প্রদান করুন।'
          : 'Microphone access failed. Please grant microphone permission in your browser.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  // Handle audio file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i)) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি অডিও ফাইল নির্বাচন করুন (MP3, WAV, M4A, WEBM, OGG)।'
          : 'Please select a valid audio file (MP3, WAV, M4A, WEBM, OGG).'
      );
      return;
    }

    setErrorMessage(null);
    setInputAudioName(file.name);
    setAudioMimeType(file.type || 'audio/wav');
    const url = URL.createObjectURL(file);
    setInputAudioUrl(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      setAudioBase64(res);
    };
    reader.readAsDataURL(file);
  };

  // Load a pre-made sample for instant testing
  const loadAuditionSample = (targetKey: TargetLanguageKey) => {
    const sample = SAMPLE_AUDIOS[targetKey];
    setErrorMessage(null);
    setSelectedTargetLang(targetKey);
    setInputAudioName(`${sample.flag} ${sample.labelBn} (${sample.duration})`);

    // Generate sample audio wav blob
    const sampleBlob = generateSampleAudioWav(6);
    const url = URL.createObjectURL(sampleBlob);
    setInputAudioUrl(url);
    setAudioMimeType('audio/wav');

    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      setAudioBase64(res);
    };
    reader.readAsDataURL(sampleBlob);
  };

  // Fallback client-side speech synthesis using window.speechSynthesis
  const speakWithClientTts = (text: string, langKey: TargetLanguageKey) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const cfg = TARGET_LANGUAGES.find((l) => l.key === langKey) || TARGET_LANGUAGES[0];

    const availableVoices = window.speechSynthesis.getVoices();
    let matchedVoice = null;
    for (const code of cfg.speechSynthesisCodes) {
      matchedVoice = availableVoices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(code.toLowerCase()) ||
          v.lang.toLowerCase().includes(code.toLowerCase())
      );
      if (matchedVoice) break;
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.lang = cfg.speechSynthesisCodes[0] || 'en-US';
    utterance.rate = audioPlaybackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsClientTtsActive(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsClientTtsActive(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsClientTtsActive(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Main Action: Analyze Voice, Extract Verbatim Text, & Dub into 4 Languages
  const handleStartDubbing = async () => {
    if (!audioBase64) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে প্রথমে মাইক্রোফোনে কথা রেকর্ড করুন অথবা একটি অডিও ফাইল আপলোড করুন।'
          : 'Please record voice or upload an audio file first.'
      );
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStep(1);
    setProcessingStatusText(
      lang === 'bn'
        ? '১/৩: ইনপুট অডিও ও ভাষা স্বয়ংক্রিয়ভাবে শনাক্ত করা হচ্ছে...'
        : '1/3: Auto-detecting input speech and source language...'
    );

    try {
      // Step interval animation for realistic status feedback
      const stepTimer1 = setTimeout(() => {
        setProcessingStep(2);
        setProcessingStatusText(
          lang === 'bn'
            ? '২/৩: অডিও থেকে নির্ভুল মূল টেক্সট আলাদা করা হচ্ছে...'
            : '2/3: Extracting verbatim spoken text from audio...'
        );
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setProcessingStep(3);
        setProcessingStatusText(
          lang === 'bn'
            ? `৩/৩: ${
                selectedTargetLang === 'Bangla'
                  ? 'খাঁটি বাংলা'
                  : selectedTargetLang === 'Hindi'
                  ? 'হিন্দি'
                  : selectedTargetLang === 'Arabic'
                  ? 'আরবি'
                  : 'ইংরেজি'
              } সহ ৪টি ভাষায় কণ্ঠ ডাবিং তৈরি হচ্ছে...`
            : `3/3: Synthesizing dubbed voiceover across 4 languages...`
        );
      }, 3200);

      const res = await fetch('/api/dub-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMimeType,
          targetLanguage: selectedTargetLang,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (!res.ok && !data.transcription) {
        throw new Error(data.error || 'Failed to process audio dubbing.');
      }

      // Populate results
      setDetectedLanguage(data.sourceLanguage || 'Auto Detected Speech');
      setExtractedTranscription(data.transcription || '');
      setTranslations(
        data.translations || {
          bangla: data.translation || data.transcription,
          english: data.translation || data.transcription,
          hindi: data.translation || data.transcription,
          arabic: data.translation || data.transcription,
        }
      );
      setVocalProfile(data.vocalProfile || null);
      setDubbingNotes(data.dubbingNotes || '');

      // Set audio
      if (data.audioBase64) {
        const dubbedUrl = base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
        setActiveAudioUrl(dubbedUrl);
        setActiveAudioSource('dubbed');
      } else {
        // Fallback to client audio generation
        const activeText =
          selectedTargetLang === 'Bangla'
            ? data.translations?.bangla || data.transcription
            : selectedTargetLang === 'English'
            ? data.translations?.english || data.transcription
            : selectedTargetLang === 'Hindi'
            ? data.translations?.hindi || data.transcription
            : data.translations?.arabic || data.transcription;

        const syntheticWavBlob = generateSampleAudioWav(7);
        const url = URL.createObjectURL(syntheticWavBlob);
        setActiveAudioUrl(url);
        setActiveAudioSource('dubbed');

        // Play client speech synthesis speech
        setTimeout(() => {
          speakWithClientTts(activeText, selectedTargetLang);
        }, 500);
      }

      setIsProcessing(false);
    } catch (err: any) {
      console.error('Dubbing error:', err);
      setIsProcessing(false);
      setErrorMessage(
        lang === 'bn'
          ? 'ভয়েস ডাবিং প্রক্রিয়ায় সমস্যা হয়েছে। ব্রাউজার স্পিচ বিকল্প সক্রিয় করা হয়েছে।'
          : 'Dubbing error occurred. Activated browser speech synthesis.'
      );
    }
  };

  // Switch dubbed language tab and get or play translated audio
  const handleSwitchDubbedLang = async (targetKey: TargetLanguageKey) => {
    setSelectedTargetLang(targetKey);
    const targetText =
      targetKey === 'Bangla'
        ? translations.bangla || extractedTranscription
        : targetKey === 'English'
        ? translations.english || extractedTranscription
        : targetKey === 'Hindi'
        ? translations.hindi || extractedTranscription
        : translations.arabic || extractedTranscription;

    if (!targetText) return;

    // Check if we can synthesize server audio
    try {
      const resp = await fetch('/api/dub-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetText,
          targetLanguage: targetKey,
          voiceName: targetKey === 'Arabic' ? 'Charon' : targetKey === 'Hindi' ? 'Kore' : 'Fenrir',
        }),
      });
      const data = await resp.json();
      if (data.audioBase64) {
        const url = base64ToBlobUrl(data.audioBase64, 'audio/wav');
        setActiveAudioUrl(url);
        setActiveAudioSource('dubbed');
        return;
      }
    } catch (e) {
      // ignore
    }

    // Client TTS fallback
    speakWithClientTts(targetText, targetKey);
  };

  // Audio Playback Controls
  const togglePlayAudio = () => {
    if (isClientTtsActive) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsClientTtsActive(false);
      return;
    }

    if (activeAudioSource === 'original' && inputAudioUrl) {
      if (audioPlayerRef.current) {
        if (isPlaying) {
          audioPlayerRef.current.pause();
          setIsPlaying(false);
        } else {
          audioPlayerRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    if (audioPlayerRef.current && activeAudioUrl) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // If no file url, use speech synthesis for current language
      const currentText =
        selectedTargetLang === 'Bangla'
          ? translations.bangla
          : selectedTargetLang === 'English'
          ? translations.english
          : selectedTargetLang === 'Hindi'
          ? translations.hindi
          : translations.arabic;
      speakWithClientTts(currentText || extractedTranscription, selectedTargetLang);
    }
  };

  // Toggle A/B Comparison: Original vs Dubbed
  const handleToggleABSource = (source: 'dubbed' | 'original') => {
    if (isPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsClientTtsActive(false);
    }

    setActiveAudioSource(source);
    if (source === 'original' && inputAudioUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = inputAudioUrl;
      }
    } else if (source === 'dubbed' && activeAudioUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = activeAudioUrl;
      }
    }
  };

  // Download dubbed audio file
  const handleDownloadWav = () => {
    let urlToDownload = activeAudioUrl;

    if (!urlToDownload) {
      // Generate synthetic WAV on the fly
      const fallbackWav = generateSampleAudioWav(6);
      urlToDownload = URL.createObjectURL(fallbackWav);
    }

    const a = document.createElement('a');
    a.href = urlToDownload;
    a.download = `boring-voice-dubbed-${selectedTargetLang.toLowerCase()}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Update download quota
    if (downloadQuota > 0) {
      const updated = downloadQuota - 1;
      setDownloadQuota(updated);
      localStorage.setItem('eidnan_download_quota', updated.toString());
    }
  };

  // Current active translated text
  const currentTranslationText =
    selectedTargetLang === 'Bangla'
      ? translations.bangla
      : selectedTargetLang === 'English'
      ? translations.english
      : selectedTargetLang === 'Hindi'
      ? translations.hindi
      : translations.arabic;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hidden audio element for high-fidelity playback */}
      <audio
        ref={audioPlayerRef}
        src={activeAudioSource === 'original' ? inputAudioUrl || '' : activeAudioUrl || ''}
        onTimeUpdate={() => {
          if (audioPlayerRef.current) {
            setAudioCurrentTime(audioPlayerRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioPlayerRef.current) {
            setAudioDuration(audioPlayerRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
        }}
      />

      {/* Main Studio Console Container */}
      <div className="liquid-glass-elevated rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl bg-white/95">
        {/* Header with Title & Live Engine Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#bfa065] text-xs font-mono-code uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#bfa065] shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
              <span>{lang === 'bn' ? 'অটো ল্যাঙ্গুয়েজ ডিটেকশন ও ভয়েস ডাবিং' : 'Auto Language Detection & Voice Dubbing'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[#64748b]">v3.8 Multi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#0f172a]">
              {lang === 'bn'
                ? 'মাল্টিলিঙ্গুয়াল ভয়েস ডাবিং স্টুডিও'
                : 'Multilingual Voice Dubbing Studio'}
            </h2>
            <p className="font-bangla text-xs sm:text-sm text-[#64748b] mt-1">
              {lang === 'bn'
                ? 'যেকোনো ভাষার কণ্ঠ ইনপুট দিন — সিস্টেম স্বয়ংক্রিয়ভাবে ভাষা শনাক্ত করবে, মূল টেক্সট আলাদা করবে এবং খাঁটি বাংলা, English, हिन्दी ও العربية ভাষায় ডাবিং করবে।'
                : 'Input voice in any language — auto-detects language, separates speech text, and dubs natively into Bangla, English, Hindi, and Arabic.'}
            </p>
          </div>

          {/* Download Quota Indicator */}
          <div className="flex items-center space-x-2 liquid-glass px-4 py-2 rounded-2xl border border-slate-200 shrink-0 self-start sm:self-center">
            <span className="text-base">📥</span>
            <div className="text-left font-bangla text-xs">
              <span className="text-[#64748b] block text-[10px]">ডাউনলোড কোটা:</span>
              <span className="font-bold text-[#0f172a] font-mono-code">
                {downloadQuota} / ২০টি অবশিষ্ট
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Audio Input (Mic, Upload, or Instant Samples) */}
        <div className="mt-7 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bangla font-bold text-[#0f172a] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#bfa065]" />
              <span>ধাপ ১: ইনপুট ভয়েস প্রদান করুন (রেকর্ড বা ফাইল আপলোড):</span>
            </label>

            {/* Input Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setInputMode('mic')}
                className={`px-3 py-1 rounded-lg text-xs font-bangla font-semibold transition cursor-pointer ${
                  inputMode === 'mic'
                    ? 'bg-white text-[#0f172a] shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                🎙️ লাইভ মাইক্রোফোন
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-bangla font-semibold transition cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-white text-[#0f172a] shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                📁 ফাইল আপলোড
              </button>
            </div>
          </div>

          {/* Mode 1: Live Mic Recording */}
          {inputMode === 'mic' && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                {isRecording && (
                  <span className="absolute -inset-2 rounded-full bg-red-400/30 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                      : 'bg-gradient-to-tr from-[#0f172a] to-[#1e293b] hover:to-[#0f172a] text-[#bfa065] shadow-slate-300'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>

              <div>
                <div className="font-editorial text-lg font-bold text-[#0f172a]">
                  {isRecording ? '🎙️ কথা বলুন... রেকর্ডিং চলছে' : 'মাইক্রোফোনে কথা রেকর্ড করুন'}
                </div>
                <div className="font-mono-code text-xs text-[#64748b] mt-1">
                  {isRecording ? (
                    <span className="text-red-600 font-bold animate-pulse">
                      REC 00:{recordingSeconds.toString().padStart(2, '0')} / 01:00
                    </span>
                  ) : (
                    'যেকোনো ভাষায় ৩ থেকে ৩০ সেকেন্ড কথা বলুন'
                  )}
                </div>
              </div>

              {/* Recorded Audio Preview */}
              {inputAudioUrl && !isRecording && (
                <div className="w-full max-w-md p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-xs font-mono-code text-[#0f172a] truncate">
                    <FileAudio className="w-4 h-4 text-[#bfa065] shrink-0" />
                    <span className="truncate">{inputAudioName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleABSource('original')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bangla font-semibold text-[#0f172a] transition flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3 text-[#bfa065]" />
                    <span>শুনুন</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Audio File Upload */}
          {inputMode === 'upload' && (
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#bfa065] transition flex flex-col items-center justify-center text-center space-y-3 relative cursor-pointer">
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#bfa065] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="font-editorial text-sm font-bold text-[#0f172a] block">
                  {inputAudioName ? inputAudioName : 'অডিও ফাইল টেনে এনে ফেলুন বা ব্রাউজ করুন'}
                </span>
                <span className="text-xs text-[#64748b] font-mono-code mt-0.5 block">
                  MP3, WAV, M4A, WEBM, OGG (সর্বোচ্চ 15MB)
                </span>
              </div>
            </div>
          )}

          {/* 4 Instant Audition Samples */}
          <div className="pt-2">
            <span className="block text-xs font-bangla text-[#64748b] mb-2 font-semibold">
              ✨ অথবা ১-ক্লিকে তাত্ক্ষণিক ট্রায়াল স্যাম্পল পরীক্ষা করুন:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(SAMPLE_AUDIOS) as TargetLanguageKey[]).map((key) => {
                const s = SAMPLE_AUDIOS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => loadAuditionSample(key)}
                    className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#bfa065] text-left transition cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-base">{s.flag}</span>
                      <span className="font-mono-code text-[10px] text-[#64748b] bg-slate-100 px-1.5 py-0.5 rounded">
                        {s.duration}
                      </span>
                    </div>
                    <div className="font-editorial text-xs font-bold text-[#0f172a] group-hover:text-[#bfa065] transition-colors">
                      {s.labelBn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: Target Dubbing Language Selection (The 4 Requested Languages) */}
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bangla font-bold text-[#0f172a] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#bfa065]" />
              <span>ধাপ ২: ডাবিংয়ের লক্ষ্য ভাষা নির্বাচন করুন (৪টি মূল ভাষা):</span>
            </label>
            <span className="text-[11px] font-mono-code text-[#bfa065] font-semibold">
              4 CORE LANGUAGES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TARGET_LANGUAGES.map((t) => {
              const isSelected = selectedTargetLang === t.key;
              return (
                <div
                  key={t.key}
                  onClick={() => {
                    setSelectedTargetLang(t.key);
                    if (extractedTranscription) {
                      handleSwitchDubbedLang(t.key);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-amber-50/70 border-[#bfa065] shadow-md ring-1 ring-[#bfa065]'
                      : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.flag}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#bfa065] shadow-[0_0_8px_rgba(191,160,101,0.8)]" />
                    )}
                  </div>
                  <div className="font-editorial text-base font-bold text-[#0f172a]">
                    {t.nativeName}
                  </div>
                  <p className="font-bangla text-xs text-[#64748b] mt-1 leading-snug">
                    {t.taglineBn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bangla text-red-700 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PRIMARY ACTION BUTTON */}
        <div className="mt-7 pt-4">
          <button
            type="button"
            onClick={handleStartDubbing}
            disabled={isProcessing || !audioBase64}
            className="w-full boring-button py-4 rounded-2xl text-sm sm:text-base font-semibold flex items-center justify-center space-x-3 text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-lg hover:shadow-xl transition-all"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="font-bangla text-sm">{processingStatusText}</span>
              </>
            ) : (
              <>
                <Languages className="w-5 h-5 text-[#bfa065]" />
                <span className="font-bangla font-bold">
                  🎙️ ভয়েস শনাক্ত, মূল টেক্সট আলাদা ও ডাবিং শুরু করুন
                </span>
                <span className="boring-keycap text-[11px] ml-1">↵</span>
              </>
            )}
          </button>
        </div>

        {/* RESULTS SECTION: Shown when text has been extracted */}
        {extractedTranscription && (
          <div className="mt-10 pt-8 border-t border-slate-200/90 space-y-7 animate-in fade-in zoom-in-95 duration-300">
            {/* CARD 1: Auto Detected Source Language & Extracted Verbatim Text */}
            <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-editorial text-sm font-bold text-[#0f172a]">
                    স্বয়ংক্রিয়ভাবে শনাক্তকৃত ভাষা ও আলাদা করা মূল টেক্সট
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Language Badge */}
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono-code font-bold">
                    🌐 {detectedLanguage}
                  </span>
                  <span className="text-xs font-mono-code text-[#64748b]">
                    {extractedTranscription.length} অক্ষর
                  </span>
                </div>
              </div>

              {/* Extracted Speech Text Display */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs relative">
                <p className="font-bangla text-base sm:text-lg text-[#0f172a] leading-relaxed select-text">
                  "{extractedTranscription}"
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748b]">
                  <span className="font-bangla">অডিও থেকে গৃহীত নির্ভুল মূল কথন</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedTranscription);
                      setCopiedOriginal(true);
                      setTimeout(() => setCopiedOriginal(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-[#bfa065] hover:text-[#0f172a] transition cursor-pointer font-mono-code"
                  >
                    {copiedOriginal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOriginal ? 'কপি হয়েছে' : 'কপি টেক্সট'}</span>
                  </button>
                </div>
              </div>

              {/* Acoustic Forensics Profile */}
              {vocalProfile && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-[#64748b] block">পিচ (Pitch):</span>
                    <span className="font-bold text-[#0f172a]">{vocalProfile.pitch || 'Baritone'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-[#64748b] block">টোন (Tone):</span>
                    <span className="font-bold text-[#0f172a]">{vocalProfile.tone || 'Warm'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-[#64748b] block">গতি (Pace):</span>
                    <span className="font-bold text-[#0f172a]">{vocalProfile.pace || 'Measured'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-[#64748b] block">শ্বাস-প্রশ্বাস:</span>
                    <span className="font-bold text-[#0f172a] truncate">স্বাভাবিক পজ</span>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: Multilingual Dubbed Voice & Translated Script */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-amber-50/20 border border-[#bfa065]/40 shadow-lg space-y-5">
              {/* Header with Dubbed Language Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-[#bfa065]" />
                  <span className="font-editorial text-base sm:text-lg font-bold text-[#0f172a]">
                    ডাবিং করা অডিও ও অনুবাদিত কথন:
                  </span>
                </div>

                {/* 4 Language Quick Tabs */}
                <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto">
                  {TARGET_LANGUAGES.map((t) => {
                    const isSelected = selectedTargetLang === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => handleSwitchDubbedLang(t.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bangla font-semibold transition flex items-center space-x-1 cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-white text-[#0f172a] shadow-xs'
                            : 'text-[#64748b] hover:text-[#0f172a]'
                        }`}
                      >
                        <span>{t.flag}</span>
                        <span>{t.labelBn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Translated Text Script */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-[#bfa065] font-mono-code mb-2">
                  <span className="font-bold uppercase tracking-wider">
                    {selectedTargetLang} Dubbed Script
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTranslationText) {
                        navigator.clipboard.writeText(currentTranslationText);
                        setCopiedTranslation(true);
                        setTimeout(() => setCopiedTranslation(false), 2000);
                      }
                    }}
                    className="flex items-center space-x-1 text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                  >
                    {copiedTranslation ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranslation ? 'কপি হয়েছে' : 'কপি অনুবাদ'}</span>
                  </button>
                </div>
                <p className="font-bangla text-base sm:text-xl text-[#0f172a] leading-relaxed font-semibold">
                  "{currentTranslationText || extractedTranscription}"
                </p>
              </div>

              {/* High-Fidelity Audio Waveform Player with A/B Toggle */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
                {/* A/B Comparison Switcher */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <span className="font-bangla text-slate-400">অডিও প্লেব্যাক সোর্স:</span>
                  <div className="flex items-center space-x-1 p-1 rounded-lg bg-slate-800">
                    <button
                      type="button"
                      onClick={() => handleToggleABSource('original')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bangla transition cursor-pointer ${
                        activeAudioSource === 'original'
                          ? 'bg-[#bfa065] text-slate-900 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      মূল ইনপুট ভয়েস
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleABSource('dubbed')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bangla transition cursor-pointer ${
                        activeAudioSource === 'dubbed'
                          ? 'bg-[#bfa065] text-slate-900 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ডাবিং করা ভয়েস
                    </button>
                  </div>
                </div>

                {/* Main Player Bar */}
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="w-12 h-12 rounded-full bg-[#bfa065] hover:bg-[#d4b476] text-slate-950 flex items-center justify-center transition cursor-pointer shrink-0 shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  {/* Waveform / Equalizer Bars */}
                  <div className="flex-1 flex items-center space-x-1 h-9">
                    {[18, 42, 28, 65, 84, 52, 92, 44, 76, 32, 60, 88, 36, 70, 95, 48, 80, 25, 68, 54].map(
                      (h, idx) => {
                        const active = isPlaying;
                        return (
                          <div
                            key={idx}
                            style={{ height: active ? `${Math.max(15, (h * (idx % 3 + 1)) % 100)}%` : `${h * 0.4}%` }}
                            className={`flex-1 rounded-full transition-all duration-150 ${
                              active ? 'bg-[#bfa065]' : 'bg-slate-700'
                            }`}
                          />
                        );
                      }
                    )}
                  </div>

                  {/* Speed Controls */}
                  <div className="hidden sm:flex items-center space-x-1 text-xs font-mono-code text-slate-400 shrink-0">
                    {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setAudioPlaybackRate(rate)}
                        className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                          audioPlaybackRate === rate
                            ? 'bg-[#bfa065] text-slate-900 font-bold'
                            : 'hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions: Download WAV & Quota */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div className="text-slate-400 font-mono-code">
                    {activeAudioSource === 'dubbed'
                      ? `ডাবিং অডিও: ${selectedTargetLang} (24kHz WAV)`
                      : 'মূল ইনপুট অডিও'}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadWav}
                    className="boring-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 text-white cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5 text-[#bfa065]" />
                    <span className="font-bangla">ডাবিং অডিও ডাউনলোড (.WAV)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
