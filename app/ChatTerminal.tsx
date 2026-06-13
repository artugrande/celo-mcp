'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

type DemoMsg = { role: 'sys' | 'user' | 'assistant' | 'tool'; type: 'text' | 'tool'; text?: string; toolName?: string; typing?: boolean };

const SCRIPT: DemoMsg[] = [
  { role: 'sys', type: 'text', text: 'Connected to Celo mainnet via MCP. Ask me anything — I read on-chain and build unsigned transactions.' },
  { role: 'user', type: 'text', text: 'CELO balance of 0x471E…a438?' },
  { role: 'tool', type: 'tool', toolName: 'get_balance' },
  { role: 'assistant', type: 'text', text: '0x471E…a438 holds 12.84 CELO · 1,204.50 USDC · 318.00 USDT.' },
  { role: 'user', type: 'text', text: 'Build a tx to send 5 USDC to 0xceBA…118C' },
  { role: 'tool', type: 'tool', toolName: 'build_send_tx' },
  { role: 'assistant', type: 'text', text: 'Unsigned transfer ready ↓\n{ to: 0x765D…438, data: 0xa9059cbb…, value: 0 }\nHand it to the wallet to sign.' },
];

const ROLE_META: Record<string, { label: string; color: string }> = {
  sys: { label: '›', color: '#56ff9a' },
  user: { label: '› you', color: '#56ff9a' },
  assistant: { label: '⬡ celo', color: '#fcff52' },
};

function Row({ role, text, typing, tool }: { role: string; text?: string; typing?: boolean; tool?: string }) {
  if (tool) {
    return (
      <div style={{ color: '#7fd1ff', fontSize: '11.5px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7fd1ff', boxShadow: '0 0 8px #7fd1ff' }} />
        🔧 called {tool}
      </div>
    );
  }
  const meta = ROLE_META[role] || ROLE_META.assistant;
  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: role === 'sys' ? '#9b9b93' : '#e9e9e3' }}>
      <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span> <span>{text}</span>
      {typing ? <span style={{ color: meta.color, animation: 'blink 1s step-end infinite' }}>▋</span> : null}
    </div>
  );
}

export default function ChatTerminal() {
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [demo, setDemo] = useState<DemoMsg[]>([]);
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const scroll = useCallback(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, []);

  useEffect(() => { scroll(); }, [demo, messages, status, scroll]);

  // ---- typewriter demo (only while idle/demo mode) ----
  useEffect(() => {
    if (mode !== 'demo') return;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    async function run() {
      while (alive && modeRef.current === 'demo') {
        setDemo([]);
        for (let i = 0; i < SCRIPT.length && alive && modeRef.current === 'demo'; i++) {
          const item = SCRIPT[i];
          if (item.type === 'tool') {
            setDemo((d) => [...d, { ...item }]);
            await wait(900);
            continue;
          }
          const full = item.text || '';
          setDemo((d) => [...d, { ...item, text: '', typing: true }]);
          await wait(item.role === 'user' ? 260 : 360);
          for (let n = 1; n <= full.length && alive && modeRef.current === 'demo'; n++) {
            setDemo((d) => {
              const m = d.slice();
              m[m.length - 1] = { ...m[m.length - 1], text: full.slice(0, n), typing: n < full.length };
              return m;
            });
            await wait(14 + Math.random() * 26);
          }
          await wait(750);
        }
        await wait(4200);
      }
    }
    run();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [mode]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || status !== 'ready') return;
    if (mode === 'demo') setMode('live');
    sendMessage({ text: t });
    setInput('');
  }

  return (
    <div>
      <div
        style={{
          position: 'relative',
          borderRadius: 18,
          background: '#0c0c0c',
          border: '1px solid rgba(255,255,255,.1)',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,.7), 0 0 0 1px rgba(252,255,82,.05)',
          overflow: 'hidden',
          height: 482,
          display: 'flex',
          flexDirection: 'column',
          animation: 'floatY 7s ease-in-out infinite',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#fcff52,#56ff9a,transparent)', backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'relative' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
          <span className="f-mono" style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 12, color: '#9b9b93' }}>celo-mcp · live</span>
        </div>

        <div ref={bodyRef} className="f-mono" style={{ flex: 1, overflowY: 'auto', padding: 18, fontSize: '12.5px', lineHeight: 1.65, color: '#e9e9e3', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'demo'
            ? demo.map((m, i) => <Row key={i} role={m.role} text={m.text} typing={m.typing} tool={m.type === 'tool' ? m.toolName : undefined} />)
            : (
              <>
                {messages.map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.parts.map((p, i) => {
                      if (p.type === 'text') return <Row key={i} role={m.role} text={p.text} />;
                      if (p.type.startsWith('tool-') || p.type === 'dynamic-tool') return <Row key={i} role="tool" tool={p.type.replace('tool-', '')} />;
                      return null;
                    })}
                  </div>
                ))}
                {status === 'submitted' && <div style={{ color: '#9b9b93' }}>⬡ celo is thinking…</div>}
                {messages.length === 0 && <div style={{ color: '#9b9b93' }}>Live. Ask me anything about Celo.</div>}
              </>
            )}
        </div>

        <form
          style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
        >
          <input
            className="term-input f-mono"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask celo something…"
            spellCheck={false}
            style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: '12.5px', outline: 'none' }}
          />
          <button className="term-send f-mono" type="submit" disabled={status !== 'ready'} style={{ background: '#fcff52', color: '#000', border: 'none', borderRadius: 10, padding: '0 18px', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '12.5px' }}>
            run
          </button>
        </form>
      </div>
      <p className="f-mono" style={{ fontSize: '11.5px', color: '#7a7a72', marginTop: 14, textAlign: 'center' }}>
        live · powered by Vercel AI SDK + AI Gateway · reads Celo mainnet in real time
      </p>
    </div>
  );
}
