import { describe, it, expect } from 'vitest';
import { listCapabilities } from '@/lib/tools/list-capabilities';

describe('listCapabilities', () => {
  it('reports chain, tool names, and supported tokens', () => {
    const r = listCapabilities();
    expect(r.chain).toMatchObject({ name: 'Celo', chainId: 42220 });
    expect(r.tools).toContain('get_balance');
    expect(r.tools).toContain('x402_pay');
    expect(r.tools.length).toBe(8);
    expect(r.tokens).toContain('USDC');
  });
});
