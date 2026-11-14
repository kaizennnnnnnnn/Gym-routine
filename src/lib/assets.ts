/** Resolve public assets against the build's mount path, including GitHub Pages. */
export function assetUrl(source: string, base = import.meta.env?.BASE_URL || '/'): string {
  // Relative paths and external URLs already have their own browser semantics.
  if (!source.startsWith('/') || source.startsWith('//')) return source;

  const prefix = base.endsWith('/') ? base : `${base}/`;
  if (prefix === '/') return source;

  const mount = prefix.slice(0, -1);
  const path = source.split(/[?#]/, 1)[0];
  if (path === mount || source.startsWith(prefix)) return source;

  return prefix + source.slice(1);
}
