import ChatTerminal from './ChatTerminal';

const TOOLS = [
  ['read', 'get_balance', 'Native CELO + every stablecoin balance for any address, with correct decimals.'],
  ['read', 'get_token_info', 'Verified address, decimals and type for any Celo token — no hallucinated addresses.'],
  ['read', 'resolve_address', 'Validate and checksum any Celo/EVM address before you act on it.'],
  ['write', 'build_send_tx', 'An unsigned CELO or ERC-20 transfer — ready for the user’s wallet to sign.'],
  ['write', 'build_swap_tx', 'A Uniswap v3 quote plus the unsigned approve + swap transactions.'],
  ['identity', 'agent_identity', 'ERC-8004 lookup: owner, payment wallet, metadata and on-chain reputation of an AI agent.'],
  ['payments', 'x402_pay', 'Fetch an x402 URL, parse the 402 challenge, build the unsigned stablecoin payment.'],
  ['meta', 'list_capabilities', 'A self-describing manifest of every tool, token and the signing model.'],
];

const USE_CASES = [
  ['Agent commerce', 'Let an autonomous agent check a counterpart’s ERC-8004 reputation, pay per-call with x402, and settle in stablecoins — all on sub-cent, 1-second rails.'],
  ['Wallet copilots', 'Power a chat that reads balances and drafts transfers or swaps. The user’s wallet signs; your server never touches a key.'],
  ['On-chain research', 'Give any LLM live, verified Celo data — balances, token metadata, agent identity — instead of stale training data or wrong addresses.'],
  ['Embedded checkout', 'Drop pay-per-use APIs behind HTTP 402 and let agents settle in USDC/USDT/USDm without accounts, cards, or 2–7 day settlement.'],
];

const STATS = [
  ['8', 'tools', 'Read balances, build sends & swaps, check agent identity, pay via x402, and more.'],
  ['0', 'keys held', 'Every write returns an unsigned transaction. The user’s wallet signs and broadcasts.'],
  ['1s', 'finality', 'Celo is an Ethereum L2 with ~1-second blocks and sub-cent fees.'],
  ['42220', 'chain id', 'Live against Celo mainnet via a public RPC — no API key needed for the tools.'],
  ['15+', 'tokens', 'CELO, USDC, USDT and the full set of Mento local-currency stablecoins.'],
  ['MIT', 'open source', 'TypeScript, forkable, self-hostable as a local stdio server.'],
];

const MCP_URL = 'https://celo-mcp.vercel.app/mcp';
const REPO = 'https://github.com/artugrande/celo-mcp';

export default function Home() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="wrap nav__inner">
          <div className="logo">
            CELO<span>mcp</span>
          </div>
          <div className="nav__links hide-mobile">
            <a href="#tools">Tools</a>
            <a href="#use-cases">Use cases</a>
            <a href="#connect">Connect</a>
            <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <a className="btn btn--solid" href="#chat">Try it live</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="section section--yellow" style={{ paddingTop: 72, paddingBottom: 88 }}>
        <div className="wrap hero-grid">
          <div>
            <span className="badge" style={{ marginBottom: 22 }}>
              <span className="dot-live" /> first write-enabled Celo MCP
            </span>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 76px)' }}>
              Talk to Celo<br />from any LLM.
            </h1>
            <p className="lede" style={{ marginTop: 24 }}>
              An open-source remote MCP server that gives Claude, GPT, or any agent read + write
              access to Celo — balances, swaps, sends, ERC-8004 agent identity and x402 payments.
              Writes come back as unsigned transactions. The server never holds a key.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
              <a className="btn btn--solid" href="#chat">Try the live chat</a>
              <a className="btn btn--outline" href="#connect">Add to Claude / Cursor →</a>
            </div>
            <div className="code-box" style={{ marginTop: 22, maxWidth: 460 }}>
              <span>{MCP_URL}</span>
              <span style={{ opacity: 0.5 }}>/mcp</span>
            </div>
          </div>

          <div id="chat">
            <ChatTerminal />
            <p className="mono" style={{ fontSize: 12, opacity: 0.55, marginTop: 12, textAlign: 'center' }}>
              live · powered by Vercel AI SDK + AI Gateway · reads Celo mainnet in real time
            </p>
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE / STATS */}
      <section className="section section--dark" id="how">
        <div className="wrap">
          <span className="eyebrow">What’s inside</span>
          <h2 className="display" style={{ fontSize: 'clamp(34px, 4.5vw, 52px)', margin: '14px 0 16px' }}>
            One URL. Eight tools.<br />No key custody.
          </h2>
          <p className="lede" style={{ color: 'var(--celo-gray-on-dark)', marginBottom: 44 }}>
            The official <span className="mono">celo-org/celo-mcp</span> is Python, local, and read-only.
            This is the first TypeScript, remote, write-enabled Celo MCP — add a URL and go.
          </p>
          <div className="grid grid--3">
            {STATS.map(([num, k, desc]) => (
              <div className="card" key={k}>
                <div className="card__num">{num}</div>
                <div className="card__k">{k}</div>
                <div className="card__desc" style={{ marginTop: 12 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="section section--yellow" id="tools">
        <div className="wrap">
          <span className="eyebrow">The toolbox</span>
          <h2 className="display" style={{ fontSize: 'clamp(34px, 4.5vw, 52px)', margin: '14px 0 16px' }}>
            Everything an agent<br />needs on Celo.
          </h2>
          <p className="lede" style={{ marginBottom: 44 }}>
            Reads hit Celo mainnet live. Writes return a ready-to-sign{' '}
            <span className="mono">{'{ to, data, value }'}</span> — your wallet or agent signs and broadcasts.
          </p>
          <div className="grid grid--2">
            {TOOLS.map(([tag, name, desc]) => (
              <div className="lcard" key={name}>
                <div className="lcard__tag">{tag}</div>
                <div className="lcard__name">{name}</div>
                <div className="lcard__desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="section section--dark" id="use-cases">
        <div className="wrap">
          <span className="eyebrow">Use cases</span>
          <h2 className="display" style={{ fontSize: 'clamp(34px, 4.5vw, 52px)', margin: '14px 0 44px' }}>
            What you can build on top.
          </h2>
          <div className="grid grid--2">
            {USE_CASES.map(([title, desc]) => (
              <div className="card" key={title}>
                <div className="card__title" style={{ fontSize: 19 }}>{title}</div>
                <div className="card__desc" style={{ fontSize: 15 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECT */}
      <section className="section section--yellow" id="connect">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Connect</span>
          <h2 className="display" style={{ fontSize: 'clamp(34px, 4.5vw, 52px)', margin: '14px 0 16px' }}>
            Add it in 10 seconds.
          </h2>
          <p className="lede" style={{ marginBottom: 32 }}>
            Drop the Streamable-HTTP URL into any MCP client. No install, no key.
          </p>
          <div className="lcard" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <div className="lcard__tag">claude desktop · cursor · mcp.json</div>
            <pre className="mono" style={{ fontSize: 13, lineHeight: 1.7, overflowX: 'auto', marginTop: 6 }}>
{`{
  "mcpServers": {
    "celo": { "url": "${MCP_URL}" }
  }
}`}
            </pre>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <a className="btn btn--solid" href="#chat">Try the live chat</a>
            <a className="btn btn--outline" href={REPO} target="_blank" rel="noreferrer">View source on GitHub →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="logo" style={{ color: 'var(--celo-cream)' }}>
            CELO<span>mcp</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#tools">Tools</a>
            <a href="#use-cases">Use cases</a>
            <a href="#connect">Connect</a>
            <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div style={{ opacity: 0.6 }}>MIT · built on Celo</div>
        </div>
      </footer>
    </>
  );
}
