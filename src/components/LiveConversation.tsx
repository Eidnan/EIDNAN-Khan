import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  MessageSquare,
  AlertCircle,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { float32ToPcm16Base64, pcm16Base64ToFloat32 } from '../utils/audioUtils';

interface LiveConversationProps {
  lang: 'bn' | 'en';
}

interface Message {
  id: string;
  sender: 'user' | 'model';
  text: string;
  time: string;
}

export const LiveConversation: React.FC<LiveConversationProps> = ({ lang }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'model',
      text: 'আসসালামু আলাইকুম। আমি আপনার কণ্ঠ সঙ্গী ও ভয়েস অ্যাক্টর। ইসলাম, কুরআন-হাদিসের নসিহত, নজরের হেফাজত কিংবা যেকোনো আত্মশুদ্ধির বিষয়ে কথা বলতে পারেন। মাইক্রোফোন চালু করে কথা বলুন।',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [textInput, setTextInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio & WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Gapless playback scheduler refs
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef<boolean>(false);
  isMutedRef.current = isMicMuted;

  // Stream current model transcription chunk
  const currentModelTextRef = useRef<string>('');

  const stopAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];

    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsAiSpeaking(false);
  };

  const disconnectSession = () => {
    stopAudio();

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  };

  // Connect to Gemini 3.8 Live WebSocket
  const connectSession = async () => {
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live-ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to Gemini Live backend');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setIsConnected(true);
            setIsConnecting(false);
          } else if (data.type === 'audio' && data.audio) {
            playLiveAudioChunk(data.audio);
          } else if (data.type === 'text' && data.text) {
            handleIncomingTranscription(data.text);
          } else if (data.type === 'interrupted') {
            stopAudio();
          } else if (data.type === 'turnComplete') {
            currentModelTextRef.current = '';
            setTimeout(() => {
              if (outputAudioCtxRef.current && nextStartTimeRef.current <= outputAudioCtxRef.current.currentTime) {
                setIsAiSpeaking(false);
              }
            }, 300);
          } else if (data.type === 'error') {
            setErrorMessage(data.error);
            disconnectSession();
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setErrorMessage(
          lang === 'bn'
            ? 'লাইভ কানেকশনে ত্রুটি হয়েছে। দয়া করে আবার চেষ্টা করুন।'
            : 'Live connection encountered an error. Please retry.'
        );
        disconnectSession();
      };

      ws.onclose = () => {
        disconnectSession();
      };

      // Set up microphone capture pipeline
      const micSource = inputCtx.createMediaStreamSource(stream);
      const bufferSize = 2048;
      const processor = inputCtx.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16Base64 = float32ToPcm16Base64(inputData);

        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: pcm16Base64,
          })
        );
      };

      micSource.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('Failed to initialize microphone or live audio session:', err);
      setErrorMessage(
        err?.message ||
          (lang === 'bn'
            ? 'মাইক্রোফোন অ্যাক্সেস করতে সমস্যা হয়েছে। দয়া করে ব্রাউজারের অনুমতি দিন।'
            : 'Microphone access denied or audio initialization failed.')
      );
      disconnectSession();
    }
  };

  const playLiveAudioChunk = (pcmBase64: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    const float32Data = pcm16Base64ToFloat32(pcmBase64);
    if (float32Data.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;

    setIsAiSpeaking(true);
    activeSourcesRef.current.push(source);

    source.onended = () => {
      const idx = activeSourcesRef.current.indexOf(source);
      if (idx !== -1) {
        activeSourcesRef.current.splice(idx, 1);
      }
      if (activeSourcesRef.current.length === 0 && nextStartTimeRef.current <= ctx.currentTime) {
        setIsAiSpeaking(false);
      }
    };
  };

  const handleIncomingTranscription = (chunk: string) => {
    currentModelTextRef.current += chunk;
    const fullText = currentModelTextRef.current;

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === 'model' && last.id !== 'welcome') {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            text: fullText,
          },
        ];
      } else {
        return [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'model',
            text: fullText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
    });
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const userText = textInput.trim();
    if (!userText) return;

    setTextInput('');
    currentModelTextRef.current = '';

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text: userText,
        })
      );
    }
  };

  const handlePromptClick = (promptBn: string) => {
    setTextInput(promptBn);
    if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user',
          text: promptBn,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text: promptBn,
        })
      );
      setTextInput('');
    }
  };

  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  const quickPrompts = [
    'নজর হেফাজতের গুরুত্ব সম্পর্কে আরেকটু বিস্তারিত বলুন।',
    'চোখের সামনে হারাম কিছু চলে আসলে সাথে সাথে কী করব?',
    'আল্লাহর ভয়ে চোখ নিচু করলে অন্তরে কী পরিবর্তন আসে?',
    'একটি মন শান্ত করার মতো হাদিস আবেগ দিয়ে শোনান।',
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-bangla">
      {/* Live Voice Stage with Liquid Glass */}
      <div className="liquid-glass-elevated rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden border border-slate-200/90 shadow-xl bg-white/90">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono-code text-[#475569]">
            <Radio className="w-3.5 h-3.5 text-[#bfa065] animate-pulse" />
            <span>gemini-3.8-live · 24kHz</span>
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0f172a]">
            {lang === 'bn' ? 'রিয়েল-টাইম বাংলা ভয়েস কনভারসেশন' : 'Real-Time Bengali Voice Conversation'}
          </h2>

          <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
            {lang === 'bn'
              ? 'মাইক্রোফোন চালু করে যেকোনো জিজ্ঞাসা সরাসরি বলুন। মডেলটি সরাসরি প্রাকৃতিক বাংলাদেশি বাংলায় গভীর শ্রদ্ধাশীল কণ্ঠে উত্তর দেবে।'
              : 'Speak directly into your microphone. Gemini Live responds in real-time with authentic Bangladeshi cadence.'}
          </p>

          {/* Minimalist Tactile Mic Button */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {isConnected && (
                <div
                  className={`absolute w-32 h-32 rounded-full border transition-all ${
                    isAiSpeaking
                      ? 'border-[#bfa065] scale-110 animate-ping opacity-30'
                      : 'border-slate-300'
                  }`}
                />
              )}

              <button
                onClick={isConnected ? disconnectSession : connectSession}
                disabled={isConnecting}
                className={`relative z-10 w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all shadow-md cursor-pointer border ${
                  isConnected
                    ? isAiSpeaking
                      ? 'bg-amber-100 text-[#0f172a] border-[#bfa065]'
                      : isMicMuted
                      ? 'bg-slate-100 text-[#64748b] border-slate-300'
                      : 'bg-white text-[#0f172a] border-[#bfa065]'
                    : 'boring-button text-white'
                }`}
              >
                {isConnecting ? (
                  <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : isConnected ? (
                  isAiSpeaking ? (
                    <>
                      <Volume2 className="w-6 h-6 animate-pulse text-[#bfa065]" />
                      <span className="text-[10px] font-bold mt-1 font-mono-code text-[#0f172a]">Speaking</span>
                    </>
                  ) : isMicMuted ? (
                    <>
                      <MicOff className="w-6 h-6 text-[#64748b]" />
                      <span className="text-[10px] font-mono-code mt-1 text-[#64748b]">Muted</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6 text-[#bfa065]" />
                      <span className="text-[10px] font-mono-code mt-1 text-[#0f172a] font-bold">Live</span>
                    </>
                  )
                ) : (
                  <>
                    <Mic className="w-6 h-6 text-[#bfa065]" />
                    <span className="text-[10px] font-mono-code mt-1">
                      {lang === 'bn' ? 'শুরু' : 'Start'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Status indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs font-mono-code text-[#64748b]">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#bfa065] animate-pulse" />
                  <span>
                    {isAiSpeaking
                      ? 'AI Speaking...'
                      : isMicMuted
                      ? 'Mic Muted'
                      : 'Listening (16kHz PCM)...'}
                  </span>
                </>
              ) : (
                <span>Click to start interactive conversation</span>
              )}
            </div>

            {/* Mute button if connected */}
            {isConnected && (
              <div className="mt-3">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-mono-code text-[#475569] border border-slate-200/90 transition cursor-pointer shadow-xs"
                >
                  {isMicMuted ? '🔊 Unmute Mic' : '🔇 Mute Mic'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bangla text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Prompts in Liquid Glass */}
      <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-slate-200/90 bg-white/80">
        <div className="text-xs font-mono-code text-[#64748b] mb-2 uppercase tracking-wider font-semibold">
          {lang === 'bn' ? 'দ্রুত জিজ্ঞাসার প্রম্পট:' : 'Quick Prompts:'}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(q)}
              className="px-3 py-1.5 rounded-lg bg-white text-xs text-[#475569] hover:text-[#0f172a] border border-slate-200/90 hover:border-slate-300 transition text-left cursor-pointer shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread in Liquid Glass */}
      <div className="liquid-glass rounded-2xl p-5 sm:p-6 space-y-4 max-h-[380px] overflow-y-auto border border-slate-200/90 bg-white/80">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 text-xs font-mono-code text-[#64748b]">
          <span>Conversation History</span>
          <span>{messages.length} messages</span>
        </div>

        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-amber-50/80 border-[#bfa065]/40 text-[#0f172a] ml-6'
                  : 'bg-white border-slate-200/90 text-[#334155] mr-6 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between font-mono-code text-[10px] text-[#64748b] mb-1">
                <span className="font-semibold">{m.sender === 'user' ? 'You' : 'EIDNAN Voice Actor'}</span>
                <span>{m.time}</span>
              </div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Text Message Fallback Input */}
      <form onSubmit={handleSendText} className="flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={lang === 'bn' ? 'বার্তা লিখুন এবং এন্টার চাপুন...' : 'Type message in Bengali/English...'}
          className="flex-1 bg-white border border-slate-200/90 focus:border-[#bfa065] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none transition shadow-inner"
        />
        <button
          type="submit"
          className="boring-button px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 text-white cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-[#bfa065]" />
          <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
};
