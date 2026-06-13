export const identityAbi = [
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'tokenURI', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', name: 'getAgentWallet', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },
] as const;

export const reputationAbi = [
  {
    type: 'function',
    name: 'getSummary',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'sum', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
    ],
  },
] as const;
