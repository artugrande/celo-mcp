import { isAddress, getAddress } from 'viem';
import { err, type ToolError } from '@/lib/types';

export interface ResolveResult {
  address: `0x${string}`;
}

export function resolveAddress(args: { nameOrAddress: string }): ResolveResult | ToolError {
  const raw = args.nameOrAddress.trim();
  if (!isAddress(raw)) {
    return err('INVALID_ADDRESS', `"${raw}" is not a valid Celo/EVM address (expected 0x + 40 hex chars).`);
  }
  return { address: getAddress(raw) };
}
