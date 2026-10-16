/**
 * Audio processing utilities for PCM conversion, Live API streaming, and Web Audio synthesis
 */

// Convert Float32Array (Web Audio standard) to 16-bit signed PCM ArrayBuffer, then base64
export function float32ToPcm16Base64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    // Clamp sample between -1 and 1
    const s = Math.max(-1, Math.min(1, input[i]));
    // Convert to signed 16-bit PCM (-32768 to 32767)
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 raw 16-bit PCM (from Gemini Live API 24kHz) to Float32Array
export function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(len / 2);
  const float32 = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 32768;
  }

  return float32;
}

// Create an ambient soundscape using Web Audio API synthesis (warm drone, binaural calmness, subtle reverb)
export function createAmbientGenerator(ctx: AudioContext) {
  let isPlaying = false;
  let masterGain: GainNode | null = null;
  let nodesToClean: Array<AudioNode | { stop: () => void }> = [];

  return {
    start: () => {
      if (isPlaying) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Low peaceful sub-bass drone (108Hz / 162Hz fifth)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, ctx.currentTime);
      filter.Q.setValueAtTime(2, ctx.currentTime);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(108, ctx.currentTime); // A2 harmonic

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(162, ctx.currentTime); // E3 perfect fifth

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.35, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(masterGain);

      osc1.start();
      osc2.start();

      nodesToClean.push(osc1, osc2, droneGain, filter);
      isPlaying = true;
    },
    stop: () => {
      if (!isPlaying) return;
      nodesToClean.forEach((n: any) => {
        try {
          if (typeof n.stop === 'function') n.stop();
          if (typeof n.disconnect === 'function') n.disconnect();
        } catch {
          // ignore
        }
      });
      if (masterGain) {
        masterGain.disconnect();
        masterGain = null;
      }
      nodesToClean = [];
      isPlaying = false;
    },
    setVolume: (val: number) => {
      if (masterGain) {
        masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), ctx.currentTime);
      }
    },
    get isRunning() {
      return isPlaying;
    },
  };
}
