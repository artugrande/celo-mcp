import { describe, it, expect, vi } from 'vitest';
import { agentIdentity } from '@/lib/tools/agent-identity';

function mockClient(over: Partial<Record<string, any>> = {}) {
  return {
    readContract: vi.fn().mockImplementation(({ functionName }: any) => {
      const table: Record<string, any> = {
        ownerOf: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        tokenURI: 'ipfs://QmAgentMeta',
        getAgentWallet: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
        getSummary: [3n, 270n, 0],
        ...over,
      };
      if (functionName in table) return Promise.resolve(table[functionName]);
      return Promise.reject(new Error('unexpected'));
    }),
  } as any;
}

describe('agentIdentity', () => {
  it('returns identity + reputation summary for a registered agentId', async () => {
    const r = await agentIdentity(mockClient(), { agentId: '7' });
    expect(r).toMatchObject({
      agentId: '7',
      owner: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      metadataUri: 'ipfs://QmAgentMeta',
      paymentWallet: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      reputation: { feedbackCount: '3', sum: '270' },
    });
  });

  it('returns AGENT_NOT_FOUND when ownerOf reverts', async () => {
    const client = { readContract: vi.fn().mockRejectedValue(new Error('ERC721: invalid token ID')) } as any;
    const r = await agentIdentity(client, { agentId: '999999' });
    expect(r).toMatchObject({ error: true, code: 'AGENT_NOT_FOUND' });
  });

  it('requires agentId or address', async () => {
    const r = await agentIdentity(mockClient(), {} as any);
    expect(r).toMatchObject({ error: true, code: 'INVALID_INPUT' });
  });
});
