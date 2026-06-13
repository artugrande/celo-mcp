import { describe, it, expect, vi } from 'vitest';
import { getBalance } from '@/lib/tools/get-balance';

function mockClient(opts: { native?: bigint; erc20?: bigint }) {
  return {
    getBalance: vi.fn().mockResolvedValue(opts.native ?? 0n),
    readContract: vi.fn().mockResolvedValue(opts.erc20 ?? 0n),
  } as any;
}

describe('getBalance', () => {
  it('returns a single token balance formatted by decimals', async () => {
    // 2_500_000 raw / 1e6 = 2.5 USDC
    const client = mockClient({ erc20: 2_500_000n });
    const r = await getBalance(client, {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      token: 'USDC',
    });
    expect(r).toMatchObject({
      balances: [{ symbol: 'USDC', formatted: '2.5', raw: '2500000', decimals: 6 }],
    });
  });

  it('rejects an invalid address', async () => {
    const r = await getBalance(mockClient({}), { address: 'nope' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });

  it('rejects an unknown token', async () => {
    const r = await getBalance(mockClient({}), {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      token: 'DOGE',
    });
    expect(r).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });

  it('maps an RPC failure to RPC_TIMEOUT', async () => {
    const client = { getBalance: vi.fn(), readContract: vi.fn().mockRejectedValue(new Error('boom')) } as any;
    const r = await getBalance(client, {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      token: 'USDC',
    });
    expect(r).toMatchObject({ error: true, code: 'RPC_TIMEOUT' });
  });
});
