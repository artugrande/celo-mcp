import { TOKENS } from '@/lib/tokens';
import { CELO_CHAIN_ID } from '@/lib/contracts';

export const TOOL_NAMES = [
  'get_balance',
  'get_token_info',
  'resolve_address',
  'build_send_tx',
  'build_swap_tx',
  'agent_identity',
  'x402_pay',
  'list_capabilities',
] as const;

export interface CapabilitiesResult {
  chain: { name: string; chainId: number; rpcDefault: string };
  tools: string[];
  tokens: string[];
  signing: string;
}

export function listCapabilities(): CapabilitiesResult {
  return {
    chain: { name: 'Celo', chainId: CELO_CHAIN_ID, rpcDefault: 'https://forno.celo.org' },
    tools: [...TOOL_NAMES],
    tokens: TOKENS.map((t) => t.symbol),
    signing: 'Writes return UNSIGNED transactions. The server never holds keys or broadcasts.',
  };
}
