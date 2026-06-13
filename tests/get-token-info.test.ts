import { describe, it, expect } from 'vitest';
import { getTokenInfo } from '@/lib/tools/get-token-info';

describe('getTokenInfo', () => {
  it('returns full info for a known token', () => {
    expect(getTokenInfo({ token: 'USDC' })).toEqual({
      symbol: 'USDC',
      address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      decimals: 6,
      type: 'bridged',
    });
  });

  it('resolves aliases', () => {
    expect(getTokenInfo({ token: 'cUSD' })).toMatchObject({ symbol: 'USDm' });
  });

  it('returns UNKNOWN_TOKEN otherwise', () => {
    expect(getTokenInfo({ token: 'DOGE' })).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });
});
