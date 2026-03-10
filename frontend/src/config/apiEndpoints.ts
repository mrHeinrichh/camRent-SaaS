type EnvMeta = Record<string, string | boolean | undefined>;

// Keep a stable API path without per-endpoint env overrides.
export function resolveApiPath(input: string, _envMeta: EnvMeta): string {
  return input;
}
