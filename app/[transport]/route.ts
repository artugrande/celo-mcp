import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { makeCeloClient } from '@/lib/celo';
import { toContent } from '@/lib/registry';
import { getBalance } from '@/lib/tools/get-balance';
import { getTokenInfo } from '@/lib/tools/get-token-info';
import { resolveAddress } from '@/lib/tools/resolve-address';
import { buildSendTx } from '@/lib/tools/build-send-tx';
import { buildSwapTx } from '@/lib/tools/build-swap-tx';

export const maxDuration = 60;

const client = makeCeloClient();

const handler = createMcpHandler((server) => {
  server.tool(
    'get_balance',
    'Get native CELO and stablecoin balances for a Celo address. Omit token for all known tokens.',
    { address: z.string(), token: z.string().optional() },
    async (args) => toContent(await getBalance(client, args)),
  );

  server.tool(
    'get_token_info',
    'Look up the verified address, decimals, and type of a Celo token by symbol or alias.',
    { token: z.string() },
    async (args) => toContent(getTokenInfo(args)),
  );

  server.tool(
    'resolve_address',
    'Validate and checksum a Celo/EVM address.',
    { nameOrAddress: z.string() },
    async (args) => toContent(resolveAddress(args)),
  );

  server.tool(
    'build_send_tx',
    'Build an UNSIGNED transaction to send CELO or a stablecoin. Returns tx for the user to sign — the server never signs.',
    { from: z.string(), to: z.string(), token: z.string(), amount: z.string() },
    async (args) => toContent(buildSendTx(args)),
  );

  server.tool(
    'build_swap_tx',
    'Quote a Uniswap v3 swap on Celo and build the UNSIGNED approval + swap transactions. Server never signs.',
    {
      from: z.string(),
      tokenIn: z.string(),
      tokenOut: z.string(),
      amountIn: z.string(),
      slippage: z.number().optional(),
      feeTier: z.number().optional(),
    },
    async (args) => toContent(await buildSwapTx(client, args)),
  );
});

export { handler as GET, handler as POST, handler as DELETE };
