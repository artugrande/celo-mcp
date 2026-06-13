import { describe, it, expect, vi } from 'vitest';
import { buildSwapTx } from '@/lib/tools/build-swap-tx';

const FROM = '0x471EcE3750Da237f93B8E339c536989b8978a438';

function mockClient(amountOut: bigint) {
  return {
    // quoteExactInputSingle returns a 4-tuple; first element is amountOut
    readContract: vi.fn().mockResolvedValue([amountOut, 0n, 0, 0n]),
  } as any;
}

describe('buildSwapTx', () => {
  it('returns a quote + unsigned swap tx + approval tx', async () => {
    // 1 USDC in (6 dec) -> ~0.99 USDm out (18 dec)
    const client = mockClient(990_000_000_000_000_000n);
    const r = await buildSwapTx(client, {
      from: FROM,
      tokenIn: 'USDC',
      tokenOut: 'USDm',
      amountIn: '1',
      slippage: 0.5,
    });
    expect(r).toMatchObject({
      quote: { amountOut: '0.99' },
      approvalTx: { chainId: 42220, to: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' },
      unsignedTx: { chainId: 42220, to: '0x5615CDAb10dc425a742d643d949a7F474C01abc4', value: '0' },
    });
    // min out must be below the quote (slippage applied)
    expect(Number((r as any).quote.minOut)).toBeLessThan(0.99);
  });

  it('rejects an unknown token', async () => {
    const r = await buildSwapTx(mockClient(1n), { from: FROM, tokenIn: 'DOGE', tokenOut: 'USDC', amountIn: '1' });
    expect(r).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });

  it('rejects out-of-range slippage', async () => {
    const r = await buildSwapTx(mockClient(1n), { from: FROM, tokenIn: 'USDC', tokenOut: 'USDm', amountIn: '1', slippage: 150 });
    expect(r).toMatchObject({ error: true, code: 'INVALID_SLIPPAGE' });
  });

  it('maps quoter failure to NO_ROUTE', async () => {
    const client = { readContract: vi.fn().mockRejectedValue(new Error('no pool')) } as any;
    const r = await buildSwapTx(client, { from: FROM, tokenIn: 'USDC', tokenOut: 'USDm', amountIn: '1' });
    expect(r).toMatchObject({ error: true, code: 'NO_ROUTE' });
  });
});
