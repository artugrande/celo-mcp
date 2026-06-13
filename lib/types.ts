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
