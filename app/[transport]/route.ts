import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { makeCeloClient } from '@/lib/celo';
import { toContent } from '@/lib/registry';
import { getBalance } from '@/lib/tools/get-balance';
import { getTokenInfo } from '@/lib/tools/get-token-info';
import { resolveAddress } from '@/lib/tools/resolve-address';

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
});

export { handler as GET, handler as POST, handler as DELETE };
