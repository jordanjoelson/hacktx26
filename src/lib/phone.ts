/**
 * Normalizes a US phone number to E.164 ("+15125550123"), the format Spectrum uses for iMessage handles.
 * shortcut: US numbers only, matching the US flag on the homepage; add a country picker to support more.
 */
export function toE164(input: string): string | undefined {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  // US area codes and exchanges never start with 0 or 1.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return undefined;
  return `+1${digits}`;
}
