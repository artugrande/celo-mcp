import { type PublicClient } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import { identityAbi, reputationAbi } from '@/lib/abi/erc8004';
import { err, type ToolError } from '@/lib/types';

export interface AgentIdentityResult {
  agentId: string;
  owner: `0x${string}`;
  metadataUri: string;
  paymentWallet: `0x${string}`;
  reputation: { feedbackCount: string; sum: string; valueDecimals: number };
}

export async function agentIdentity(
  client: PublicClient,
  args: { agentId?: string; address?: string },
): Promise<AgentIdentityResult | ToolError> {
  if (!args.agentId) {
    if (args.address) {
      return err('ADDRESS_LOOKUP_UNSUPPORTED', 'Reverse lookup by wallet is out of MVP scope. Pass the ERC-8004 agentId (token id).');
    }
    return err('INVALID_INPUT', 'Provide an ERC-8004 agentId (token id).');
  }

  let id: bigint;
  try {
    id = BigInt(args.agentId);
  } catch {
    return err('INVALID_INPUT', `"${args.agentId}" is not a valid integer agentId.`);
  }

  const identity = CONTRACTS.erc8004Identity as `0x${string}`;
  const reputation = CONTRACTS.erc8004Reputation as `0x${string}`;

  try {
    const [owner, metadataUri, paymentWallet] = await Promise.all([
      client.readContract({ address: identity, abi: identityAbi, functionName: 'ownerOf', args: [id] }) as Promise<`0x${string}`>,
      client.readContract({ address: identity, abi: identityAbi, functionName: 'tokenURI', args: [id] }) as Promise<string>,
      client.readContract({ address: identity, abi: identityAbi, functionName: 'getAgentWallet', args: [id] }) as Promise<`0x${string}`>,
    ]);

    let reputationSummary = { feedbackCount: '0', sum: '0', valueDecimals: 0 };
    try {
      const [count, sum, dec] = (await client.readContract({
        address: reputation,
        abi: reputationAbi,
        functionName: 'getSummary',
        args: [id, []],
      })) as readonly [bigint, bigint, number];
      reputationSummary = { feedbackCount: count.toString(), sum: sum.toString(), valueDecimals: dec };
    } catch {
      // reputation read is best-effort; identity still returns
    }

    return { agentId: args.agentId, owner, metadataUri, paymentWallet, reputation: reputationSummary };
  } catch (e) {
    return err('AGENT_NOT_FOUND', `No ERC-8004 agent with id ${args.agentId} on Celo: ${(e as Error).message}`);
  }
}
