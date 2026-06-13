import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { getToken } from '@/lib/tokens';
import { CELO_CHAIN_ID } from '@/lib/contracts';
import { resolveAddress } from '@/lib/tools/resolve-address';
import { err, isError, type ToolError, type UnsignedTx } from '@/lib/types';

export interface SendResult {
  summary: string;
  unsignedTx: UnsignedTx;
}

export function buildSendTx(args: {
  from: string;
  to: string;
  token: string;
  amount: string;
}): SendResult | ToolError {
  const to = resolveAddress({ nameOrAddress: args.to });
  if (isError(to)) return to;

  const t = getToken(args.token);
  if (!t) return err('UNKNOWN_TOKEN', `"${args.token}" is not in the verified token registry.`);

  let value: bigint;
  try {
    value = parseUnits(args.amount, t.decimals);
  } catch {
    return err('INVALID_AMOUNT', `"${args.amount}" is not a valid decimal amount.`);
  }

  if (t.type === 'native') {
    return {
      summary: `Send ${args.amount} CELO to ${to.address}`,
      unsignedTx: { chainId: CELO_CHAIN_ID, to: to.address, data: '0x', value: value.toString() },
    };
  }

  const data = encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to.address, value] });
  return {
    summary: `Send ${args.amount} ${t.symbol} to ${to.address}`,
    unsignedTx: { chainId: CELO_CHAIN_ID, to: t.address, data, value: '0' },
  };
}
