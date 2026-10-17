import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';

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
    let modelUsed = 'gemini-3.8-flash-lite-tts';

    let lastQuotaError: any = null;

    // Try primary model (gemini-3.8-flash-lite-tts)
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
        lastQuotaError = liteErr;
        console.log(
          '[TTS Notice] Primary model (gemini-3.8-flash-lite-tts) reached daily free tier quota. Switching to secondary model...'
        );
      } else {
        console.log(
          '[TTS Notice] Primary model unavailable, trying secondary model (gemini-3.8-flash-tts)...'
        );
      }

      // Attempt secondary model
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
        systemInstruction: `You are the private AI voice actor and warm spiritual mentor for "EIDNAN ভয়েসস্টুডিও".
Owner & Admin: EIDNAN Khan.
Facebook Support: https://www.facebook.com/EIDNAN.KHAN.5

CRITICAL DIRECTIVES:
1. Speak strictly in 100% authentic native Bangladeshi Standard Bengali (খাঁটি বাংলাদেশি প্রমিত বাংলা).
2. Never speak with robotic, foreign, or Hindi/English intonation.
3. Take natural human breathing pauses at commas and punctuation marks (, । —).
4. Pronounce conjuncts (যুক্তবর্ণ), ya-phala, and e-kar (দেখা, খেলা, এমন) clearly and authentically.
5. Pronounce Islamic terminology (সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম, তওবা, নেককার, ঈমান, কুরআন, হাদিস) with pure reverence and clarity.
6. Keep vocal responses calm, dignified, concise (2 to 4 sentences), and heartfelt.`,
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
