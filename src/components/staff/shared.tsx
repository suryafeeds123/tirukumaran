"use client";
export const STATUS_LABEL: Record<string, string> = {
  new: "New", contacted: "Contacted", documents_pending: "Documents pending",
  under_review: "Under review", approved: "Approved", closed: "Closed",
};
export const VEHICLE_LABEL: Record<string, string> = { car: "Car", two_wheeler: "Two wheeler" };
export const EMPLOYMENT_LABEL: Record<string, string> = { salaried: "Salaried", self_employed: "Self-employed", business: "Business" };
export const CALLBACK_LABEL: Record<string, string> = { morning: "Morning (9–12)", afternoon: "Afternoon (12–4)", evening: "Evening (4–7)", anytime: "Any time" };
export const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
export const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", dateStyle: "medium" }).format(new Date(d + "T00:00:00Z"));

export function isOverdue(next: string | null, status: string, today: string) {
  return !!next && next < today && status !== "closed" && status !== "approved";
}

export function StatusBadge({ status }: { status: string }) {
  const color: Record<string, string> = {
    new: "#22c7e6", contacted: "#7c6cf0", documents_pending: "#ffcf78", under_review: "#c79bff", approved: "#67e8a5", closed: "#9bb2c3",
  };
  const c = color[status] ?? "#9bb2c3";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "3px 12px", borderRadius: 999, border: `1px solid ${c}55`, color: c, fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      <i style={{ width: 7, height: 7, borderRadius: 9, background: c }} aria-hidden="true" />{STATUS_LABEL[status] ?? status}
    </span>
  );
}

export async function logout() {
  await fetch("/api/staff/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  window.location.href = "/staff";
}
