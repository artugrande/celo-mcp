import { describe, it, expect, vi } from 'vitest';
import { x402Pay } from '@/lib/tools/x402-pay';

function challengeResponse(body: any) {
  return new Response(JSON.stringify(body), { status: 402, headers: { 'content-type': 'application/json' } });
}

describe('x402Pay', () => {
  it('parses a 402 challenge and builds an unsigned USDC payment', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      challengeResponse({
        scheme: 'fixed',
        price: '100000', // 0.10 USDC (6 dec)
        currency: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
        chainId: 42220,
        payTo: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      }),
    );
    const r = await x402Pay({ url: 'https://api.example.com/paid', from: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' }, fetchFn);
    expect(r).toMatchObject({
      challenge: { token: 'USDC', amount: '0.1' },
      unsignedTx: { chainId: 42220, to: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', value: '0' },
      retry: { header: 'X-PAYMENT' },
    });
  });

  it('returns X402_NO_CHALLENGE when the resource does not return 402', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    const r = await x402Pay({ url: 'https://api.example.com/free', from: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' }, fetchFn);
    expect(r).toMatchObject({ error: true, code: 'X402_NO_CHALLENGE' });
  });

  it('enforces maxAmount', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      challengeResponse({ price: '5000000', currency: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', chainId: 42220, payTo: '0x471EcE3750Da237f93B8E339c536989b8978a438' }),
    );
    const r = await x402Pay({ url: 'https://x', from: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', maxAmount: '1' }, fetchFn);
    expect(r).toMatchObject({ error: true, code: 'X402_OVER_MAX' });
  });
});
