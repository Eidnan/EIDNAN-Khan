import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  Mic,
  Copy,
  Check,
  ChevronRight,
  Archive,
} from 'lucide-react';

export interface AudioHistoryItem {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  createdAt: number;
  voiceName: string;
  voiceNameBn: string;
  duration?: number;
  audioBase64?: string;
}

const STORAGE_KEY = 'eidnan_audio_history';

export function getSavedAudioHistory(): AudioHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse audio history from localStorage:', err);
    return [];
  }
}

export function saveAudioClipToHistory(item: Omit<AudioHistoryItem, 'id' | 'createdAt'>): AudioHistoryItem {
  const newItem: AudioHistoryItem = {
    ...item,
    id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: Date.now(),
  };

  try {
    const current = getSavedAudioHistory();
    let updated = [newItem, ...current.filter((c) => c.text !== item.text || c.voiceName !== item.voiceName)];
    if (updated.length > 12) {
      updated = updated.slice(0, 12);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      const pruned = updated.map((clip, idx) => (idx > 2 ? { ...clip, audioBase64: undefined } : clip));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    }
  } catch (err) {
    console.error('Failed to save to audio history:', err);
  }

  window.dispatchEvent(new Event('audio-history-updated'));
  return newItem;
}

interface AudioHistoryProps {
  onLoadScript?: (text: string, voiceName: string, audioUrl?: string) => void;
  onDownloadClip?: (item: AudioHistoryItem) => void;
  lang: 'bn' | 'en';
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({ onLoadScript, onDownloadClip, lang }) => {
  const [historyItems, setHistoryItems] = useState<AudioHistoryItem[]>([]);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const loadHistory = () => {
    const items = getSavedAudioHistory();
    setHistoryItems(items);
  };

  useEffect(() => {
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener('audio-history-updated', handleUpdate);
    return () => window.removeEventListener('audio-history-updated', handleUpdate);
  }, []);

  const togglePlayClip = (item: AudioHistoryItem) => {
    if (!audioPlayerRef.current) return;

    if (activePlayingId === item.id) {
      audioPlayerRef.current.pause();
      setActivePlayingId(null);
      return;
    }

    if (item.audioBase64) {
      audioPlayerRef.current.src = `data:audio/wav;base64,${item.audioBase64}`;
      audioPlayerRef.current
        .play()
        .then(() => {
          setActivePlayingId(item.id);
        })
        .catch((e) => console.error('Play error:', e));
    } else if (onLoadScript) {
      onLoadScript(item.text, item.voiceName);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePlayingId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setActivePlayingId(null);
    }
    const filtered = historyItems.filter((item) => item.id !== id);
    setHistoryItems(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  };

  const handleClearAll = () => {
    if (activePlayingId && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setActivePlayingId(null);
    }
    setHistoryItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleCopyText = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: AudioHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadClip) {
      onDownloadClip(item);
      return;
    }
    if (!item.audioBase64) return;
    const a = document.createElement('a');
    a.href = `data:audio/wav;base64,${item.audioBase64}`;
    a.download = `${item.title.replace(/[^\w\u0980-\u09FF]/gi, '_') || 'audio_clip'}.wav`;
    a.click();
  };

  return (
    <div className="liquid-glass rounded-2xl p-6 sm:p-7 space-y-5 font-bangla border border-slate-200/90 shadow-sm bg-white/80">
      <audio
        ref={audioPlayerRef}
        onEnded={() => setActivePlayingId(null)}
        onError={() => setActivePlayingId(null)}
      />

      {/* Header bar matching TheBoringBlog list view */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-2.5">
          <Archive className="w-4 h-4 text-[#bfa065]" />
          <h3 className="font-editorial text-base font-bold text-[#0f172a]">
            {lang === 'bn' ? 'অডিও আর্কাইভ ও সাম্প্রতিক ক্লিপ' : 'Audio Clip Archive'}
          </h3>
          <span className="boring-keycap text-[10px]">
            {historyItems.length} {lang === 'bn' ? 'ক্লিপ' : 'clips'}
          </span>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-mono-code text-[#64748b] hover:text-red-600 transition self-start sm:self-auto flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'আর্কাইভ খালি করুন' : 'Clear all'}</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {historyItems.length === 0 ? (
        <div className="py-10 text-center text-[#64748b] text-xs font-mono-code space-y-1">
          <p>No audio clips recorded yet.</p>
          <p className="font-bangla text-[#475569]">
            {lang === 'bn' ? 'যেকোনো স্ক্রিপ্ট লিখে ভয়েস তৈরি করলেই এখানে সংরক্ষিত হবে।' : 'Generated audio will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {historyItems.map((item, idx) => {
            const isPlayingThis = activePlayingId === item.id;
            const indexStr = String(idx + 1).padStart(3, '0');

            return (
              <div
                key={item.id}
                onClick={() => togglePlayClip(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPlayingThis
                    ? 'bg-amber-50/80 border-[#bfa065] text-[#0f172a] shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 text-[#475569]'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start space-x-3.5 min-w-0">
                  <span className="font-mono-code text-xs text-[#bfa065] font-semibold pt-0.5 shrink-0">
                    {indexStr}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-editorial text-sm font-semibold text-[#0f172a] truncate">
                      {item.title}
                    </h4>
                    <p className="font-bangla text-xs text-[#64748b] truncate mt-0.5">
                      {item.text}
                    </p>
                    <div className="flex items-center space-x-2 text-[11px] font-mono-code text-[#94a3b8] mt-1">
                      <span>{item.voiceName}</span>
                      <span>·</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right action buttons */}
                <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayClip(item);
                    }}
                    className={`p-2 rounded-lg border transition cursor-pointer ${
                      isPlayingThis
                        ? 'bg-[#bfa065] text-white border-[#bfa065]'
                        : 'bg-slate-50 text-[#0f172a] border-slate-200 hover:border-[#bfa065]'
                    }`}
                    title={isPlayingThis ? 'Pause' : 'Play'}
                  >
                    {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleCopyText(item.id, item.text, e)}
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-[#475569] hover:text-[#0f172a] border border-slate-200 transition cursor-pointer shadow-xs"
                    title="Copy Text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleDownload(item, e)}
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-[#475569] hover:text-[#0f172a] border border-slate-200 transition cursor-pointer shadow-xs"
                    title="Download Clip"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-2 rounded-lg bg-white hover:bg-red-50 text-[#64748b] hover:text-red-600 border border-slate-200 transition cursor-pointer shadow-xs"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
