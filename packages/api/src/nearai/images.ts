import { isNearAIBaseURL } from './attestation';

/** NEAR's OpenAI-compatible image API requires concrete size and quality values. */
export function resolveImageOptions<T extends { size?: string; quality?: string }>(
  baseURL: string,
  options: T,
): T {
  if (!isNearAIBaseURL(baseURL)) {
    return options;
  }
  let quality = options.quality;
  if (!quality || ['auto', 'low', 'medium'].includes(quality)) {
    quality = 'standard';
  } else if (quality === 'high') {
    quality = 'hd';
  }
  return {
    ...options,
    size: !options.size || options.size === 'auto' ? '1024x1024' : options.size,
    quality,
  };
}
