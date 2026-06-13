'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const SUGGESTIONS = [
  'CELO balance of 0x471EcE3750Da237f93B8E339c536989b8978a438?',
  'Build a tx to send 5 USDC to 0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  'What can you do?',
];

export default function ChatTerminal() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || status !== 'ready') return;
    sendMessage({ text: t });
    setInput('');
  }

  return (
    <div className="term">
      <div className="term__bar">
        <span className="term__dot" style={{ background: '#ff5f57' }} />
        <span className="term__dot" style={{ background: '#febc2e' }} />
        <span className="term__dot" style={{ background: '#28c840' }} />
        <span className="term__title">celo-mcp · live</span>
      </div>

      <div className="term__body" ref={bodyRef}>
        {messages.length === 0 && (
          <div style={{ color: '#9b9b93' }}>
            <div style={{ marginBottom: 10 }}>
              <span className="term__role">›</span> Connected to Celo mainnet via MCP. Ask me anything —
              I read on-chain and build unsigned transactions.
            </div>
            <div>
              {SUGGESTIONS.map((s) => (
                <span key={s} className="term__chip" onClick={() => send(s)}>
                  {s.length > 46 ? s.slice(0, 46) + '…' : s}
                </span>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="term__row">
            <span className={`term__role ${m.role === 'assistant' ? 'term__role--assistant' : ''}`}>
              {m.role === 'user' ? '› you' : '⬡ celo'}
            </span>
            {m.parts.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <div key={i} style={{ marginTop: 2 }}>
                    {part.text}
                  </div>
                );
              }
              if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                const name = part.type.replace('tool-', '');
                return (
                  <div key={i} className="term__tool" style={{ marginTop: 4 }}>
                    🔧 called {name}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        {status === 'submitted' && <div style={{ color: '#9b9b93' }}>⬡ celo is thinking…</div>}
      </div>

      <form
        className="term__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="term__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask celo something…"
          spellCheck={false}
        />
        <button className="term__send" type="submit" disabled={status !== 'ready'}>
          run
        </button>
      </form>
    </div>
  );
}
