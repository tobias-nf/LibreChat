import { resolveImageOptions } from './images';

describe('NEAR AI image request compatibility', () => {
  it('replaces OpenAI defaults rejected by NEAR while preserving the request', () => {
    expect(
      resolveImageOptions('https://cloud-api.near.ai/v1', {
        model: 'black-forest-labs/FLUX.2-klein-4B',
        prompt: 'A blue circle',
        n: 1,
        size: 'auto',
        quality: 'auto',
      }),
    ).toEqual({
      model: 'black-forest-labs/FLUX.2-klein-4B',
      prompt: 'A blue circle',
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
  });

  it('preserves supported explicit NEAR options for generation and editing', () => {
    expect(
      resolveImageOptions('https://cloud-stg-api.near.ai/v1', {
        size: '1536x1024',
        quality: 'hd',
      }),
    ).toEqual({ size: '1536x1024', quality: 'hd' });
  });

  it('maps high quality to the NEAR API equivalent', () => {
    expect(resolveImageOptions('https://cloud-api.near.ai/v1', { quality: 'high' }).quality).toBe(
      'hd',
    );
  });

  it.each(['https://api.openai.com/v1', 'https://cloud-api.near.ai.example.com/v1'])(
    'leaves other providers unchanged: %s',
    (baseURL) => {
      const options = { size: 'auto', quality: 'auto' };
      expect(resolveImageOptions(baseURL, options)).toBe(options);
    },
  );
});
