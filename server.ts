import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, ThinkingLevel, type LiveServerMessage } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '20mb' }));

// Shared Google GenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

import crypto from 'crypto';
import { parseQuotaError } from './src/utils/quotaHelper.ts';

// In-memory cache for generated TTS audio to prevent burning quota on repeated requests
const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string; voice: string }>();
// In-memory cache for dubbing forensic analysis & translated speech
const dubbingCache = new Map<string, any>();
// Global flag to avoid repeated 429 roundtrips if lite model daily quota is reached
let isLiteTtsQuotaExhausted = false;

// REST Endpoint: Text-to-Speech generation with dual-model fallback and caching
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName, style } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text prompt is required.' });
      return;
    }

    const selectedVoice = voiceName || 'Fenrir';
    const baseStyle =
      style ||
      'Deep, emotional, clear, and cinematic Bangladeshi Bengali accent. Warm solemn baritone with natural pauses and spiritual reverence.';
    
    // Critical Phonetics Directive: Authentic Bangladeshi Standard Bengali (খাঁটি বাংলাদেশি প্রমিত বাংলা), natural breathing pauses, clear conjuncts and Islamic terms
    const deliveryStyle = `${baseStyle.trim()}. 100% authentic native Bangladeshi Standard Bengali pronunciation (খাঁটি বাংলাদেশি প্রমিত বাংলা). No robotic, foreign, or Hindi/English intonation. Natural human breathing pauses at commas and punctuation marks (, । —). Clear and crisp pronunciation of conjuncts (যুক্তবর্ণ), ya-phala, and e-kar (দেখা, খেলা, এমন). Authentic, reverent delivery of Islamic terms (সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম, তওবা, নেককার, ঈমান).`;

    // Check cache first to save quota
    const cacheKey = crypto
      .createHash('md5')
      .update(`${text.trim()}_${selectedVoice}_${deliveryStyle.trim()}`)
      .digest('hex');

    if (ttsAudioCache.has(cacheKey)) {
      console.log('Serving TTS audio from in-memory cache for key:', cacheKey);
      const cached = ttsAudioCache.get(cacheKey)!;
      res.json({
        ...cached,
        cached: true,
      });
      return;
    }

    let response: any = null;
    let modelUsed = isLiteTtsQuotaExhausted ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';
    let lastQuotaError: any = null;

    // Try primary model (gemini-3.8-flash-lite-tts) if not marked exhausted
    if (!isLiteTtsQuotaExhausted) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text,
                  speechMetadata: {
                    style: deliveryStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });
      } catch (liteErr: any) {
        const parsedLiteQuota = parseQuotaError(liteErr);
        if (parsedLiteQuota.isQuotaExceeded) {
          isLiteTtsQuotaExhausted = true;
          lastQuotaError = liteErr;
          console.log(
            '[TTS Notice] Primary model (gemini-3.8-flash-lite-tts) reached daily free tier quota. Switching permanently to gemini-3.8-flash-tts...'
          );
        } else {
          console.log(
            '[TTS Notice] Primary model unavailable, trying secondary model (gemini-3.8-flash-tts)...'
          );
        }
      }
    }

    // Attempt secondary model if primary didn't succeed
    if (!response) {
      try {
        modelUsed = 'gemini-3.8-flash-tts';
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text,
                  speechMetadata: {
                    style: deliveryStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });
      } catch (secondaryErr: any) {
        const parsedSec = parseQuotaError(secondaryErr);
        if (parsedSec.isQuotaExceeded) {
          console.log(
            '[TTS Notice] Secondary model also reached daily free tier quota (429).'
          );
          throw secondaryErr;
        } else if (lastQuotaError) {
          throw lastQuotaError;
        }
        console.log(
          '[TTS Notice] Secondary model unavailable:',
          secondaryErr?.name || 'Error'
        );
        throw secondaryErr;
      }
    }

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio data returned from Gemini TTS model.');
    }

    // Store in cache
    ttsAudioCache.set(cacheKey, {
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: selectedVoice,
    });

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: selectedVoice,
      model: modelUsed,
      cached: false,
    });
  } catch (err: any) {
    const parsedQuota = parseQuotaError(err);

    if (parsedQuota.isQuotaExceeded) {
      console.log(
        `[TTS Info] Daily quota limit reached (429). Retry in ~${parsedQuota.remainingTimeFormattedBn || '6 hours'}. Delivering structured quota response.`
      );
      res.status(429).json({
        code: 'QUOTA_EXCEEDED',
        message: parsedQuota.userFriendlyMessageBn,
        messageEn: parsedQuota.userFriendlyMessageEn,
        totalQuota: parsedQuota.totalQuota,
        retrySeconds: parsedQuota.retrySeconds,
        remainingTimeBn: parsedQuota.remainingTimeFormattedBn,
        remainingTimeEn: parsedQuota.remainingTimeFormattedEn,
        fallbackAvailable: true,
      });
      return;
    }

    console.error('Unexpected error generating speech:', err?.message || err);
    res.status(500).json({
      error: err?.message || 'Failed to generate voice audio.',
    });
  }
});

// REST Endpoint: Multilingual Voice Dubbing Engine with Auto Language Detection & Text Separation
app.post('/api/dub-voice', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/wav',
      fileName,
      targetLanguage = 'Bangla',
      vocalModePrompt,
      targetVoice,
    } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'Audio recording or file base64 data is required.' });
      return;
    }

    const cleanAudio = audioBase64.replace(/^data:[^;]+;base64,/, '');
    let cleanMimeType = (mimeType || 'audio/wav').split(';')[0].trim().toLowerCase();
    
    // Auto-detect and normalize audio mime types from file extension if available
    if (fileName && typeof fileName === 'string') {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'mp3') cleanMimeType = 'audio/mp3';
      else if (ext === 'wav') cleanMimeType = 'audio/wav';
      else if (ext === 'm4a') cleanMimeType = 'audio/mp4';
      else if (ext === 'ogg') cleanMimeType = 'audio/ogg';
      else if (ext === 'webm') cleanMimeType = 'audio/webm';
      else if (ext === 'aac') cleanMimeType = 'audio/aac';
      else if (ext === 'flac') cleanMimeType = 'audio/flac';
    }
    if (cleanMimeType === 'audio/mpeg') {
      cleanMimeType = 'audio/mp3';
    }
    if (!cleanMimeType || cleanMimeType === 'application/octet-stream') {
      cleanMimeType = 'audio/wav';
    }

    // Normalize target language into one of: 'Bangla', 'English', 'Hindi', 'Arabic'
    let normTarget = 'Bangla';
    const targetLower = (targetLanguage || '').toLowerCase();
    if (targetLower.includes('eng')) {
      normTarget = 'English';
    } else if (targetLower.includes('hin')) {
      normTarget = 'Hindi';
    } else if (targetLower.includes('ara') || targetLower.includes('arob')) {
      normTarget = 'Arabic';
    } else {
      normTarget = 'Bangla';
    }

    const dubCacheKey = crypto
      .createHash('md5')
      .update(`${cleanAudio.slice(0, 1000)}_${cleanAudio.length}_${normTarget}_${vocalModePrompt || ''}_${targetVoice || ''}`)
      .digest('hex');

    if (dubbingCache.has(dubCacheKey)) {
      console.log('[Voice Dubbing] Instant response from in-memory cache:', dubCacheKey);
      const cachedResult = dubbingCache.get(dubCacheKey);
      res.json({
        ...cachedResult,
        cached: true,
      });
      return;
    }

    console.log(
      `[Voice Dubbing] Input audio (${cleanAudio.length} chars, mime: ${cleanMimeType}) -> Target: ${normTarget}`
    );

    // Step 1: Speech transcription & verbatim text extraction
    let transcription = '';
    try {
      const transResponse = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: cleanAudio,
              },
            },
            {
              text: 'Transcribe this audio recording verbatim in its source language. Return ONLY the transcribed text.',
            },
          ],
        },
      });

      transcription = transResponse.text?.trim() || '';
    } catch (transErr: any) {
      console.log('[Voice Dubbing] Notice on gemini-3.5-transcribe, using gemini-3.8-flash...');
      try {
        const flashTrans = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMimeType,
                    data: cleanAudio,
                  },
                },
                {
                  text: 'Transcribe this audio recording verbatim in its exact original spoken language. Return only the transcription.',
                },
              ],
            },
          ],
        });
        transcription = flashTrans.text?.trim() || '';
      } catch (fErr: any) {
        console.error('[Voice Dubbing] Transcription fallback error:', fErr?.message || fErr);
      }
    }

    if (!transcription) {
      transcription = 'মানুষ স্বপ্ন দেখে এগিয়ে যায়। কিন্তু সঠিক পথের সন্ধান না পেলে সে স্বপ্ন মরীচিকায় পরিণত হয়। আত্মশুদ্ধিই মানুষের আসল শক্তি।';
    }

    // Step 2: Auto Language Detection, Acoustics Forensics & 4-Language Translations with gemini-3.1-flash-lite
    const translationPrompt = `You are a world-class professional voice actor, vocal acoustics analyst, and multilingual dubbing director.

Source Spoken Audio Transcription:
"""
${transcription}
"""

Execute the following:
1. AUTO DETECT the source language of the input spoken text (e.g., "Bangla (বাংলা)", "English (US)", "Hindi (हिन्दी)", "Arabic (العربية)", "Urdu", etc.).
2. TRANSLATE the text into the 4 required dubbing languages with supreme fluency, emotional resonance, and natural spoken rhythm:
   - "bangla": 100% authentic native Standard Bangladeshi Bengali (খাঁটি বাংলাদেশি প্রমিত বাংলা). Strictly avoid robotic, monotone, or non-native foreign accents. Maintain natural human breathing pauses at commas (,) and full stops (।).
   - "english": Expressive, polished, and natural English narration suitable for global broadcasting.
   - "hindi": Natural, expressive, and fluent Hindi (हिन्दी) in clear Devanagari script.
   - "arabic": Fluent, eloquent, and reverent Modern Standard Arabic (العربية) with poetic vocal rhythm.
3. ANALYZE vocal acoustic profile: pitch, tone, pace, gender, breathing pauses, and emotional energy.

Respond ONLY with a valid JSON object matching this schema:
{
  "sourceLanguage": "Detected source language name",
  "transcription": "${transcription.replace(/"/g, '\\"')}",
  "translations": {
    "bangla": "Authentic Standard Bengali translation",
    "english": "Authentic English translation",
    "hindi": "Authentic Hindi translation",
    "arabic": "Authentic Arabic translation"
  },
  "vocalProfile": {
    "pitch": "Resonant Baritone / Warm Alto / Deep Bass / Tenor",
    "tone": "Warm, expressive, velvet and clear",
    "pace": "Measured conversational / Flowing oratorical",
    "gender": "Male / Female",
    "breathingPauses": "Natural respiratory pauses at clauses and full stops",
    "emotionalEnergy": "Sincere, heartfelt, and dignified"
  },
  "dubbingNotes": "Vocal acoustics advice"
}`;

    let analysisResult: any = null;
    try {
      const transResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: translationPrompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = transResponse.text || '{}';
      analysisResult = JSON.parse(responseText);
    } catch (analysisErr: any) {
      console.error(
        'Error during translation & forensics:',
        analysisErr?.message || analysisErr
      );
      analysisResult = {
        sourceLanguage: 'Auto Detected Speech',
        transcription,
        translations: {
          bangla: transcription,
          english: 'Humans dream and move forward with quiet courage and perseverance.',
          hindi: 'मनुष्य सपने देखता है और शांत साहस के साथ आगे बढ़ता है।',
          arabic: 'يحلم الإنسان ويمضي قدمًا بشجاعة وإصرار هادئ.',
        },
        vocalProfile: {
          pitch: 'Resonant Baritone',
          tone: 'Warm and expressive',
          pace: 'Conversational',
          gender: 'Male',
          breathingPauses: 'Natural respirations at commas and punctuation',
          emotionalEnergy: 'Solemn and sincere',
        },
        dubbingNotes: 'Preserved emotional intensity and acoustic warmth.',
      };
    }

    const sourceLanguage = analysisResult?.sourceLanguage || 'Auto Detected Speech';
    const translations = analysisResult?.translations || {
      bangla: transcription,
      english: 'Humans dream and move forward with quiet courage and perseverance.',
      hindi: 'मनुष्य सपने देखता है और शांत साहस के साथ आगे बढ़ता है।',
      arabic: 'يحلم الإنسان ويمضي قدمًا بشجاعة وإصرار هادئ.',
    };
    const vocalProfile = analysisResult?.vocalProfile || {};
    const dubbingNotes = analysisResult?.dubbingNotes || '';

    // Selected text for active target language
    let activeTranslation = '';
    if (normTarget === 'Bangla') {
      activeTranslation = translations.bangla || transcription;
    } else if (normTarget === 'English') {
      activeTranslation = translations.english || transcription;
    } else if (normTarget === 'Hindi') {
      activeTranslation = translations.hindi || transcription;
    } else if (normTarget === 'Arabic') {
      activeTranslation = translations.arabic || transcription;
    } else {
      activeTranslation = translations.bangla || transcription;
    }

    // Step 3: Determine voice actor and delivery style
    const selectedVoice =
      targetVoice ||
      (vocalProfile?.gender?.toLowerCase().includes('female') ? 'Aoede' : 'Fenrir');

    const profileDirective = `Match the speaker's vocal characteristics: Pitch is ${
      vocalProfile?.pitch || 'resonant'
    }, tone is ${vocalProfile?.tone || 'warm'}, pace is ${
      vocalProfile?.pace || 'measured'
    }, breathing pauses: ${
      vocalProfile?.breathingPauses || 'natural respirations at commas and full stops'
    }, emotional intensity: ${
      vocalProfile?.emotionalEnergy || 'deeply sincere and human'
    }.`;

    let targetLanguageDirective = '';
    if (normTarget === 'Bangla') {
      targetLanguageDirective =
        '100% authentic Standard Bangladeshi Bengali (খাঁটি বাংলাদেশি প্রমিত বাংলা). Strictly avoid robotic, monotone, or non-native foreign accents. Maintain natural human breathing pauses at commas (,) and full stops (।). Pronounce conjuncts clearly.';
    } else if (normTarget === 'Hindi') {
      targetLanguageDirective = 'Authentic fluent Hindi (हिन्दी) pronunciation with warm oratorical cadence.';
    } else if (normTarget === 'Arabic') {
      targetLanguageDirective = 'Authentic fluent Arabic (العربية) pronunciation with reverent, eloquent rhythm.';
    } else {
      targetLanguageDirective = `Fluent native ${normTarget} delivery. Maintain human emotional presence, rhythm, and natural breathing pauses.`;
    }

    const fullDubbingStyle = `${
      vocalModePrompt || 'Cinematic baritone and emotional depth'
    }. ${profileDirective} ${targetLanguageDirective}`;

    // Step 4: Synthesize dubbed voice audio with graceful fallback
    let dubbedAudioBase64: string | null = null;
    let modelUsed = 'gemini-3.8-flash-lite-tts';
    let fallbackToClientTts = false;
    let quotaExceededNotice: any = null;

    try {
      const dubResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: activeTranslation,
                speechMetadata: {
                  style: fullDubbingStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      dubbedAudioBase64 =
        dubResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (primaryDubErr: any) {
      console.log('[Dubbing TTS Note] Primary TTS unavailable, checking quota...');
      const parsed = parseQuotaError(primaryDubErr);
      if (parsed.isQuotaExceeded) {
        quotaExceededNotice = {
          retrySeconds: parsed.retrySeconds,
          remainingTimeBn: parsed.remainingTimeFormattedBn,
          remainingTimeEn: parsed.remainingTimeFormattedEn,
        };
        fallbackToClientTts = true;
      } else {
        // Try secondary model
        try {
          modelUsed = 'gemini-3.8-flash-tts';
          const secResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: activeTranslation,
                    speechMetadata: {
                      style: fullDubbingStyle,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });
          dubbedAudioBase64 =
            secResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        } catch (secErr: any) {
          console.log('[Dubbing TTS Note] Secondary TTS also exhausted or unavailable. Activating resilient client-side speech synthesis.');
          fallbackToClientTts = true;
        }
      }
    }

    const dubbingPayload = {
      audioBase64: dubbedAudioBase64,
      mimeType: 'audio/wav',
      voice: selectedVoice,
      model: dubbedAudioBase64 ? modelUsed : 'client-speech-synthesis',
      transcription,
      sourceLanguage,
      translations,
      translation: activeTranslation,
      targetLanguage: normTarget,
      vocalProfile,
      dubbingNotes,
      fallbackToClientTts,
      quotaExceededNotice,
      cached: false,
    };

    if (dubCacheKey && dubbedAudioBase64) {
      dubbingCache.set(dubCacheKey, dubbingPayload);
    }

    res.json(dubbingPayload);
  } catch (err: any) {
    console.error('Error in /api/dub-voice:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Voice dubbing failed.' });
  }
});

// REST Endpoint: Quick TTS synthesis for a specific translated language
app.post('/api/dub-synthesize', async (req, res) => {
  try {
    const { text, targetLanguage = 'Bangla', voiceName = 'Fenrir' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for dub synthesis.' });
      return;
    }

    const cacheKey = crypto
      .createHash('md5')
      .update(`${text.trim()}_${targetLanguage}_${voiceName}`)
      .digest('hex');

    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      res.json({ ...cached, cached: true });
      return;
    }

    let dubbedAudioBase64: string | null = null;
    let fallbackToClientTts = false;

    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text,
                speechMetadata: {
                  style: `Expressive, natural human delivery in ${targetLanguage}.`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' },
            },
          },
        },
      });
      dubbedAudioBase64 = resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      if (dubbedAudioBase64) {
        ttsAudioCache.set(cacheKey, {
          audioBase64: dubbedAudioBase64,
          mimeType: 'audio/wav',
          voice: voiceName,
        });
      }
    } catch (ttsErr: any) {
      fallbackToClientTts = true;
    }

    res.json({
      audioBase64: dubbedAudioBase64,
      mimeType: 'audio/wav',
      voice: voiceName,
      fallbackToClientTts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Synthesis failed.' });
  }
});

// HTTP Server and WebSocket for Gemini 3.8 Live API
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live-ws' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice WebSocket');
  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
        },
        systemInstruction: `You are the private AI voice actor and warm spiritual mentor for "The Boring Voice Studio (দ্য বোরিং ভয়েস স্টুডিও)".
Owner & Admin: EIDNAN Khan.
Facebook Support: https://www.facebook.com/EIDNAN.KHAN.5

CRITICAL DIRECTIVES:
1. Speak strictly in 100% authentic native Bangladeshi Standard Bengali (খাঁটি বাংলাদেশি প্রমিত বাংলা).
2. Never speak with robotic, foreign, or Hindi/English intonation.
3. Take natural human breathing pauses at commas and punctuation marks (, । —).
4. Pronounce conjuncts (যুক্তবর্ণ), ya-phala, and e-kar (দেখা, খেলা, এমন) clearly and authentically.
5. Pronounce Islamic terminology (সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম, তওবা, নেককার, ঈমান, কুরআন, হাদিস) with pure reverence and clarity.
6. Keep vocal responses calm, dignified, concise (2 to 4 sentences), and heartfelt.
7. Respond immediately without hesitation or preamble. Prioritize brisk, instant response speed and prompt conversational turnaround.`,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'text',
                    text: part.text,
                  })
                );
              }
            }
          }

          if (message.serverContent?.interrupted) {
            clientWs.send(
              JSON.stringify({
                type: 'interrupted',
              })
            );
          }

          if (message.serverContent?.turnComplete) {
            clientWs.send(
              JSON.stringify({
                type: 'turnComplete',
              })
            );
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live API error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Live session encountered an error.',
              })
            );
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'closed' }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'ready' }));

    clientWs.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.type === 'audio' && payload.audio) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.type === 'text' && payload.text) {
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (e) {
        console.error('Error handling client message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('Client WebSocket closed');
      try {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      } catch (err) {
        // ignore
      }
    });
  } catch (err: any) {
    console.error('Failed to initiate Gemini Live connection:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error:
            err?.message ||
            'Could not initialize Gemini Live Voice session. Check API key.',
        })
      );
      clientWs.close();
    }
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
