import { describe, expect, it } from "vitest";
import { calculateEmi, parseNumber } from "@/lib/emi";
import { normalizeMobile } from "@/lib/rules";
import { enquirySchema } from "@/lib/validation";

describe("EMI", () => {
  it("matches the reducing-balance formula", () => {
    // 5,00,000 @ 10% for 60 months → 10,623.52 → ₹10,624
    const r = calculateEmi(500000, 10, 60);
    expect(r.ok && r.emi).toBe(10624);
    expect(r.ok && r.totalRepayment).toBe(10624 * 60);
    expect(r.ok && r.totalInterest).toBe(10624 * 60 - 500000);
  });
  it("handles zero interest", () => {
    const r = calculateEmi(120000, 0, 12);
    expect(r).toEqual({ ok: true, emi: 10000, totalInterest: 0, totalRepayment: 120000 });
  });
  it("rounds zero-interest EMI without negative interest", () => {
    const r = calculateEmi(100000, 0, 3);
    expect(r.ok && r.totalInterest).toBe(0);
  });
  it("rejects invalid input", () => {
    expect(calculateEmi(NaN, 5, 12)).toEqual({ ok: false, errors: ["amount"] });
    expect(calculateEmi(500, 5, 12).ok).toBe(false);
    expect(calculateEmi(1e12, 5, 12).ok).toBe(false);
    expect(calculateEmi(100000, -1, 12).ok).toBe(false);
    expect(calculateEmi(100000, 61, 12).ok).toBe(false);
    expect(calculateEmi(100000, 5, 0).ok).toBe(false);
    expect(calculateEmi(100000, 5, 12.5).ok).toBe(false);
    expect(calculateEmi(100000, 5, 361).ok).toBe(false);
  });
  it("never overflows at the extremes", () => {
    const r = calculateEmi(100_000_000, 60, 360);
    expect(r.ok && Number.isFinite(r.emi)).toBe(true);
  });
  it("parses typed numbers strictly", () => {
    expect(parseNumber("5,00,000")).toBe(500000);
    expect(parseNumber("9.5")).toBe(9.5);
    expect(Number.isNaN(parseNumber("12abc"))).toBe(true);
    expect(Number.isNaN(parseNumber(""))).toBe(true);
  });
});

describe("validation", () => {
  it("normalises Indian mobiles", () => {
    expect(normalizeMobile("+91 98765-43210")).toBe("9876543210");
    expect(normalizeMobile("09876543210")).toBe("9876543210");
    expect(normalizeMobile("5876543210")).toBeNull();
    expect(normalizeMobile("12345")).toBeNull();
  });
  const base = {
    idempotencyKey: "3f1c2f3e-9d2a-4c1b-8d7e-0a1b2c3d4e5f", vehicleType: "car", loanAmount: 500000, area: "Tiruppur",
    employment: "salaried", name: "A Kumar", mobile: "9876543210", callbackTime: "anytime", consent: true, language: "ta",
  };
  it("accepts a valid enquiry and requires consent", () => {
    expect(enquirySchema.safeParse(base).success).toBe(true);
    expect(enquirySchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });
  it("only allows car and two_wheeler", () => {
    expect(enquirySchema.safeParse({ ...base, vehicleType: "truck" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...base, vehicleType: "two_wheeler" }).success).toBe(true);
  });
  it("rejects markup and a filled honeypot", () => {
    expect(enquirySchema.safeParse({ ...base, name: "<script>" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
  });
});
