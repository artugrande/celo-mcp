import { describe, it, expect } from 'vitest';
import { resolveAddress } from '@/lib/tools/resolve-address';

describe('resolveAddress', () => {
  it('checksums a valid lowercase address', () => {
    const r = resolveAddress({ nameOrAddress: '0x471ece3750da237f93b8e339c536989b8978a438' });
    expect(r).toEqual({ address: '0x471EcE3750Da237f93B8E339c536989b8978a438' });
  });

  it('returns INVALID_ADDRESS for garbage', () => {
    const r = resolveAddress({ nameOrAddress: 'not-an-address' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });

  it('returns INVALID_ADDRESS for wrong-length hex', () => {
    const r = resolveAddress({ nameOrAddress: '0x1234' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });
});
