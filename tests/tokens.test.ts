import { describe, it, expect } from 'vitest';
import { TOKENS, getToken } from '@/lib/tokens';

describe('token registry', () => {
  it('has USDC with 6 decimals and the verified address', () => {
    const t = getToken('USDC');
    expect(t?.address).toBe('0xcebA9300f2b948710d2653dD7B07f33A8B32118C');
    expect(t?.decimals).toBe(6);
  });

  it('has USDm with 18 decimals', () => {
    expect(getToken('USDm')?.decimals).toBe(18);
  });

  it('is case-insensitive on symbol lookup', () => {
    expect(getToken('usdc')?.symbol).toBe('USDC');
  });

  it('returns undefined for unknown tokens', () => {
    expect(getToken('DOGE')).toBeUndefined();
  });

  it('treats cUSD as an alias for USDm', () => {
    expect(getToken('cUSD')?.symbol).toBe('USDm');
  });

  it('registry is non-empty', () => {
    expect(TOKENS.length).toBeGreaterThan(0);
  });
});
