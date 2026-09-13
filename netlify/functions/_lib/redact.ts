export function redact(text: string, key = process.env.FOOTBALL_API_KEY) {
  const clean = key ? text.split(key).join('[redacted]') : text;
  return clean.replace(
    /((?:x-auth-token|x-apisports-key|authorization)\s*[:=]\s*)[^\s,}]+/gi,
    '$1[redacted]',
  );
}
export function logFailure(status: number, key?: string) {
  console.error(
    redact(`Football provider request failed; status=${status}`, key),
  );
}
