# Celo MCP

**Read + write access to Celo for any LLM — over a single remote URL.** Balances, sends,
swaps, agent identity + reputation (ERC-8004), and x402 micropayments. Writes return
**unsigned transactions** — the server never holds a key or broadcasts anything.

> The official `celo-org/celo-mcp` is Python, local-stdio, and read-only. This is the first
> **TypeScript, remote (Vercel-hosted), write-enabled** Celo MCP — zero install, add a URL.

## Connect

Add the Streamable-HTTP MCP endpoint to Claude Desktop, Cursor, or any MCP client:

```json
{
  "mcpServers": {
    "celo": { "url": "https://<your-deployment>.vercel.app/mcp" }
  }
}
```

The landing page itself has a **live in-browser chat** (Vercel AI SDK + AI Gateway) wired to the
same tools — try it at the deployment root.

## Tools

| Tool | Does |
|------|------|
| `get_balance` | Native CELO + stablecoin balances for an address |
| `get_token_info` | Verified address, decimals, type for a token symbol/alias |
| `resolve_address` | Validate + checksum a Celo/EVM address |
| `build_send_tx` | **Unsigned** CELO/ERC-20 transfer tx |
| `build_swap_tx` | Uniswap v3 quote + **unsigned** approval & swap txs |
| `agent_identity` | ERC-8004 agent lookup by `agentId`: owner, metadata, wallet, reputation |
| `x402_pay` | Fetch an x402 URL, parse the 402 challenge, build the **unsigned** stablecoin payment |
| `list_capabilities` | Self-describing manifest: chain, tools, tokens, signing model |

### No key custody

Every write tool returns `{ chainId, to, data, value }` for the **user's** wallet/agent to
sign and broadcast. There is no private key anywhere in this server.

## Supported tokens

CELO, USDm (cUSD), EURm (cEUR), BRLm (cREAL), USDC, USDT, and Mento regional stables
(KESm, NGNm, COPm, GHSm, ZARm). All addresses are verified from Celo docs in
[`lib/tokens.ts`](lib/tokens.ts) and [`lib/contracts.ts`](lib/contracts.ts).

## Environment

| Var | Purpose | Default |
|-----|---------|---------|
| `CELO_RPC_URL` | Celo mainnet RPC | `https://forno.celo.org` |
| `AI_GATEWAY_API_KEY` | Powers the `/demo` chat only | — (required for demo) |

No key is needed for the MCP tools themselves — reads use a public RPC, writes are unsigned.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000  (MCP endpoint at /mcp)
```

Inspect the MCP server:

```bash
npx @modelcontextprotocol/inspector
# Streamable HTTP → http://localhost:3000/mcp → List Tools
```

## Tests

```bash
npm run test         # vitest — pure tool functions with a mocked viem client
```

## Deploy

```bash
npx vercel --prod
```

Set `AI_GATEWAY_API_KEY` in the Vercel dashboard (and `CELO_RPC_URL` if not using Forno).
The MCP endpoint is then live at `https://<deployment>.vercel.app/mcp`.

## Architecture / self-host (stdio)

Each tool in [`lib/tools/`](lib/tools/) is a **pure, dependency-injected function** with a zod
input and a typed result — no MCP/HTTP coupling. `app/[transport]/route.ts` wires them into
`mcp-handler`; the `/demo` chat imports the *same* functions as AI SDK tools. To self-host a
local **stdio** server, wrap those functions in an `@modelcontextprotocol/sdk` stdio server —
the tool logic is untouched.

## License

MIT
