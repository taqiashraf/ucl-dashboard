export function seasonStart(date = new Date()) {
  return date.getUTCFullYear() - (date.getUTCMonth() < 6 ? 1 : 0);
}
export function seasonLabel(year: number) {
  return `${year}/${String(year + 1).slice(-2)}`;
}
