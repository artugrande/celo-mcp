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
