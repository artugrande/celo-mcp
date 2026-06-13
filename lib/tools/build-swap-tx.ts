import { type PublicClient, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { getToken } from '@/lib/tokens';
import { CELO_CHAIN_ID, CONTRACTS } from '@/lib/contracts';
import { quoterV2Abi, swapRouter02Abi } from '@/lib/abi/uniswap';
import { err, type ToolError, type UnsignedTx } from '@/lib/types';

const DEFAULT_FEE = 3000; // 0.3%

export interface SwapResult {
  summary: string;
  quote: { amountOut: string; minOut: string; feeTier: number };
  approvalTx: UnsignedTx;
  unsignedTx: UnsignedTx;
}

export async function buildSwapTx(
  client: PublicClient,
  args: {
    from: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage?: number; // percent, default 0.5
    feeTier?: number;
  },
): Promise<SwapResult | ToolError> {
  const tin = getToken(args.tokenIn);
  const tout = getToken(args.tokenOut);
  if (!tin || !tout) return err('UNKNOWN_TOKEN', `Unknown token in swap pair ${args.tokenIn}/${args.tokenOut}.`);

  let amountIn: bigint;
  try {
    amountIn = parseUnits(args.amountIn, tin.decimals);
  } catch {
    return err('INVALID_AMOUNT', `"${args.amountIn}" is not a valid decimal amount.`);
  }

  const slippage = args.slippage ?? 0.5;
  if (slippage < 0 || slippage > 50) {
    return err('INVALID_SLIPPAGE', 'slippage must be a percent between 0 and 50.');
  }

  const fee = args.feeTier ?? DEFAULT_FEE;
  let amountOut: bigint;
  try {
    const res = (await client.readContract({
      address: CONTRACTS.uniswapQuoterV2 as `0x${string}`,
      abi: quoterV2Abi,
      functionName: 'quoteExactInputSingle',
      args: [{ tokenIn: tin.address, tokenOut: tout.address, amountIn, fee, sqrtPriceLimitX96: 0n }],
    })) as readonly [bigint, bigint, number, bigint];
    amountOut = res[0];
  } catch (e) {
    return err('NO_ROUTE', `No Uniswap v3 route for ${tin.symbol}->${tout.symbol} at fee ${fee}: ${(e as Error).message}`);
  }

  const minOut = (amountOut * BigInt(Math.round((100 - slippage) * 100))) / 10_000n;

  const approvalData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [CONTRACTS.uniswapSwapRouter02 as `0x${string}`, amountIn],
  });

  const swapData = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: tin.address,
        tokenOut: tout.address,
        fee,
        recipient: args.from as `0x${string}`,
        amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return {
    summary: `Swap ${args.amountIn} ${tin.symbol} for ~${formatUnits(amountOut, tout.decimals)} ${tout.symbol} (approve first).`,
    quote: { amountOut: formatUnits(amountOut, tout.decimals), minOut: formatUnits(minOut, tout.decimals), feeTier: fee },
    approvalTx: { chainId: CELO_CHAIN_ID, to: tin.address, data: approvalData, value: '0' },
    unsignedTx: { chainId: CELO_CHAIN_ID, to: CONTRACTS.uniswapSwapRouter02 as `0x${string}`, data: swapData, value: '0' },
  };
}
