export function throwRpcError(message: string): never {
  throw new Error(message);
}
