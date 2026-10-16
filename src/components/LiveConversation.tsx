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
    // Stop all playing audio sources
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
      // 1. Request microphone access
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

      // 2. Initialize Audio Contexts
      // Input: 16kHz for mic capture according to Gemini Live specification
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      // Output: 24kHz for Live API model playback
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 3. Connect WebSocket
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
            console.log('Gemini Live session initialized');
          } else if (data.type === 'audio' && data.audio) {
            playLiveAudioChunk(data.audio);
          } else if (data.type === 'text' && data.text) {
            handleIncomingTranscription(data.text);
          } else if (data.type === 'interrupted') {
            console.log('Model speech interrupted by user speech');
            stopAudio();
          } else if (data.type === 'turnComplete') {
            currentModelTextRef.current = '';
            // Reset AI speaking after buffer empties
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
          console.error('Error handling ws message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setErrorMessage('ভয়েস সার্ভারের সাথে সংযোগে ত্রুটি দেখা দিয়েছে।');
        disconnectSession();
      };

      ws.onclose = () => {
        disconnectSession();
      };

      // 4. Setup microphone audio processing (16kHz PCM chunks -> WS)
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const channelData = e.inputBuffer.getChannelData(0);
        const base64Pcm = float32ToPcm16Base64(channelData);

        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Pcm,
          })
        );
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('Mic/connection failure:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'মাইক্রোফোনের অনুমতি পাওয়া যায়নি। দয়া করে ব্রাউজারের অনুমতি দিন।'
          : err?.message || 'লাইভ সেশন শুরু করতে ব্যর্থ হয়েছে।'
      );
      disconnectSession();
    }
  };

  // Schedule gapless 24kHz PCM playback
  const playLiveAudioChunk = (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    setIsAiSpeaking(true);

    const float32Data = pcm16Base64ToFloat32(base64Audio);
    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Keep track of startTime for gapless playback
    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.05; // small jitter buffer
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setIsAiSpeaking(false);
      }
    };
  };

  const handleIncomingTranscription = (newText: string) => {
    currentModelTextRef.current += newText;
    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.sender === 'model') {
        return [
          ...prev.slice(0, -1),
          { ...lastMsg, text: lastMsg.text + newText },
        ];
      } else {
        return [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'model',
            text: newText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
    });
  };

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput('');

    // Add to message log
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Send to WebSocket
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Live Voice Hero & Microphone Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111e1e] via-[#0d1616] to-[#080d0d] border border-amber-600/30 p-6 sm:p-8 shadow-2xl text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold font-bangla">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>{lang === 'bn' ? 'মডেল: gemini-3.8-live' : 'Model: gemini-3.8-live'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-bangla">
            {lang === 'bn' ? 'রিয়েল-টাইম বাংলা ভয়েস কনভারসেশন' : 'Real-Time Bengali Voice Conversation'}
          </h2>

          <p className="text-sm text-zinc-300/80 font-bangla">
            {lang === 'bn'
              ? 'মাইক্রোফোন চালু করে যেকোনো আধ্যাত্মিক জিজ্ঞাসা বা জীবনের কথা সরাসরি বলুন। মডেলটি সরাসরি প্রাকৃতিক বাংলাদেশি বাংলায় গভীর শ্রদ্ধাশীল কণ্ঠে উত্তর দেবে।'
              : 'Speak directly into your microphone in Bengali or English. Gemini Live responds in real-time with an emotional, clear voice actor delivery.'}
          </p>

          {/* Glowing Animated Mic Orb */}
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing rings when active */}
              {isConnected && (
                <>
                  <div
                    className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
                      isAiSpeaking
                        ? 'bg-amber-500/20 scale-125 animate-ping'
                        : isMicMuted
                        ? 'bg-zinc-800/20'
                        : 'bg-emerald-500/20 scale-110 animate-pulse'
                    }`}
                  />
                  <div
                    className={`absolute w-28 h-28 rounded-full border transition-all ${
                      isAiSpeaking
                        ? 'border-amber-400/60 shadow-lg shadow-amber-500/40'
                        : isMicMuted
                        ? 'border-zinc-700'
                        : 'border-emerald-400/60 shadow-lg shadow-emerald-500/40'
                    }`}
                  />
                </>
              )}

              {/* Main Button */}
              <button
                onClick={isConnected ? disconnectSession : connectSession}
                disabled={isConnecting}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                  isConnected
                    ? isAiSpeaking
                      ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 text-black hover:scale-105'
                      : isMicMuted
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white hover:scale-105'
                    : 'bg-gradient-to-tr from-emerald-700 to-amber-700 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {isConnecting ? (
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isConnected ? (
                  isAiSpeaking ? (
                    <>
                      <Volume2 className="w-8 h-8 animate-bounce" />
                      <span className="text-[10px] font-bold mt-1 font-bangla">বলছে...</span>
                    </>
                  ) : isMicMuted ? (
                    <>
                      <MicOff className="w-7 h-7" />
                      <span className="text-[10px] font-bold mt-1 font-bangla">মিউট</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7 animate-pulse" />
                      <span className="text-[10px] font-bold mt-1 font-bangla">শুনছে</span>
                    </>
                  )
                ) : (
                  <>
                    <Mic className="w-8 h-8" />
                    <span className="text-[11px] font-bold mt-1 font-bangla">
                      {lang === 'bn' ? 'শুরু করুন' : 'Start'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Connection status badge */}
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs font-bangla">
              {isConnected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-medium">
                    {lang === 'bn' ? 'লাইভ সেশন সক্রিয় (Live Active)' : 'Live Session Connected'}
                  </span>
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className="ml-3 px-2.5 py-1 rounded-lg bg-[#182626] hover:bg-[#203333] text-zinc-300 text-xs font-medium flex items-center space-x-1"
                  >
                    {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isMicMuted ? (lang === 'bn' ? 'আনমিউট' : 'Unmute') : (lang === 'bn' ? 'মাইক মিউট' : 'Mute Mic')}</span>
                  </button>
                </>
              ) : (
                <span className="text-zinc-400">
                  {lang === 'bn'
                    ? 'ক্লিক করে তাৎক্ষণিক ভয়েস আলাপ শুরু করুন'
                    : 'Click above to start low-latency voice chat'}
                </span>
              )}
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="pt-2">
            <p className="text-xs text-zinc-400 mb-2 font-bangla">
              {lang === 'bn' ? 'বা এই বিষয়ে জিজ্ঞেস করুন:' : 'Or tap a question in Bengali:'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(q)}
                  className="px-3 py-1.5 rounded-xl bg-[#142323] hover:bg-[#1b2f2f] text-xs text-emerald-200/90 border border-emerald-900/40 transition font-bangla cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center space-x-2 font-bangla">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Dialogue Transcript Box */}
      <div className="rounded-2xl bg-[#0d1616]/90 border border-emerald-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-bangla">
              {lang === 'bn' ? 'কথোপকথনের প্রতিলিপি (Live Transcript)' : 'Live Conversation Transcript'}
            </h3>
          </div>
          <button
            onClick={() => setMessages([])}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 font-bangla"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}</span>
          </button>
        </div>

        {/* Message bubble stream */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed font-bangla ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-xs'
                    : 'bg-[#122020] border border-emerald-800/40 text-emerald-100 rounded-bl-xs'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[11px] opacity-70">
                  <span>{m.sender === 'user' ? (lang === 'bn' ? 'আপনি' : 'You') : (lang === 'bn' ? 'ভয়েস অ্যাক্টর' : 'Voice Actor')}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Text Input Fallback */}
        <form onSubmit={handleSendTextMessage} className="pt-2 flex items-center space-x-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'বাংলায় কোনো প্রশ্ন বা বার্তা টাইপ করুন...'
                : 'Type message in Bengali or English...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#091010] border border-emerald-900/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-bangla"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || !isConnected}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center space-x-1.5 font-bangla cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
