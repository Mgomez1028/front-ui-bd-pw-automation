export function uniqueEmail(prefix = "user"): string {
  const stamp = Date.now();
  return `${prefix}.${stamp}@example.com`;
}
