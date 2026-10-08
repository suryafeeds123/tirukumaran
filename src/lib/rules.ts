/** Dependency-free rules shared by the browser and the server. */
export const LOAN_LIMITS = { min: 10_000, max: 100_000_000 } as const;
export const CONSENT_VERSION = "2026-10-v1";

/** Strip +91 / 91 / leading 0 and separators; returns 10 digits or null. */
export function normalizeMobile(raw: string): string | null {
  let d = raw.replace(/[\s\-()]/g, "");
  if (d.startsWith("+91")) d = d.slice(3);
  else if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export const isValidText = (s: string, min: number, max: number) => {
  const t = s.normalize("NFC").replace(/\s+/g, " ").trim();
  return t.length >= min && t.length <= max && !/[<>\u0000-\u001f]/.test(t);
};
