import { createPublicClient, http, type PublicClient } from 'viem';
import { celo } from 'viem/chains';

export function makeCeloClient(rpcUrl = process.env.CELO_RPC_URL): PublicClient {
  return createPublicClient({
    chain: celo,
    transport: http(rpcUrl || 'https://forno.celo.org', { timeout: 10_000, retryCount: 1 }),
  }) as PublicClient;
}

export { celo };
