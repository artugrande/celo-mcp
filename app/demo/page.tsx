'use client';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function Demo() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status !== 'ready') return;
    sendMessage({ text });
    setInput('');
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'system-ui' }}>
      <h1>Celo MCP — Live Demo</h1>
      <p style={{ color: '#666' }}>
        Try: “What’s the CELO balance of 0x471EcE3750Da237f93B8E339c536989b8978a438?” or “Build a tx to send 5 USDC to
        0xcebA9300f2b948710d2653dD7B07f33A8B32118C”.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '1.5rem 0' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ padding: 12, borderRadius: 8, background: m.role === 'user' ? '#eef' : '#f4f4f5' }}>
            <strong>{m.role}</strong>
            {m.parts.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <div key={i} style={{ whiteSpace: 'pre-wrap' }}>
                    {part.text}
                  </div>
                );
              }
              if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                return (
                  <div key={i} style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
                    🔧 {part.type.replace('tool-', '')}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
