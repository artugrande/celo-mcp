'use client';
import { useEffect } from 'react';
import ChatTerminal from './ChatTerminal';

const MCP_URL = 'https://celo-mcp.vercel.app/mcp';
const REPO = 'https://github.com/artugrande/celo-mcp';

const STATS = [
  { num: '8', count: 8, suffix: '', k: 'tools', desc: 'Read balances, build sends & swaps, check agent identity, pay via x402, and more.' },
  { num: '0', count: 0, suffix: '', k: 'keys held', desc: 'Every write returns an unsigned transaction. The user’s wallet signs and broadcasts.' },
  { num: '1s', count: 1, suffix: 's', k: 'finality', desc: 'Celo is an Ethereum L2 with ~1-second blocks and sub-cent fees.' },
  { num: '42220', count: 42220, suffix: '', k: 'chain id', desc: 'Live against Celo mainnet via a public RPC — no API key needed for the tools.' },
  { num: '15+', count: 15, suffix: '+', k: 'tokens', desc: 'CELO, USDC, USDT and the full set of Mento local-currency stablecoins.' },
  { num: 'MIT', count: null, suffix: '', k: 'open source', desc: 'TypeScript, forkable, self-hostable as a local stdio server.' },
];

const TOOLS = [
  { cat: 'read', color: '#56ff9a', name: 'get_balance', desc: 'Native CELO + every stablecoin balance for any address, with correct decimals.' },
  { cat: 'read', color: '#56ff9a', name: 'get_token_info', desc: 'Verified address, decimals and type for any Celo token — no hallucinated addresses.' },
  { cat: 'read', color: '#56ff9a', name: 'resolve_address', desc: 'Validate and checksum any Celo/EVM address before you act on it.' },
  { cat: 'write', color: '#fcff52', name: 'build_send_tx', desc: 'An unsigned CELO or ERC-20 transfer — ready for the user’s wallet to sign.' },
  { cat: 'write', color: '#fcff52', name: 'build_swap_tx', desc: 'A Uniswap v3 quote plus the unsigned approve + swap transactions.' },
  { cat: 'identity', color: '#7fd1ff', name: 'agent_identity', desc: 'ERC-8004 lookup: owner, payment wallet, metadata and on-chain reputation of an AI agent.' },
  { cat: 'payments', color: '#c79bff', name: 'x402_pay', desc: 'Fetch an x402 URL, parse the 402 challenge, build the unsigned stablecoin payment.' },
  { cat: 'meta', color: '#d8d8c8', name: 'list_capabilities', desc: 'A self-describing manifest of every tool, token and the signing model.' },
];

const USE_CASES = [
  { no: '01', title: 'Agent commerce', desc: 'Let an autonomous agent check a counterpart’s ERC-8004 reputation, pay per-call with x402, and settle in stablecoins — all on sub-cent, 1-second rails.' },
  { no: '02', title: 'Wallet copilots', desc: 'Power a chat that reads balances and drafts transfers or swaps. The user’s wallet signs; your server never touches a key.' },
  { no: '03', title: 'On-chain research', desc: 'Give any LLM live, verified Celo data — balances, token metadata, agent identity — instead of stale training data or wrong addresses.' },
  { no: '04', title: 'Embedded checkout', desc: 'Drop pay-per-use APIs behind HTTP 402 and let agents settle in USDC/USDT/USDm without accounts, cards, or 2–7 day settlement.' },
];

const MARQUEE = ['CELO', 'USDC', 'USDT', 'cUSD', 'x402 payments', 'ERC-8004 identity', 'unsigned-tx', 'no key custody', '1s finality', 'chain 42220', 'swaps', 'sends', 'agent identity', 'Mento stablecoins'];

function Marquee() {
  const items = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {MARQUEE.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <span style={{ padding: '0 22px' }}>{t}</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#050505', opacity: 0.5 }} />
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ background: '#fcff52', color: '#050505', overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,.12)', borderBottom: '1px solid rgba(0,0,0,.12)', padding: '16px 0' }}>
      <div className="f-display" style={{ display: 'flex', width: 'max-content', animation: 'marquee 28s linear infinite', fontWeight: 600, fontSize: 17, letterSpacing: '-.01em' }}>
        {items}
        <div aria-hidden style={{ display: 'flex', alignItems: 'center' }}>{items.props.children}</div>
      </div>
    </div>
  );
}

const eyebrow = (color: string): React.CSSProperties => ({ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color });
const h2style: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(34px,4.6vw,54px)', lineHeight: 1.02, letterSpacing: '-.025em', margin: '16px 0 16px' };

export default function Home() {
  useEffect(() => {
    // animated counters
    const t = setTimeout(() => {
      document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const raw = el.getAttribute('data-count');
        const target = parseFloat(raw || '');
        if (raw === '' || raw === null || isNaN(target)) return;
        const suffix = el.getAttribute('data-suffix') || '';
        const label = el.getAttribute('data-label') || raw;
        const dur = 1300;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * e) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = label;
        };
        requestAnimationFrame(tick);
      });
    }, 500);

    // hero spotlight follows cursor
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const spot = document.querySelector<HTMLElement>('[data-spotlight]');
    const onMove = (ev: MouseEvent) => {
      if (!hero || !spot) return;
      const r = hero.getBoundingClientRect();
      if (ev.clientY < r.top || ev.clientY > r.bottom) return;
      spot.style.left = ev.clientX - r.left + 'px';
      spot.style.top = ev.clientY - r.top + 'px';
    };
    document.addEventListener('mousemove', onMove);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousemove', onMove);
    };
  }, []);

  function copy() {
    try { navigator.clipboard?.writeText(MCP_URL); } catch {}
    const el = document.querySelector<HTMLElement>('[data-copy]');
    if (!el) return;
    const old = el.textContent;
    el.textContent = 'copied ✓';
    setTimeout(() => { el.textContent = old; }, 1400);
  }

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 60, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(5,5,5,.66)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="f-display" style={{ width: 26, height: 26, borderRadius: 8, background: '#fcff52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', fontWeight: 700, fontSize: 15, boxShadow: '0 0 22px rgba(252,255,82,.5)' }}>C</span>
            <span className="f-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>CELO<span style={{ color: '#9b9b93', fontWeight: 500 }}>mcp</span></span>
          </a>
          <div className="navlinks" style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: '14.5px', fontWeight: 500 }}>
            <a className="lnk" href="#tools">Tools</a>
            <a className="lnk" href="#use-cases">Use cases</a>
            <a className="lnk" href="#connect">Connect</a>
            <a className="lnk" href={REPO} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <a className="btn-yellow" href="#chat" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fcff52', color: '#050505', padding: '10px 18px', borderRadius: 999, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>Try it live</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="top" data-hero style={{ position: 'relative', padding: '76px 28px 96px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)', backgroundSize: '46px 46px', animation: 'gridDrift 7s linear infinite', WebkitMaskImage: 'radial-gradient(circle at 52% 38%,#000 0%,transparent 72%)', maskImage: 'radial-gradient(circle at 52% 38%,#000 0%,transparent 72%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-12%', right: '-4%', width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle,rgba(252,255,82,.22),transparent 64%)', filter: 'blur(22px)', animation: 'glowPulse 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-18%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(86,255,154,.14),transparent 64%)', filter: 'blur(22px)', animation: 'glowPulse 11s ease-in-out infinite', pointerEvents: 'none' }} />
        <div data-spotlight style={{ position: 'absolute', left: '50%', top: '30%', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle,rgba(252,255,82,.09),transparent 60%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none', transition: 'left .25s ease,top .25s ease', willChange: 'left,top' }} />

        <div className="herogrid" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 52, alignItems: 'center', gridTemplateColumns: '1.02fr 1.05fr' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'rgba(252,255,82,.1)', border: '1px solid rgba(252,255,82,.28)', color: '#fcff52', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.02em', marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#56ff9a', animation: 'ringPulse 1.9s infinite' }} />first write-enabled Celo MCP
            </span>
            <h1 className="f-display" style={{ fontWeight: 700, fontSize: 'clamp(46px,6.4vw,82px)', lineHeight: 0.97, letterSpacing: '-.03em' }}>
              Talk to <span style={{ background: 'linear-gradient(100deg,#fcff52 0%,#56ff9a 45%,#fcff52 90%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent', animation: 'shimmer 5s linear infinite' }}>Celo</span><br />from any LLM.
            </h1>
            <p style={{ fontSize: '17.5px', lineHeight: 1.6, color: '#b9b9b1', maxWidth: '48ch', marginTop: 24 }}>
              An open-source remote <strong style={{ color: '#fbf7ee', fontWeight: 600 }}>MCP server</strong> that gives Claude, GPT, or any agent read + write access to Celo — balances, swaps, sends, ERC-8004 identity and x402 payments. Writes come back as unsigned transactions. <strong style={{ color: '#fbf7ee', fontWeight: 600 }}>The server never holds a key.</strong>
            </p>
            <div style={{ display: 'flex', gap: 13, marginTop: 32, flexWrap: 'wrap' }}>
              <a className="btn-yellow" href="#chat" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fcff52', color: '#050505', padding: '14px 24px', borderRadius: 999, fontWeight: 600, fontSize: 15 }}>Try the live chat</a>
              <a className="btn-outline" href="#connect" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.04)', border: '1.5px solid rgba(255,255,255,.18)', color: '#fbf7ee', padding: '14px 24px', borderRadius: 999, fontWeight: 600, fontSize: 15 }}>Add to Claude / Cursor →</a>
            </div>
            <div className="copybox" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, border: '1px solid rgba(255,255,255,.12)', borderRadius: 13, padding: '14px 18px', background: 'rgba(255,255,255,.03)', fontFamily: 'var(--font-mono)', fontSize: 14, marginTop: 24, maxWidth: 440 }}>
              <span style={{ color: '#fbf7ee' }}>https://celo-mcp.vercel.app<span style={{ color: '#fcff52' }}>/mcp</span></span>
              <span data-copy className="copy-link" onClick={copy} style={{ color: '#9b9b93', fontSize: 12, cursor: 'pointer' }}>copy ⧉</span>
            </div>
          </div>

          <div id="chat">
            <ChatTerminal />
          </div>
        </div>
      </section>

      <Marquee />

      {/* STATS */}
      <section style={{ position: 'relative', padding: '104px 28px', background: '#050505' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <span style={eyebrow('#fcff52')}>What&apos;s inside</span>
          <h2 className="f-display" style={h2style}>One URL. Eight tools.<br />No key custody.</h2>
          <p style={{ fontSize: 17, color: '#9b9b93', maxWidth: '54ch', marginBottom: 48 }}>
            The official <span style={{ fontFamily: 'var(--font-mono)', color: '#fbf7ee' }}>celo-org/celo-mcp</span> is Python, local, and read-only. This is the first TypeScript, remote, write-enabled Celo MCP — add a URL and go.
          </p>
          <div className="grid3" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3,1fr)' }}>
            {STATS.map((s) => (
              <div key={s.k} className="card-stat" style={{ position: 'relative', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 28, background: 'rgba(255,255,255,.018)', overflow: 'hidden' }}>
                <div className="f-display" data-count={s.count === null ? '' : s.count} data-suffix={s.suffix} data-label={s.num} style={{ fontWeight: 700, fontSize: 46, lineHeight: 1, color: '#fcff52', letterSpacing: '-.02em' }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#56ff9a', marginTop: 6, letterSpacing: '.02em' }}>{s.k}</div>
                <div style={{ fontSize: 14, color: '#9b9b93', lineHeight: 1.55, marginTop: 14 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" style={{ position: 'relative', padding: '104px 28px', background: '#fbf7ee', color: '#0b0b08' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <span style={eyebrow('#7a7a5a')}>The toolbox</span>
          <h2 className="f-display" style={h2style}>Everything an agent<br />needs on Celo.</h2>
          <p style={{ fontSize: 17, color: '#5b5b50', maxWidth: '56ch', marginBottom: 48 }}>
            Reads hit Celo mainnet live. Writes return a ready-to-sign <span style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,.06)', padding: '2px 7px', borderRadius: 6, fontSize: 14 }}>{'{ to, data, value }'}</span> — your wallet or agent signs and broadcasts.
          </p>
          <div className="grid2" style={{ display: 'grid', gap: 15, gridTemplateColumns: '1fr 1fr' }}>
            {TOOLS.map((t) => (
              <div key={t.name} className="card-tool" style={{ position: 'relative', border: '1px solid rgba(0,0,0,.12)', borderRadius: 18, padding: 24, background: 'rgba(255,255,255,.5)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.color, opacity: 0.85 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, color: '#050505', background: t.color, padding: '4px 9px', borderRadius: 6 }}>{t.cat}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: '#0b0b08' }}>{t.name}</div>
                <div style={{ fontSize: 14, color: '#5b5b50', marginTop: 9, lineHeight: 1.55 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" style={{ position: 'relative', padding: '104px 28px', background: '#050505', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-6%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(86,255,154,.1),transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={eyebrow('#fcff52')}>Use cases</span>
          <h2 className="f-display" style={{ ...h2style, margin: '16px 0 48px' }}>What you can build on top.</h2>
          <div className="grid2" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            {USE_CASES.map((u) => (
              <div key={u.no} className="card-uc" style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 30, background: 'rgba(255,255,255,.018)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span className="f-display" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(252,255,82,.12)', border: '1px solid rgba(252,255,82,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fcff52', fontSize: 15 }}>{u.no}</span>
                  <div className="f-display" style={{ fontWeight: 600, fontSize: 20, color: '#fbf7ee' }}>{u.title}</div>
                </div>
                <div style={{ fontSize: 15, color: '#9b9b93', lineHeight: 1.6 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECT */}
      <section id="connect" style={{ position: 'relative', padding: '104px 28px', background: '#fcff52', color: '#050505', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,0,0,.05) 1px,transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={eyebrow('#5b5b30')}>Connect</span>
          <h2 className="f-display" style={h2style}>Add it in 10 seconds.</h2>
          <p style={{ fontSize: 17, color: '#3b3b25', marginBottom: 32 }}>Drop the Streamable-HTTP URL into any MCP client. No install, no key.</p>
          <div className="connect-card" style={{ border: '1px solid rgba(0,0,0,.18)', borderRadius: 18, padding: 24, background: 'rgba(0,0,0,.04)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5b5b40', marginBottom: 12 }}>claude desktop · cursor · mcp.json</div>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', lineHeight: 1.75, overflowX: 'auto', color: '#0b0b08', margin: 0 }}>
<span style={{ color: '#5b5b40' }}>{'{'}</span>{'\n  '}<span style={{ color: '#0b0b08' }}>&quot;mcpServers&quot;</span>: <span style={{ color: '#5b5b40' }}>{'{'}</span>{'\n    '}<span style={{ color: '#0b0b08' }}>&quot;celo&quot;</span>: <span style={{ color: '#5b5b40' }}>{'{'}</span> <span style={{ color: '#0b0b08' }}>&quot;url&quot;</span>: <span style={{ color: '#1a7a3a' }}>&quot;{MCP_URL}&quot;</span> <span style={{ color: '#5b5b40' }}>{'}'}</span>{'\n  '}<span style={{ color: '#5b5b40' }}>{'}'}</span>{'\n'}<span style={{ color: '#5b5b40' }}>{'}'}</span>
            </pre>
          </div>
          <div style={{ display: 'flex', gap: 13, marginTop: 28, flexWrap: 'wrap' }}>
            <a className="btn-dark" href="#chat" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#050505', color: '#fcff52', padding: '14px 24px', borderRadius: 999, fontWeight: 600, fontSize: 15 }}>Try the live chat</a>
            <a className="btn-dark-outline" href={REPO} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1.5px solid #050505', color: '#050505', padding: '14px 24px', borderRadius: 999, fontWeight: 600, fontSize: 15 }}>View source on GitHub →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#050505', color: '#9b9b93', padding: '52px 28px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="f-display" style={{ width: 24, height: 24, borderRadius: 7, background: '#fcff52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', fontWeight: 700, fontSize: 14 }}>C</span>
            <span className="f-display" style={{ fontWeight: 700, fontSize: 18, color: '#fbf7ee' }}>CELO<span style={{ color: '#9b9b93', fontWeight: 500 }}>mcp</span></span>
          </a>
          <div style={{ display: 'flex', gap: 26, fontSize: 14 }}>
            <a className="lnk" href="#tools">Tools</a>
            <a className="lnk" href="#use-cases">Use cases</a>
            <a className="lnk" href="#connect">Connect</a>
            <a className="lnk" href={REPO} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: 0.7 }}>MIT · built on Celo</div>
        </div>
      </footer>
    </div>
  );
}
