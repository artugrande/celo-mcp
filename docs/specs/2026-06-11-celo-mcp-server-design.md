# Celo MCP Server — Design Spec

**Date:** 2026-06-11
**Status:** Approved design, pre-implementation
**Repo:** `celo-mcp` (new, public, open-source) — `~/Desktop/celo-mcp`

---

## 1. One-liner & positioning

An open-source **MCP server that gives any LLM read + write access to Celo** over a single
remote URL — balances, sends, swaps, agent identity + reputation (ERC-8004), and x402
micropayments. Writes return **unsigned transactions**; the server never holds a private key.

### Why this is novel (honest positioning)

An official `celo-org/celo-mcp` already exists, but it is **Python, local-stdio, and read-only**
(block/balance/contract queries). Our wedge:

| | `celo-org/celo-mcp` (existing) | **This project** |
|---|---|---|
| Language | Python | **TypeScript** |
| Transport | Local stdio (`uvx`/`pipx` install) | **Remote streamable-HTTP (Vercel) — zero install, add a URL** |
| Writes | None | **Send / swap as unsigned txs** |
| Identity | None | **ERC-8004 (agent identity + reputation)** |
| Payments | None | **x402 pay-per-call** |
| Demo | None | **Live in-browser AI SDK chat** |

Tagline: *"The first TypeScript, remote, write-enabled Celo MCP — talk to Celo from any LLM, no install."*

---

## 2. Goals / non-goals

**Goals**
- One `git push` to Vercel deploys: MCP endpoint + live demo chat + landing/docs page.
- 8 tools, each a pure, independently testable function.
- Trustless writes: tools emit `{ chainId, to, data, value }`; the caller's wallet/agent signs.
- Usable from Claude Desktop, Cursor, the AI SDK, or any MCP client via the same URL.
- Every contract address sourced from verified Celo docs — no hallucinated addresses.

**Non-goals (YAGNI)**
- No stdio/npm packaging (documented "fork & self-host" path only).
- No key custody, no signing, no broadcasting on the server.
- No multi-chain, no tx history/indexing, no auth/rate-limiting beyond Vercel defaults.

---

## 3. Architecture & layout

Single **Next.js (App Router) + TypeScript** project on Vercel. Three surfaces, one deploy:

```
celo-mcp/
├── app/
│   ├── [transport]/route.ts      # MCP server (streamable-HTTP via mcp-handler)
│   ├── page.tsx                  # Landing: connect URL + tool docs
│   └── demo/page.tsx             # Live AI SDK chat → talks to our own MCP endpoint
├── lib/
│   ├── celo.ts                   # viem public client, Celo mainnet chain config (42220)
│   ├── tokens.ts                 # verified token registry (addresses + decimals)
│   ├── contracts.ts              # verified protocol addresses (Uniswap, Aave, ERC-8004)
│   ├── tools/                    # one file per tool — pure, transport-agnostic
│   │   ├── get-balance.ts
│   │   ├── get-token-info.ts
│   │   ├── resolve-address.ts
│   │   ├── build-send-tx.ts
│   │   ├── build-swap-tx.ts
│   │   ├── agent-identity.ts
│   │   ├── x402-pay.ts
│   │   └── list-capabilities.ts
│   └── registry.ts               # assembles tools + zod schemas for the route
├── tests/                        # vitest unit tests per tool (mocked RPC)
└── README.md
```

**Key principle:** each `lib/tools/*` export is a plain async function with a **zod** input
schema and a typed result — no MCP/HTTP coupling. `route.ts` wires them into `mcp-handler`;
the demo's AI SDK MCP client and the unit tests call the *same* functions. A unit can be
understood and tested without reading the transport layer, and a self-hoster could wrap the
same functions in a stdio server untouched.

**Read path:** `viem` public client → Celo RPC (`CELO_RPC_URL`, default `https://forno.celo.org`).
**Write path:** tools build calldata and return an unsigned tx object — never a key, never a broadcast.

---

## 4. Tool catalog (8 tools)

All reads hit Celo mainnet (chainId 42220). All writes return an unsigned tx + a decoded
human summary.

### Reads
1. **`get_balance`** — `{ address, token? }` → native CELO + stablecoin balances. No `token`
   = all known tokens; with `token` = just that one. Returns human-readable + raw, with
   correct decimals (USDm=18, USDC/USDT=6).
2. **`get_token_info`** — `{ token }` → symbol, decimals, verified address, type
   (Mento vs bridged). Backed by the curated registry so the LLM never invents an address.
3. **`resolve_address`** — `{ nameOrAddress }` → checksummed address + format validation
   (and reverse name if available). Guards every other tool from malformed input.

### Writes (return unsigned tx)
4. **`build_send_tx`** — `{ from, to, token, amount }` → unsigned ERC-20 `transfer` (or native
   CELO) tx + summary ("Send 5 USDC to 0x…").
5. **`build_swap_tx`** — `{ from, tokenIn, tokenOut, amountIn, slippage? }` → quote (via
   Uniswap v3 `QuoterV2`) + unsigned swap tx (via `SwapRouter02`). Returns expected out + min out.

### Differentiators
6. **`agent_identity`** — `{ address | agentId }` → **ERC-8004** lookup on Celo mainnet:
   is this a registered AI agent (Identity registry), who owns it, its payment wallet,
   metadata, and **reputation summary** (Reputation registry). Fully addressed and deployed.
7. **`x402_pay`** — `{ url, maxAmount? }` → runs the HTTP 402 flow: fetch the resource, parse
   the `402 Payment Required` challenge, and build the Celo-stablecoin payment (unsigned tx +
   the `X-PAYMENT` header recipe) so an agent can pay-per-call.

### Meta
8. **`list_capabilities`** — `{}` → self-describing manifest: all tools, supported tokens,
   chain info. Great demo opener and lets any LLM discover what it can do.

---

## 5. Verified addresses (Celo mainnet, chainId 42220)

> Source: Celo docs via `celo-copilot` skill. **Do not edit without re-verifying.**

**Tokens**
| Symbol | Address | Decimals |
|---|---|---|
| CELO | `0x471EcE3750Da237f93B8E339c536989b8978a438` | 18 |
| USDm (cUSD) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 |
| EURm (cEUR) | `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73` | 18 |
| BRLm (cREAL) | `0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787` | 18 |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` | 6 |

(Additional Mento regional stables — KESm, NGNm, COPm, GHSm, ZARm, etc. — included in
`tokens.ts` from the verified list; all 18 decimals.)

**Protocols**
| Contract | Address |
|---|---|
| Uniswap v3 SwapRouter02 | `0x5615CDAb10dc425a742d643d949a7F474C01abc4` |
| Uniswap v3 QuoterV2 | `0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8` |
| ERC-8004 Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

**x402 supported tokens:** USDC, USDT, USDm (addresses above). Facilitator pattern via
`thirdweb/x402` (`settlePayment` / `wrapFetchWithPayment`).

---

## 6. Demo, data flow, errors, config, testing

**Demo (`/demo`)** — Vercel AI SDK chat page (`useChat` + a Claude model via AI Gateway)
wired to our own MCP endpoint through the AI SDK's MCP client. Judges type
*"What's the USDm balance of 0x…?"* or *"Build a tx to send 5 USDC to 0x…"* and watch tool
calls resolve live. Landing page carries a "Connect to Claude Desktop / Cursor" snippet for
the same URL.

**Data flow:** LLM → MCP endpoint (`/mcp`) → `registry` dispatches to `lib/tools/*` →
viem read **or** unsigned-tx build → typed JSON. Writes stop at the unsigned tx; the user's
wallet/agent signs and broadcasts.

**Error handling:** every tool returns a typed `{ error, code, hint }` on failure
(`INVALID_ADDRESS`, `UNKNOWN_TOKEN`, `RPC_TIMEOUT`, `AGENT_NOT_FOUND`,
`X402_NO_CHALLENGE`) so the LLM gets actionable text, not a stack trace. RPC calls get a
timeout + one retry. All address/token inputs validated by zod **before** any network call.

**Config (env):**
- `CELO_RPC_URL` — default `https://forno.celo.org`
- `AI_GATEWAY_API_KEY` — for the demo chat only
- `THIRDWEB_SECRET_KEY` — optional, only if x402 settlement helper is exercised in the demo
- No private keys anywhere in the server.

**Testing:** `vitest` unit tests per tool with a **mocked viem client** — assert
address/decimals math, unsigned-tx shape (`to`/`data`/`value`/`chainId`), and error codes.
One integration test hits a live `get_balance` read on a known address behind a flag. No
signing tests (we never sign).

---

## 7. Build order (for the implementation plan)

1. Scaffold Next.js + TS, `lib/celo.ts`, `lib/tokens.ts`, `lib/contracts.ts` (verified addresses).
2. Read tools (`get_balance`, `get_token_info`, `resolve_address`) + unit tests.
3. `route.ts` with `mcp-handler` exposing read tools; verify via MCP client.
4. Write tools (`build_send_tx`, `build_swap_tx`) + unit tests.
5. Differentiators (`agent_identity` — ERC-8004 reads; then `x402_pay`).
6. `list_capabilities` + landing page.
7. `/demo` AI SDK chat wired to the MCP endpoint.
8. README (connect URL, tool docs, self-host note) + deploy to Vercel.
9. Submit to Celopedia as a public-MCP distribution entry (GTM).

---

## 8. Open items to confirm at build time
- ERC-8004 ABI fragments for `getMetadata` / `getSummary` / `getAgentWallet` (have function list).
- Uniswap v3 fee tier selection for `build_swap_tx` quotes (default 0.05%/0.3%, pick per pair).

## 9. Deferred (post-MVP)
- **Self.xyz human verification** (`self_verify_check`) — dropped from MVP because Self is
  scoped per-app with no global registry, so a generic lookup is best-effort. Revisit if a
  concrete scope/use-case appears.
