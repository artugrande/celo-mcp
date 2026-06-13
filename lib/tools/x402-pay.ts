import { encodeFunctionData, erc20Abi, formatUnits } from 'viem';
import { TOKENS } from '@/lib/tokens';
import { CELO_CHAIN_ID, X402_TOKENS } from '@/lib/contracts';
import { err, type ToolError, type UnsignedTx } from '@/lib/types';

type FetchFn = typeof fetch;

// Only stablecoins are valid x402 settlement currencies.
function tokenForSettlement(addr: string) {
  const t = TOKENS.find((x) => x.address.toLowerCase() === addr.toLowerCase());
  return t && (X402_TOKENS as readonly string[]).includes(t.symbol) ? t : undefined;
}

export interface X402Result {
  challenge: { token: string; amount: string; raw: string; payTo: `0x${string}` };
  unsignedTx: UnsignedTx;
  retry: { header: string; note: string };
}

export async function x402Pay(
  args: { url: string; from: string; maxAmount?: string },
  fetchFn: FetchFn = fetch,
): Promise<X402Result | ToolError> {
  let res: Response;
  try {
    res = await fetchFn(args.url, { method: 'GET' });
  } catch (e) {
    return err('X402_FETCH_FAILED', `Could not reach ${args.url}: ${(e as Error).message}`);
  }

  if (res.status !== 402) {
    return err('X402_NO_CHALLENGE', `Resource returned ${res.status}, not 402 Payment Required.`);
  }

  let challenge: any;
  try {
    challenge = await res.json();
  } catch {
    return err('X402_BAD_CHALLENGE', 'The 402 response body was not valid JSON.');
  }

  const currency: string | undefined = challenge.currency || challenge.asset;
  const priceRaw: string | undefined = (challenge.price ?? challenge.amount)?.toString();
  const payTo: string | undefined = challenge.payTo || challenge.recipient || challenge.address;
  if (!currency || !priceRaw || !payTo) {
    return err('X402_BAD_CHALLENGE', 'Challenge is missing currency, price, or payTo.');
  }

  const token = tokenForSettlement(currency);
  if (!token) return err('X402_UNSUPPORTED_TOKEN', `Payment currency ${currency} is not a supported Celo stablecoin (USDC, USDT, USDm).`);

  const amount = BigInt(priceRaw);
  const formatted = formatUnits(amount, token.decimals);

  if (args.maxAmount && Number(formatted) > Number(args.maxAmount)) {
    return err('X402_OVER_MAX', `Requested ${formatted} ${token.symbol} exceeds maxAmount ${args.maxAmount}.`);
  }

  const data = encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [payTo as `0x${string}`, amount] });

  return {
    challenge: { token: token.symbol, amount: formatted, raw: priceRaw, payTo: payTo as `0x${string}` },
    unsignedTx: { chainId: CELO_CHAIN_ID, to: token.address, data, value: '0' },
    retry: {
      header: 'X-PAYMENT',
      note: 'After signing & broadcasting the unsigned tx, retry the original request with an X-PAYMENT header carrying the signed payment payload per the x402 spec.',
    },
  };
}
