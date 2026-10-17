/**
 * Generates a standard 24kHz mono 16-bit WAV buffer with soothing harmonic acoustic tone
 * Used for pre-warming cache and providing smooth audio playback when API quotas are exceeded.
 */

export function createSynthesizedWavBase64(durationSeconds = 6): string {
  const sampleRate = 24000;
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataByteLength = totalSamples * bytesPerSample;
  const headerLength = 44;
  const buffer = new ArrayBuffer(headerLength + dataByteLength);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate (24000)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Generate soothing harmonic acoustic sound (warm resonant tone with gentle decay)
  const baseFreq = 146.83; // D3 warm baritone resonance
  const fifthFreq = 220.0; // A3 harmonic fifth

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Envelope: smooth fade-in and natural decay
    const attack = Math.min(1, t / 0.5);
    const decay = Math.exp(-t / 3.5);
    const env = attack * decay;

    // Harmonic blend
    const wave =
      0.65 * Math.sin(2 * Math.PI * baseFreq * t) +
      0.25 * Math.sin(2 * Math.PI * fifthFreq * t) +
      0.1 * Math.sin(2 * Math.PI * (baseFreq * 2) * t);

    const sample = Math.max(-1, Math.min(1, wave * env * 0.45));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(headerLength + i * bytesPerSample, int16, true);
  }

  // Convert to base64
  const uint8 = new Uint8Array(buffer);
  let binary = '';
  const len = uint8.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}
