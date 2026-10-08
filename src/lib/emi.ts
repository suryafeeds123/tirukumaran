/** Standard reducing-balance EMI. All amounts in INR. */
export const EMI_LIMITS = {
  minAmount: 10_000,
  maxAmount: 100_000_000, // ₹10 crore
  minRate: 0,
  maxRate: 60,
  minMonths: 1,
  maxMonths: 360,
} as const;

export type EmiError = "amount" | "rate" | "tenure";
export type EmiResult =
  | { ok: true; emi: number; totalInterest: number; totalRepayment: number }
  | { ok: false; errors: EmiError[] };

export function calculateEmi(amount: number, annualRatePct: number, months: number): EmiResult {
  const errors: EmiError[] = [];
  const L = EMI_LIMITS;
  if (!Number.isFinite(amount) || amount < L.minAmount || amount > L.maxAmount) errors.push("amount");
  if (!Number.isFinite(annualRatePct) || annualRatePct < L.minRate || annualRatePct > L.maxRate) errors.push("rate");
  if (!Number.isInteger(months) || months < L.minMonths || months > L.maxMonths) errors.push("tenure");
  if (errors.length) return { ok: false, errors };

  const r = annualRatePct / 12 / 100;
  let emi: number;
  if (r === 0) {
    emi = amount / months;
  } else {
    const pow = Math.pow(1 + r, months);
    emi = (amount * r * pow) / (pow - 1);
  }
  if (!Number.isFinite(emi)) return { ok: false, errors: ["rate"] };
  // Round the EMI to the nearest rupee as lenders typically bill whole rupees, then derive totals from it.
  const emiRounded = Math.round(emi);
  const totalRepayment = emiRounded * months;
  const totalInterest = Math.max(0, totalRepayment - amount);
  return { ok: true, emi: emiRounded, totalInterest, totalRepayment };
}

/** Parse a user-typed number: tolerates commas/spaces; rejects anything else. */
export function parseNumber(s: string): number {
  const t = s.replace(/[,\s₹]/g, "");
  if (!/^\d*\.?\d+$/.test(t) && !/^\d+\.?$/.test(t)) return NaN;
  return Number(t);
}
