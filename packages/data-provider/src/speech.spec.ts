import { configSchema } from './config';

describe('microphone upload format configuration', () => {
  it('keeps native recordings as the default', () => {
    const config = configSchema.parse({
      version: '1.3.18',
      speech: { speechTab: { speechToText: { engineSTT: 'external' } } },
    });
    expect(config.speech?.speechTab?.speechToText).toEqual({
      engineSTT: 'external',
      audioFormat: 'native',
    });
  });

  it('accepts WAV conversion and rejects unsupported output formats', () => {
    const config = (audioFormat: string) => ({
      version: '1.3.18',
      speech: { speechTab: { speechToText: { audioFormat } } },
    });
    expect(configSchema.safeParse(config('wav')).success).toBe(true);
    expect(configSchema.safeParse(config('mp3')).success).toBe(false);
  });
});
