/**
 * Returns a local YYYY-MM-DD string based on the device's timezone.
 * Using toISOString().slice(0,10) returns the UTC date which can be
 * off by one day in UTC+9 (KST) after midnight.
 */
export function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
