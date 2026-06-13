import { type PublicClient, formatUnits, erc20Abi } from 'viem';
import { TOKENS, getToken, type TokenInfo } from '@/lib/tokens';
import { resolveAddress } from '@/lib/tools/resolve-address';
import { err, isError, type ToolError } from '@/lib/types';

export interface BalanceEntry {
  symbol: string;
  formatted: string;
  raw: string;
  decimals: number;
}
export interface BalanceResult {
  address: `0x${string}`;
  balances: BalanceEntry[];
}

async function readOne(client: PublicClient, address: `0x${string}`, t: TokenInfo): Promise<BalanceEntry> {
  const raw =
    t.type === 'native'
      ? await client.getBalance({ address })
      : ((await client.readContract({
          address: t.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        })) as bigint);
  return { symbol: t.symbol, formatted: formatUnits(raw, t.decimals), raw: raw.toString(), decimals: t.decimals };
}

export async function getBalance(
  client: PublicClient,
  args: { address: string; token?: string },
): Promise<BalanceResult | ToolError> {
  const resolved = resolveAddress({ nameOrAddress: args.address });
  if (isError(resolved)) return resolved;

  let list: TokenInfo[];
  if (args.token) {
    const t = getToken(args.token);
    if (!t) return err('UNKNOWN_TOKEN', `"${args.token}" is not in the verified token registry.`);
    list = [t];
  } else {
    list = TOKENS;
  }

  try {
    const balances = await Promise.all(list.map((t) => readOne(client, resolved.address, t)));
    return { address: resolved.address, balances };
  } catch (e) {
    return err('RPC_TIMEOUT', `Celo RPC read failed: ${(e as Error).message}`);
  }
}
