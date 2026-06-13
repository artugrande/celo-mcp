import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from 'ai';
import { z } from 'zod';
import { makeCeloClient } from '@/lib/celo';
import { getBalance } from '@/lib/tools/get-balance';
import { getTokenInfo } from '@/lib/tools/get-token-info';
import { resolveAddress } from '@/lib/tools/resolve-address';
import { buildSendTx } from '@/lib/tools/build-send-tx';
import { buildSwapTx } from '@/lib/tools/build-swap-tx';
import { agentIdentity } from '@/lib/tools/agent-identity';
import { x402Pay } from '@/lib/tools/x402-pay';
import { listCapabilities } from '@/lib/tools/list-capabilities';

export const maxDuration = 60;

const client = makeCeloClient();

// AI Gateway model slug — routed via AI_GATEWAY_API_KEY.
// Verify / swap the exact slug at https://vercel.com/ai-gateway/models
const MODEL = 'anthropic/claude-sonnet-4-6';

// The demo reuses the SAME pure tool functions the MCP endpoint exposes.
const tools = {
  get_balance: tool({
    description: 'Get native CELO and stablecoin balances for a Celo address. Omit token for all known tokens.',
    inputSchema: z.object({ address: z.string(), token: z.string().optional() }),
    execute: async (args) => getBalance(client, args),
  }),
  get_token_info: tool({
    description: 'Look up the verified address, decimals, and type of a Celo token by symbol or alias.',
    inputSchema: z.object({ token: z.string() }),
    execute: async (args) => getTokenInfo(args),
  }),
  resolve_address: tool({
    description: 'Validate and checksum a Celo/EVM address.',
    inputSchema: z.object({ nameOrAddress: z.string() }),
    execute: async (args) => resolveAddress(args),
  }),
  build_send_tx: tool({
    description: 'Build an UNSIGNED transaction to send CELO or a stablecoin. Returns tx for the user to sign.',
    inputSchema: z.object({ from: z.string(), to: z.string(), token: z.string(), amount: z.string() }),
    execute: async (args) => buildSendTx(args),
  }),
  build_swap_tx: tool({
    description: 'Quote a Uniswap v3 swap on Celo and build UNSIGNED approval + swap transactions.',
    inputSchema: z.object({
      from: z.string(),
      tokenIn: z.string(),
      tokenOut: z.string(),
      amountIn: z.string(),
      slippage: z.number().optional(),
      feeTier: z.number().optional(),
    }),
    execute: async (args) => buildSwapTx(client, args),
  }),
  agent_identity: tool({
    description: 'Look up an ERC-8004 AI-agent on Celo by agentId: owner, metadata, payment wallet, reputation.',
    inputSchema: z.object({ agentId: z.string().optional(), address: z.string().optional() }),
    execute: async (args) => agentIdentity(client, args),
  }),
  x402_pay: tool({
    description: 'Fetch an x402-protected URL, parse its 402 challenge, and build the UNSIGNED Celo-stablecoin payment.',
    inputSchema: z.object({ url: z.string(), from: z.string(), maxAmount: z.string().optional() }),
    execute: async (args) => x402Pay(args),
  }),
  list_capabilities: tool({
    description: 'Describe this server: chain, tools, supported tokens, and signing model.',
    inputSchema: z.object({}),
    execute: async () => listCapabilities(),
  }),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: MODEL,
    system:
      'You are a Celo blockchain assistant. Use the provided tools to read balances and build transactions. ' +
      'Writes return UNSIGNED transactions — always tell the user they must sign and broadcast themselves. ' +
      'Never claim to have sent anything or moved funds.',
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
