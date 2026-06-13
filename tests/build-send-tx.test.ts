import { describe, it, expect } from 'vitest';
import { buildSendTx } from '@/lib/tools/build-send-tx';
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';

const FROM = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const TO = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';

describe('buildSendTx', () => {
  it('builds an ERC-20 transfer unsigned tx', () => {
    const r = buildSendTx({ from: FROM, to: TO, token: 'USDC', amount: '5' });
    const expectedData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [TO, parseUnits('5', 6)],
    });
    expect(r).toMatchObject({
      unsignedTx: {
        chainId: 42220,
        to: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // the USDC token contract
        data: expectedData,
        value: '0',
      },
    });
  });

  it('builds a native CELO transfer (value set, empty data, to = recipient)', () => {
    const r = buildSendTx({ from: FROM, to: TO, token: 'CELO', amount: '1' });
    expect(r).toMatchObject({
      unsignedTx: { chainId: 42220, to: TO, data: '0x', value: parseUnits('1', 18).toString() },
    });
  });

  it('rejects an unknown token', () => {
    const r = buildSendTx({ from: FROM, to: TO, token: 'DOGE', amount: '1' });
    expect(r).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });

  it('rejects a bad recipient', () => {
    const r = buildSendTx({ from: FROM, to: 'nope', token: 'USDC', amount: '1' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });
});
