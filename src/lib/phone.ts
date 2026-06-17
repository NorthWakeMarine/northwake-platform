import { parsePhoneNumberFromString } from "libphonenumber-js";

// Normalize a phone string to E.164 (e.g. "+19046065454"). Falls back to the
// trimmed input when it can't be parsed, and null when empty. Use this on both
// sides of any phone comparison so differently formatted numbers still match.
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, "US");
  return parsed?.isValid() ? parsed.format("E.164") : raw.trim() || null;
}
