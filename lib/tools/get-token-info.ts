import { getToken } from '@/lib/tokens';
import { err, type ToolError } from '@/lib/types';

export interface TokenInfoResult {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  type: string;
}

export function getTokenInfo(args: { token: string }): TokenInfoResult | ToolError {
  const t = getToken(args.token);
  if (!t) {
    return err('UNKNOWN_TOKEN', `"${args.token}" is not in the verified Celo token registry.`);
  }
  return { symbol: t.symbol, address: t.address, decimals: t.decimals, type: t.type };
}
