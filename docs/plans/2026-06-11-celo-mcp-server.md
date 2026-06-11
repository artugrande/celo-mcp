# Celo MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a remote, write-enabled Celo MCP server (TypeScript, Vercel) exposing 8 tools to any LLM, plus a live in-browser AI SDK chat demo.

**Architecture:** A single Next.js (App Router) + TypeScript app. Pure, dependency-injected tool functions in `lib/tools/` are wired into a streamable-HTTP MCP endpoint via `mcp-handler` at `app/[transport]/route.ts`. Reads use a `viem` public client against Celo mainnet (42220); writes return unsigned transactions (no key custody). A `/demo` page uses the Vercel AI SDK + AI Gateway, connecting back to the same MCP endpoint.

**Tech Stack:** Next.js 15 (App Router), TypeScript, `viem`, `mcp-handler`, `zod`, `ai` (AI SDK 5/6) + AI Gateway, `vitest`.

**Spec:** `docs/specs/2026-06-11-celo-mcp-server-design.md`

---

## Shared conventions (read before Task 1)

Every pure tool function lives in `lib/tools/<name>.ts`, takes its dependencies as arguments (so tests inject a mock `viem` client), and returns **either** a typed success object **or** a `ToolError`. The route layer serializes whatever comes back to MCP text content. This keeps tools transport-agnostic and unit-testable.

Shared types (defined in Task 1):

```ts
export type ToolError = { error: true; code: string; hint: string };
export type UnsignedTx = {
  chainId: number;
  to: `0x${string}`;
  data: `0x${string}`;
  value: string; // decimal string of wei
};
export function err(code: string, hint: string): ToolError {
  return { error: true, code, hint };
}
```

---

## Task 0: Scaffold project + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx` (placeholder)

- [ ] **Step 1: Scaffold Next.js app (non-interactive) into the existing repo dir**

Run from `~/Desktop/celo-mcp` (the repo + spec already exist here):

```bash
cd ~/Desktop/celo-mcp
npx create-next-app@latest . --ts --app --no-tailwind --no-src-dir --no-eslint --import-alias "@/*" --use-npm --yes
```

If `create-next-app` refuses because the directory is non-empty, scaffold in a temp dir and copy:

```bash
npx create-next-app@latest /tmp/celo-mcp-scaffold --ts --app --no-tailwind --no-src-dir --no-eslint --import-alias "@/*" --use-npm --yes
cp -R /tmp/celo-mcp-scaffold/. ~/Desktop/celo-mcp/
rm -rf /tmp/celo-mcp-scaffold ~/Desktop/celo-mcp/.git/MERGE_MSG 2>/dev/null || true
```

(The repo's existing `.git`, `docs/`, `.gitignore` must be preserved.)

- [ ] **Step 2: Install runtime + dev deps**

```bash
cd ~/Desktop/celo-mcp
npm install viem mcp-handler zod ai @ai-sdk/react
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: Add vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Add test + dev scripts to package.json**

In `package.json` `"scripts"`, ensure these exist:

```json
"test": "vitest run",
"test:watch": "vitest",
"dev": "next dev",
"build": "next build"
```

- [ ] **Step 5: Sanity check the toolchain**

Run: `npm run build`
Expected: Next build completes (default scaffold page compiles).

Run: `npx vitest run`
Expected: "No test files found" (exit 0 or the no-tests message) — confirms vitest is wired.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app + vitest"
```

---

## Task 1: Core lib — viem client, types, verified registries

**Files:**
- Create: `lib/celo.ts`, `lib/types.ts`, `lib/tokens.ts`, `lib/contracts.ts`
- Test: `tests/tokens.test.ts`

- [ ] **Step 1: Write the failing test for the token registry**

Create `tests/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { TOKENS, getToken } from '@/lib/tokens';

describe('token registry', () => {
  it('has USDC with 6 decimals and the verified address', () => {
    const t = getToken('USDC');
    expect(t?.address).toBe('0xcebA9300f2b948710d2653dD7B07f33A8B32118C');
    expect(t?.decimals).toBe(6);
  });

  it('has USDm with 18 decimals', () => {
    expect(getToken('USDm')?.decimals).toBe(18);
  });

  it('is case-insensitive on symbol lookup', () => {
    expect(getToken('usdc')?.symbol).toBe('USDC');
  });

  it('returns undefined for unknown tokens', () => {
    expect(getToken('DOGE')).toBeUndefined();
  });

  it('treats cUSD as an alias for USDm', () => {
    expect(getToken('cUSD')?.symbol).toBe('USDm');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tokens.test.ts`
Expected: FAIL — cannot resolve `@/lib/tokens`.

- [ ] **Step 3: Create `lib/types.ts`**

```ts
export type ToolError = { error: true; code: string; hint: string };

export type UnsignedTx = {
  chainId: number;
  to: `0x${string}`;
  data: `0x${string}`;
  value: string; // decimal string of wei
};

export function err(code: string, hint: string): ToolError {
  return { error: true, code, hint };
}

export function isError(x: unknown): x is ToolError {
  return typeof x === 'object' && x !== null && (x as ToolError).error === true;
}
```

- [ ] **Step 4: Create `lib/tokens.ts` (verified mainnet addresses from spec §5)**

```ts
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
```

- [ ] **Step 5: Create `lib/contracts.ts` (verified protocol addresses from spec §5)**

```ts
export const CELO_CHAIN_ID = 42220;

export const CONTRACTS = {
  uniswapSwapRouter02: '0x5615CDAb10dc425a742d643d949a7F474C01abc4',
  uniswapQuoterV2: '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8',
  erc8004Identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  erc8004Reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
} as const;

// x402 settlement supported tokens (subset of TOKENS, by symbol)
export const X402_TOKENS = ['USDC', 'USDT', 'USDm'] as const;
```

- [ ] **Step 6: Create `lib/celo.ts` (viem public client factory)**

```ts
import { createPublicClient, http, type PublicClient } from 'viem';
import { celo } from 'viem/chains';

export function makeCeloClient(rpcUrl = process.env.CELO_RPC_URL): PublicClient {
  return createPublicClient({
    chain: celo,
    transport: http(rpcUrl || 'https://forno.celo.org', { timeout: 10_000, retryCount: 1 }),
  });
}

export { celo };
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/tokens.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: core lib — viem client, types, verified token + contract registries"
```

---

## Task 2: `resolve_address` tool (input-validation foundation)

**Files:**
- Create: `lib/tools/resolve-address.ts`
- Test: `tests/resolve-address.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/resolve-address.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveAddress } from '@/lib/tools/resolve-address';

describe('resolveAddress', () => {
  it('checksums a valid lowercase address', () => {
    const r = resolveAddress({ nameOrAddress: '0x471ece3750da237f93b8e339c536989b8978a438' });
    expect(r).toEqual({ address: '0x471EcE3750Da237f93B8E339c536989b8978a438' });
  });

  it('returns INVALID_ADDRESS for garbage', () => {
    const r = resolveAddress({ nameOrAddress: 'not-an-address' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });

  it('returns INVALID_ADDRESS for wrong-length hex', () => {
    const r = resolveAddress({ nameOrAddress: '0x1234' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/resolve-address.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `lib/tools/resolve-address.ts`**

```ts
import { isAddress, getAddress } from 'viem';
import { err, type ToolError } from '@/lib/types';

export interface ResolveResult {
  address: `0x${string}`;
}

export function resolveAddress(args: { nameOrAddress: string }): ResolveResult | ToolError {
  const raw = args.nameOrAddress.trim();
  if (!isAddress(raw)) {
    return err('INVALID_ADDRESS', `"${raw}" is not a valid Celo/EVM address (expected 0x + 40 hex chars).`);
  }
  return { address: getAddress(raw) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/resolve-address.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: resolve_address tool"
```

---

## Task 3: `get_token_info` tool

**Files:**
- Create: `lib/tools/get-token-info.ts`
- Test: `tests/get-token-info.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/get-token-info.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getTokenInfo } from '@/lib/tools/get-token-info';

describe('getTokenInfo', () => {
  it('returns full info for a known token', () => {
    expect(getTokenInfo({ token: 'USDC' })).toEqual({
      symbol: 'USDC',
      address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      decimals: 6,
      type: 'bridged',
    });
  });

  it('resolves aliases', () => {
    expect(getTokenInfo({ token: 'cUSD' })).toMatchObject({ symbol: 'USDm' });
  });

  it('returns UNKNOWN_TOKEN otherwise', () => {
    expect(getTokenInfo({ token: 'DOGE' })).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/get-token-info.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/tools/get-token-info.ts`**

```ts
import { getToken } from '@/lib/tokens';
import { err, type ToolError } from '@/lib/types';

export interface TokenInfoResult {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  type: string;
}

export function getTokenInfo(args: { token: string }): TokenInfoResult | ToolError {
  const t = getToken(args.token);
  if (!t) {
    return err('UNKNOWN_TOKEN', `"${args.token}" is not in the verified Celo token registry.`);
  }
  return { symbol: t.symbol, address: t.address, decimals: t.decimals, type: t.type };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/get-token-info.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: get_token_info tool"
```

---

## Task 4: `get_balance` tool

**Files:**
- Create: `lib/tools/get-balance.ts`
- Test: `tests/get-balance.test.ts`

- [ ] **Step 1: Write the failing test (mock viem client)**

Create `tests/get-balance.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { getBalance } from '@/lib/tools/get-balance';

function mockClient(opts: { native?: bigint; erc20?: bigint }) {
  return {
    getBalance: vi.fn().mockResolvedValue(opts.native ?? 0n),
    readContract: vi.fn().mockResolvedValue(opts.erc20 ?? 0n),
  } as any;
}

describe('getBalance', () => {
  it('returns a single token balance formatted by decimals', async () => {
    // 2_500_000 raw / 1e6 = 2.5 USDC
    const client = mockClient({ erc20: 2_500_000n });
    const r = await getBalance(client, {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      token: 'USDC',
    });
    expect(r).toMatchObject({
      balances: [{ symbol: 'USDC', formatted: '2.5', raw: '2500000', decimals: 6 }],
    });
  });

  it('rejects an invalid address', async () => {
    const r = await getBalance(mockClient({}), { address: 'nope' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });

  it('rejects an unknown token', async () => {
    const r = await getBalance(mockClient({}), {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      token: 'DOGE',
    });
    expect(r).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });

  it('maps an RPC failure to RPC_TIMEOUT', async () => {
    const client = { getBalance: vi.fn(), readContract: vi.fn().mockRejectedValue(new Error('boom')) } as any;
    const r = await getBalance(client, {
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      token: 'USDC',
    });
    expect(r).toMatchObject({ error: true, code: 'RPC_TIMEOUT' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/get-balance.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/tools/get-balance.ts`**

```ts
import { type PublicClient, formatUnits, erc20Abi } from 'viem';
import { TOKENS, getToken, type TokenInfo } from '@/lib/tokens';
import { resolveAddress } from '@/lib/tools/resolve-address';
import { err, isError, type ToolError } from '@/lib/types';

export interface BalanceEntry {
  symbol: string;
  formatted: string;
  raw: string;
  decimals: number;
}
export interface BalanceResult {
  address: `0x${string}`;
  balances: BalanceEntry[];
}

async function readOne(client: PublicClient, address: `0x${string}`, t: TokenInfo): Promise<BalanceEntry> {
  const raw =
    t.type === 'native'
      ? await client.getBalance({ address })
      : ((await client.readContract({
          address: t.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        })) as bigint);
  return { symbol: t.symbol, formatted: formatUnits(raw, t.decimals), raw: raw.toString(), decimals: t.decimals };
}

export async function getBalance(
  client: PublicClient,
  args: { address: string; token?: string },
): Promise<BalanceResult | ToolError> {
  const resolved = resolveAddress({ nameOrAddress: args.address });
  if (isError(resolved)) return resolved;

  let list: TokenInfo[];
  if (args.token) {
    const t = getToken(args.token);
    if (!t) return err('UNKNOWN_TOKEN', `"${args.token}" is not in the verified token registry.`);
    list = [t];
  } else {
    list = TOKENS;
  }

  try {
    const balances = await Promise.all(list.map((t) => readOne(client, resolved.address, t)));
    return { address: resolved.address, balances };
  } catch (e) {
    return err('RPC_TIMEOUT', `Celo RPC read failed: ${(e as Error).message}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/get-balance.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: get_balance tool"
```

---

## Task 5: MCP route wiring + read tools live (`app/[transport]/route.ts`)

**Files:**
- Create: `lib/registry.ts`, `app/[transport]/route.ts`

- [ ] **Step 1: Create `lib/registry.ts` (serialization helper)**

```ts
export function toContent(result: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
}
```

- [ ] **Step 2: Create `app/[transport]/route.ts` wiring the three read tools**

```ts
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
```

- [ ] **Step 3: Verify the endpoint compiles and serves**

Run: `npm run build`
Expected: build succeeds, route `/[transport]` listed.

- [ ] **Step 4: Manual smoke test with the MCP inspector**

```bash
npm run dev    # terminal 1
npx @modelcontextprotocol/inspector   # terminal 2
```

In the inspector: select **Streamable HTTP**, URL `http://localhost:3000/mcp`, **Connect** → **List Tools** → run `get_balance` with `{ "address": "0x471EcE3750Da237f93B8E339c536989b8978a438", "token": "CELO" }`.
Expected: a JSON result with a `balances` array.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: MCP route + read tools live over streamable HTTP"
```

---

## Task 6: `build_send_tx` tool (first write — unsigned tx)

**Files:**
- Create: `lib/tools/build-send-tx.ts`
- Test: `tests/build-send-tx.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/build-send-tx.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSendTx } from '@/lib/tools/build-send-tx';
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';

const FROM = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const TO = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';

describe('buildSendTx', () => {
  it('builds an ERC-20 transfer unsigned tx', () => {
    const r = buildSendTx({ from: FROM, to: TO, token: 'USDC', amount: '5' });
    const expectedData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [TO, parseUnits('5', 6)],
    });
    expect(r).toMatchObject({
      unsignedTx: {
        chainId: 42220,
        to: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // the USDC token contract
        data: expectedData,
        value: '0',
      },
    });
  });

  it('builds a native CELO transfer (value set, empty data, to = recipient)', () => {
    const r = buildSendTx({ from: FROM, to: TO, token: 'CELO', amount: '1' });
    expect(r).toMatchObject({
      unsignedTx: { chainId: 42220, to: TO, data: '0x', value: parseUnits('1', 18).toString() },
    });
  });

  it('rejects an unknown token', () => {
    const r = buildSendTx({ from: FROM, to: TO, token: 'DOGE', amount: '1' });
    expect(r).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });

  it('rejects a bad recipient', () => {
    const r = buildSendTx({ from: FROM, to: 'nope', token: 'USDC', amount: '1' });
    expect(r).toMatchObject({ error: true, code: 'INVALID_ADDRESS' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/build-send-tx.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/tools/build-send-tx.ts`**

```ts
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { getToken } from '@/lib/tokens';
import { CELO_CHAIN_ID } from '@/lib/contracts';
import { resolveAddress } from '@/lib/tools/resolve-address';
import { err, isError, type ToolError, type UnsignedTx } from '@/lib/types';

export interface SendResult {
  summary: string;
  unsignedTx: UnsignedTx;
}

export function buildSendTx(args: {
  from: string;
  to: string;
  token: string;
  amount: string;
}): SendResult | ToolError {
  const to = resolveAddress({ nameOrAddress: args.to });
  if (isError(to)) return to;

  const t = getToken(args.token);
  if (!t) return err('UNKNOWN_TOKEN', `"${args.token}" is not in the verified token registry.`);

  let value: bigint;
  try {
    value = parseUnits(args.amount, t.decimals);
  } catch {
    return err('INVALID_AMOUNT', `"${args.amount}" is not a valid decimal amount.`);
  }

  if (t.type === 'native') {
    return {
      summary: `Send ${args.amount} CELO to ${to.address}`,
      unsignedTx: { chainId: CELO_CHAIN_ID, to: to.address, data: '0x', value: value.toString() },
    };
  }

  const data = encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [to.address, value] });
  return {
    summary: `Send ${args.amount} ${t.symbol} to ${to.address}`,
    unsignedTx: { chainId: CELO_CHAIN_ID, to: t.address, data, value: '0' },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/build-send-tx.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Register the tool in `app/[transport]/route.ts`**

Add the import and a `server.tool(...)` block inside `createMcpHandler`:

```ts
// add to imports
import { buildSendTx } from '@/lib/tools/build-send-tx';

// add inside createMcpHandler callback
server.tool(
  'build_send_tx',
  'Build an UNSIGNED transaction to send CELO or a stablecoin. Returns tx for the user to sign — the server never signs.',
  { from: z.string(), to: z.string(), token: z.string(), amount: z.string() },
  async (args) => toContent(buildSendTx(args)),
);
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: build_send_tx tool (unsigned)"
```

---

## Task 7: `build_swap_tx` tool (Uniswap v3 quote + unsigned swap)

**Files:**
- Create: `lib/abi/uniswap.ts`, `lib/tools/build-swap-tx.ts`
- Test: `tests/build-swap-tx.test.ts`

- [ ] **Step 1: Create `lib/abi/uniswap.ts` (minimal QuoterV2 + SwapRouter02 ABIs)**

> Note: `QuoterV2.quoteExactInputSingle` is non-view on-chain, but `eth_call` works regardless of declared mutability. We declare it `view` so viem's `readContract` accepts it — a standard, safe trick for quoter calls.

```ts
export const quoterV2Abi = [
  {
    type: 'function',
    name: 'quoteExactInputSingle',
    stateMutability: 'view',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

export const swapRouter02Abi = [
  {
    type: 'function',
    name: 'exactInputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;
```

- [ ] **Step 2: Write the failing test (mock quoter read)**

Create `tests/build-swap-tx.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { buildSwapTx } from '@/lib/tools/build-swap-tx';

const FROM = '0x471EcE3750Da237f93B8E339c536989b8978a438';

function mockClient(amountOut: bigint) {
  return {
    // quoteExactInputSingle returns a 4-tuple; first element is amountOut
    readContract: vi.fn().mockResolvedValue([amountOut, 0n, 0, 0n]),
  } as any;
}

describe('buildSwapTx', () => {
  it('returns a quote + unsigned swap tx + approval tx', async () => {
    // 1 USDC in (6 dec) -> ~0.99 USDm out (18 dec)
    const client = mockClient(990_000_000_000_000_000n);
    const r = await buildSwapTx(client, {
      from: FROM,
      tokenIn: 'USDC',
      tokenOut: 'USDm',
      amountIn: '1',
      slippage: 0.5,
    });
    expect(r).toMatchObject({
      quote: { amountOut: '0.99' },
      approvalTx: { chainId: 42220, to: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' },
      unsignedTx: { chainId: 42220, to: '0x5615CDAb10dc425a742d643d949a7F474C01abc4', value: '0' },
    });
    // min out must be below the quote (slippage applied)
    expect(Number((r as any).quote.minOut)).toBeLessThan(0.99);
  });

  it('rejects an unknown token', async () => {
    const r = await buildSwapTx(mockClient(1n), { from: FROM, tokenIn: 'DOGE', tokenOut: 'USDC', amountIn: '1' });
    expect(r).toMatchObject({ error: true, code: 'UNKNOWN_TOKEN' });
  });

  it('maps quoter failure to NO_ROUTE', async () => {
    const client = { readContract: vi.fn().mockRejectedValue(new Error('no pool')) } as any;
    const r = await buildSwapTx(client, { from: FROM, tokenIn: 'USDC', tokenOut: 'USDm', amountIn: '1' });
    expect(r).toMatchObject({ error: true, code: 'NO_ROUTE' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/build-swap-tx.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement `lib/tools/build-swap-tx.ts`**

```ts
import { type PublicClient, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { getToken } from '@/lib/tokens';
import { CELO_CHAIN_ID, CONTRACTS } from '@/lib/contracts';
import { quoterV2Abi, swapRouter02Abi } from '@/lib/abi/uniswap';
import { err, type ToolError, type UnsignedTx } from '@/lib/types';

const DEFAULT_FEE = 3000; // 0.3%

export interface SwapResult {
  summary: string;
  quote: { amountOut: string; minOut: string; feeTier: number };
  approvalTx: UnsignedTx;
  unsignedTx: UnsignedTx;
}

export async function buildSwapTx(
  client: PublicClient,
  args: {
    from: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage?: number; // percent, default 0.5
    feeTier?: number;
  },
): Promise<SwapResult | ToolError> {
  const tin = getToken(args.tokenIn);
  const tout = getToken(args.tokenOut);
  if (!tin || !tout) return err('UNKNOWN_TOKEN', `Unknown token in swap pair ${args.tokenIn}/${args.tokenOut}.`);

  let amountIn: bigint;
  try {
    amountIn = parseUnits(args.amountIn, tin.decimals);
  } catch {
    return err('INVALID_AMOUNT', `"${args.amountIn}" is not a valid decimal amount.`);
  }

  const fee = args.feeTier ?? DEFAULT_FEE;
  let amountOut: bigint;
  try {
    const res = (await client.readContract({
      address: CONTRACTS.uniswapQuoterV2 as `0x${string}`,
      abi: quoterV2Abi,
      functionName: 'quoteExactInputSingle',
      args: [{ tokenIn: tin.address, tokenOut: tout.address, amountIn, fee, sqrtPriceLimitX96: 0n }],
    })) as readonly [bigint, bigint, number, bigint];
    amountOut = res[0];
  } catch (e) {
    return err('NO_ROUTE', `No Uniswap v3 route for ${tin.symbol}->${tout.symbol} at fee ${fee}: ${(e as Error).message}`);
  }

  const slippage = args.slippage ?? 0.5;
  const minOut = (amountOut * BigInt(Math.round((100 - slippage) * 100))) / 10_000n;

  const approvalData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [CONTRACTS.uniswapSwapRouter02 as `0x${string}`, amountIn],
  });

  const swapData = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: tin.address,
        tokenOut: tout.address,
        fee,
        recipient: args.from as `0x${string}`,
        amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });

  return {
    summary: `Swap ${args.amountIn} ${tin.symbol} for ~${formatUnits(amountOut, tout.decimals)} ${tout.symbol} (approve first).`,
    quote: { amountOut: formatUnits(amountOut, tout.decimals), minOut: formatUnits(minOut, tout.decimals), feeTier: fee },
    approvalTx: { chainId: CELO_CHAIN_ID, to: tin.address, data: approvalData, value: '0' },
    unsignedTx: { chainId: CELO_CHAIN_ID, to: CONTRACTS.uniswapSwapRouter02 as `0x${string}`, data: swapData, value: '0' },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/build-swap-tx.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Register in `app/[transport]/route.ts`**

```ts
// import
import { buildSwapTx } from '@/lib/tools/build-swap-tx';

// inside createMcpHandler callback
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
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: build_swap_tx tool (Uniswap v3 quote + unsigned approve/swap)"
```

---

## Task 8: `agent_identity` tool (ERC-8004 identity + reputation)

**Files:**
- Create: `lib/abi/erc8004.ts`, `lib/tools/agent-identity.ts`
- Test: `tests/agent-identity.test.ts`

- [ ] **Step 1: Create `lib/abi/erc8004.ts` (minimal fragments)**

```ts
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
```

- [ ] **Step 2: Write the failing test**

Create `tests/agent-identity.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { agentIdentity } from '@/lib/tools/agent-identity';

function mockClient(over: Partial<Record<string, any>> = {}) {
  return {
    readContract: vi.fn().mockImplementation(({ functionName }: any) => {
      const table: Record<string, any> = {
        ownerOf: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        tokenURI: 'ipfs://QmAgentMeta',
        getAgentWallet: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
        getSummary: [3n, 270n, 0],
        ...over,
      };
      if (functionName in table) return Promise.resolve(table[functionName]);
      return Promise.reject(new Error('unexpected'));
    }),
  } as any;
}

describe('agentIdentity', () => {
  it('returns identity + reputation summary for a registered agentId', async () => {
    const r = await agentIdentity(mockClient(), { agentId: '7' });
    expect(r).toMatchObject({
      agentId: '7',
      owner: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      metadataUri: 'ipfs://QmAgentMeta',
      paymentWallet: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      reputation: { feedbackCount: '3', sum: '270' },
    });
  });

  it('returns AGENT_NOT_FOUND when ownerOf reverts', async () => {
    const client = { readContract: vi.fn().mockRejectedValue(new Error('ERC721: invalid token ID')) } as any;
    const r = await agentIdentity(client, { agentId: '999999' });
    expect(r).toMatchObject({ error: true, code: 'AGENT_NOT_FOUND' });
  });

  it('requires agentId or address', async () => {
    const r = await agentIdentity(mockClient(), {} as any);
    expect(r).toMatchObject({ error: true, code: 'INVALID_INPUT' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/agent-identity.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement `lib/tools/agent-identity.ts`**

> Scope note: the MVP looks up an agent **by `agentId`** (the ERC-8004 token id). Reverse lookup by wallet address requires event indexing, which is out of MVP scope — if only an `address` is supplied without `agentId`, return a clear `ADDRESS_LOOKUP_UNSUPPORTED` hint.

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/agent-identity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Register in `app/[transport]/route.ts`**

```ts
// import
import { agentIdentity } from '@/lib/tools/agent-identity';

// inside createMcpHandler callback
server.tool(
  'agent_identity',
  'Look up an ERC-8004 AI-agent on Celo by agentId: owner, metadata URI, payment wallet, and on-chain reputation summary.',
  { agentId: z.string().optional(), address: z.string().optional() },
  async (args) => toContent(await agentIdentity(client, args)),
);
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: agent_identity tool (ERC-8004 identity + reputation)"
```

---

## Task 9: `x402_pay` tool (HTTP 402 flow → unsigned payment)

**Files:**
- Create: `lib/tools/x402-pay.ts`
- Test: `tests/x402-pay.test.ts`

> Design: this tool performs the 402 *discovery* leg (fetch the resource, parse the `402 Payment Required` challenge) and builds the matching Celo-stablecoin **unsigned transfer** to the payee, plus the `X-PAYMENT` retry recipe. It does NOT sign or settle (consistent with the no-key-custody rule).

- [ ] **Step 1: Write the failing test (inject a fetch fn)**

Create `tests/x402-pay.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { x402Pay } from '@/lib/tools/x402-pay';

function challengeResponse(body: any) {
  return new Response(JSON.stringify(body), { status: 402, headers: { 'content-type': 'application/json' } });
}

describe('x402Pay', () => {
  it('parses a 402 challenge and builds an unsigned USDC payment', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      challengeResponse({
        scheme: 'fixed',
        price: '100000', // 0.10 USDC (6 dec)
        currency: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
        chainId: 42220,
        payTo: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      }),
    );
    const r = await x402Pay({ url: 'https://api.example.com/paid', from: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' }, fetchFn);
    expect(r).toMatchObject({
      challenge: { token: 'USDC', amount: '0.1' },
      unsignedTx: { chainId: 42220, to: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', value: '0' },
      retry: { header: 'X-PAYMENT' },
    });
  });

  it('returns X402_NO_CHALLENGE when the resource does not return 402', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    const r = await x402Pay({ url: 'https://api.example.com/free', from: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' }, fetchFn);
    expect(r).toMatchObject({ error: true, code: 'X402_NO_CHALLENGE' });
  });

  it('enforces maxAmount', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      challengeResponse({ price: '5000000', currency: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', chainId: 42220, payTo: '0x471EcE3750Da237f93B8E339c536989b8978a438' }),
    );
    const r = await x402Pay({ url: 'https://x', from: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', maxAmount: '1' }, fetchFn);
    expect(r).toMatchObject({ error: true, code: 'X402_OVER_MAX' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/x402-pay.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/tools/x402-pay.ts`**

```ts
import { encodeFunctionData, erc20Abi, formatUnits } from 'viem';
import { TOKENS } from '@/lib/tokens';
import { CELO_CHAIN_ID } from '@/lib/contracts';
import { err, type ToolError, type UnsignedTx } from '@/lib/types';

type FetchFn = typeof fetch;

export interface X402Result {
  challenge: { token: string; amount: string; raw: string; payTo: `0x${string}` };
  unsignedTx: UnsignedTx;
  retry: { header: string; note: string };
}

function tokenByAddress(addr: string) {
  return TOKENS.find((t) => t.address.toLowerCase() === addr.toLowerCase());
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

  const token = tokenByAddress(currency);
  if (!token) return err('X402_UNSUPPORTED_TOKEN', `Payment currency ${currency} is not a known Celo stablecoin.`);

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/x402-pay.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Register in `app/[transport]/route.ts`**

```ts
// import
import { x402Pay } from '@/lib/tools/x402-pay';

// inside createMcpHandler callback
server.tool(
  'x402_pay',
  'Fetch an x402-protected URL, parse its 402 Payment Required challenge, and build the UNSIGNED Celo-stablecoin payment + retry recipe.',
  { url: z.string(), from: z.string(), maxAmount: z.string().optional() },
  async (args) => toContent(await x402Pay(args)),
);
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: x402_pay tool (402 discovery + unsigned payment)"
```

---

## Task 10: `list_capabilities` tool + register

**Files:**
- Create: `lib/tools/list-capabilities.ts`
- Test: `tests/list-capabilities.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/list-capabilities.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { listCapabilities } from '@/lib/tools/list-capabilities';

describe('listCapabilities', () => {
  it('reports chain, tool names, and supported tokens', () => {
    const r = listCapabilities();
    expect(r.chain).toMatchObject({ name: 'Celo', chainId: 42220 });
    expect(r.tools).toContain('get_balance');
    expect(r.tools).toContain('x402_pay');
    expect(r.tools.length).toBe(8);
    expect(r.tokens).toContain('USDC');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/list-capabilities.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/tools/list-capabilities.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/list-capabilities.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Register in `app/[transport]/route.ts`**

```ts
// import
import { listCapabilities } from '@/lib/tools/list-capabilities';

// inside createMcpHandler callback
server.tool(
  'list_capabilities',
  'Describe this MCP server: chain, available tools, supported tokens, and the signing model.',
  {},
  async () => toContent(listCapabilities()),
);
```

- [ ] **Step 6: Run the full suite + build**

Run: `npx vitest run`
Expected: all tests PASS across all tool test files.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: list_capabilities tool; all 8 tools registered"
```

---

## Task 11: Landing page (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` with a landing page**

```tsx
export default function Home() {
  const tools = [
    ['get_balance', 'CELO + stablecoin balances'],
    ['get_token_info', 'Verified token address/decimals'],
    ['resolve_address', 'Validate & checksum addresses'],
    ['build_send_tx', 'Unsigned transfer tx'],
    ['build_swap_tx', 'Uniswap v3 quote + unsigned swap'],
    ['agent_identity', 'ERC-8004 agent + reputation'],
    ['x402_pay', '402 challenge → unsigned payment'],
    ['list_capabilities', 'Self-describing manifest'],
  ];
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'system-ui' }}>
      <h1>Celo MCP</h1>
      <p>Read + write access to Celo for any LLM. Remote, zero-install. Writes return unsigned transactions — no key custody.</p>
      <h2>Connect</h2>
      <p>Add this Streamable-HTTP MCP URL to Claude Desktop, Cursor, or the AI SDK:</p>
      <pre style={{ background: '#f4f4f5', padding: '1rem', borderRadius: 8, overflowX: 'auto' }}>
{`{
  "mcpServers": {
    "celo": { "url": "https://<your-deployment>.vercel.app/mcp" }
  }
}`}
      </pre>
      <p><a href="/demo">→ Try the live demo chat</a></p>
      <h2>Tools</h2>
      <ul>
        {tools.map(([name, desc]) => (
          <li key={name}><code>{name}</code> — {desc}</li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: landing page shows the connect snippet, demo link, and 8 tools.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: landing page with connect URL + tool list"
```

---

## Task 12: Live demo chat (`/demo`) + AI SDK route

**Files:**
- Create: `app/api/chat/route.ts`, `app/demo/page.tsx`
- Reference: AI SDK MCP client — https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#initializing-an-mcp-client

> The chat route spins up an AI SDK MCP client pointed at our own `/mcp` endpoint, pulls the tools, and lets a Claude model (via AI Gateway) call them. `AI_GATEWAY_API_KEY` must be set in env.

- [ ] **Step 1: Create `app/api/chat/route.ts`**

```ts
import { streamText, experimental_createMCPClient } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const origin = new URL(req.url).origin;
  const mcp = await experimental_createMCPClient({
    transport: { type: 'sse', url: `${origin}/mcp` },
  });

  const tools = await mcp.tools();

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-6',
    system:
      'You are a Celo blockchain assistant. Use the provided MCP tools to read balances and build transactions. Writes return UNSIGNED transactions — always tell the user they must sign and broadcast themselves. Never claim to have sent anything.',
    messages,
    tools,
    onFinish: async () => {
      await mcp.close();
    },
  });

  return result.toDataStreamResponse();
}
```

> If the installed AI SDK version exposes the MCP transport differently (e.g. `StreamableHTTPClientTransport`), check the linked docs and adjust the `transport` block. The `'anthropic/...'` model id is the AI Gateway routing form; confirm the exact id at https://vercel.com/ai-gateway/models. If `toDataStreamResponse` was renamed in AI SDK 6, use the current streaming-response helper from the docs.

- [ ] **Step 2: Create `app/demo/page.tsx`**

```tsx
'use client';
import { useChat } from '@ai-sdk/react';

export default function Demo() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({ api: '/api/chat' });
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'system-ui' }}>
      <h1>Celo MCP — Live Demo</h1>
      <p style={{ color: '#666' }}>Try: “What’s the CELO balance of 0x471EcE3750Da237f93B8E339c536989b8978a438?” or “Build a tx to send 5 USDC to 0xcebA9300f2b948710d2653dD7B07f33A8B32118C”.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '1.5rem 0' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ padding: 12, borderRadius: 8, background: m.role === 'user' ? '#eef' : '#f4f4f5' }}>
            <strong>{m.role}</strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Celo something…"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={status !== 'ready'} style={{ padding: '10px 16px', borderRadius: 8 }}>
          Send
        </button>
      </form>
    </main>
  );
}
```

> `useChat`'s returned fields differ slightly across AI SDK versions (e.g. `status` vs `isLoading`, `messages[].content` vs `messages[].parts`). If the build or types complain, align to the installed `@ai-sdk/react` per its docs — keep the structure, adjust field names.

- [ ] **Step 3: Add `.env.local` (gitignored) for the gateway key**

```bash
echo "AI_GATEWAY_API_KEY=your-key-here" >> .env.local
```

Confirm `.env*` is in `.gitignore` (it is, from the repo's existing ignore). Do NOT commit the key.

- [ ] **Step 4: Manual end-to-end test**

Run: `npm run dev`, open `http://localhost:3000/demo`, ask: *"What's the CELO balance of 0x471EcE3750Da237f93B8E339c536989b8978a438?"*
Expected: the model calls `get_balance` and answers with a number. Then ask it to build a send tx and confirm it returns an unsigned tx and tells you to sign.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts app/demo/page.tsx
git commit -m "feat: live AI SDK chat demo wired to the MCP endpoint"
```

---

## Task 13: README + deploy

**Files:**
- Create/Modify: `README.md`

- [ ] **Step 1: Write `README.md`**

Include: one-liner + positioning (vs the Python read-only `celo-org/celo-mcp`), the connect JSON snippet, the 8-tool table, the unsigned-tx/no-custody guarantee, env vars (`CELO_RPC_URL`, `AI_GATEWAY_API_KEY`), local dev (`npm run dev` + inspector at `/mcp`), test instructions (`npm run test`), and a "fork & self-host (stdio)" note pointing at `lib/tools/` as the reusable core. Pull the tool descriptions from spec §4.

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel        # link + preview deploy
npx vercel --prod # production
```

Set env vars in the Vercel dashboard: `AI_GATEWAY_API_KEY` (and `CELO_RPC_URL` if not using the Forno default).

- [ ] **Step 3: Verify production MCP endpoint**

Point the MCP inspector at `https://<deployment>.vercel.app/mcp`, list tools (expect 8), run `list_capabilities` and `get_balance`.
Expected: tools resolve against live Celo mainnet.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README + deploy"
```

- [ ] **Step 5 (GTM, optional): Celopedia distribution entry**

Open a PR/issue against the Celo skills repo adding this as a public Celo MCP server (ties into the "public MCP servers as distribution" GTM note in the Builder Toolkit). Out of code scope; track separately.

---

## Self-Review (completed during plan authoring)

**Spec coverage:** all 8 tools (§4) → Tasks 2,3,4,6,7,8,9,10; architecture/layout (§3) → Tasks 0,1,5; verified addresses (§5) → Task 1 (`tokens.ts`/`contracts.ts`); demo + AI Gateway (§6) → Task 12; error codes (§6) → each tool returns typed `err(...)`; testing (§6) → vitest per tool with mocked viem; config (§6) → Tasks 1 & 12 env. Self.xyz correctly absent (deferred, spec §9).

**Type consistency:** `ToolError`/`UnsignedTx`/`err`/`isError` defined in Task 1 and used unchanged throughout; `getToken`/`TOKENS` signatures stable; tool function signatures match their `route.ts` registration and their tests; `TOOL_NAMES` length (8) matches the registered tools and the `list_capabilities` test.

**Placeholder scan:** no TBD/TODO; every code step shows complete code. The three "if the installed version differs, check docs" notes in Task 12 are deliberate version-drift guards for fast-moving AI SDK APIs, not missing content — the working code is fully written.
