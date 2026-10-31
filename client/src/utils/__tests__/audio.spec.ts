import { encodeWav, convertAudioToWav } from '../audio';

describe('microphone WAV conversion', () => {
  it('writes PCM headers, interleaves channels, and clips samples', () => {
    const channels = [new Float32Array([-2, 0, 2]), new Float32Array([1, -1, 0.5])];
    const buffer = encodeWav({
      numberOfChannels: 2,
      length: 3,
      sampleRate: 48000,
      getChannelData: (i) => channels[i],
    });
    const view = new DataView(buffer);
    const text = (start: number, length: number) =>
      String.fromCharCode(...new Uint8Array(buffer, start, length));
    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 8)).toBe('WAVEfmt ');
    expect(text(36, 4)).toBe('data');
    expect(view.getUint32(4, true)).toBe(buffer.byteLength - 8);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(48000);
    expect(view.getUint32(28, true)).toBe(192000);
    expect(view.getUint16(32, true)).toBe(4);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(12);
    expect(Array.from({ length: 6 }, (_, i) => view.getInt16(44 + i * 2, true))).toEqual([
      -32768, 32767, 0, -32768, 32767, 16383,
    ]);
  });

  it.each([false, true])(
    'closes the decoder context after success or failure: %s',
    async (reject) => {
      const original = global.AudioContext;
      const close = jest.fn().mockResolvedValue(undefined);
      const decoded = {
        numberOfChannels: 1,
        length: 1,
        sampleRate: 16000,
        getChannelData: () => new Float32Array([0]),
      };
      const decode = reject
        ? jest.fn().mockRejectedValue(new Error('decode failed'))
        : jest.fn().mockResolvedValue(decoded);
      class Decoder {
        close = close;
        decodeAudioData = decode;
      }
      Object.defineProperty(global, 'AudioContext', { configurable: true, value: Decoder });
      const recording = new Blob(['recording']);
      Object.defineProperty(recording, 'arrayBuffer', { value: async () => new ArrayBuffer(1) });
      try {
        if (reject) await expect(convertAudioToWav(recording)).rejects.toThrow('decode failed');
        else expect((await convertAudioToWav(recording)).type).toBe('audio/wav');
        expect(close).toHaveBeenCalledTimes(1);
      } finally {
        Object.defineProperty(global, 'AudioContext', { configurable: true, value: original });
      }
    },
  );
});
