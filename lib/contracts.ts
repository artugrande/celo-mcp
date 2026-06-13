export const CELO_CHAIN_ID = 42220;

export const CONTRACTS = {
  uniswapSwapRouter02: '0x5615CDAb10dc425a742d643d949a7F474C01abc4',
  uniswapQuoterV2: '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8',
  erc8004Identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  erc8004Reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
} as const;

// x402 settlement supported tokens (subset of TOKENS, by symbol)
export const X402_TOKENS = ['USDC', 'USDT', 'USDm'] as const;
