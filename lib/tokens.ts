export type TokenType = 'native' | 'mento' | 'bridged';

export interface TokenInfo {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  type: TokenType;
  aliases?: string[];
}

export const TOKENS: TokenInfo[] = [
  { symbol: 'CELO', address: '0x471EcE3750Da237f93B8E339c536989b8978a438', decimals: 18, type: 'native' },
  { symbol: 'USDm', address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', decimals: 18, type: 'mento', aliases: ['cUSD'] },
  { symbol: 'EURm', address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', decimals: 18, type: 'mento', aliases: ['cEUR'] },
  { symbol: 'BRLm', address: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787', decimals: 18, type: 'mento', aliases: ['cREAL'] },
  { symbol: 'USDC', address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', decimals: 6, type: 'bridged' },
  { symbol: 'USDT', address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', decimals: 6, type: 'bridged' },
  { symbol: 'KESm', address: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0', decimals: 18, type: 'mento' },
  { symbol: 'NGNm', address: '0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71', decimals: 18, type: 'mento' },
  { symbol: 'COPm', address: '0x8A567e2aE79CA692Bd748aB832081C45de4041eA', decimals: 18, type: 'mento' },
  { symbol: 'GHSm', address: '0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313', decimals: 18, type: 'mento' },
  { symbol: 'ZARm', address: '0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6', decimals: 18, type: 'mento' },
];

export function getToken(symbolOrAlias: string): TokenInfo | undefined {
  const q = symbolOrAlias.trim().toLowerCase();
  return TOKENS.find(
    (t) =>
      t.symbol.toLowerCase() === q ||
      (t.aliases ?? []).some((a) => a.toLowerCase() === q),
  );
}
