"use client";
import { useSyncExternalStore } from "react";

/**
 * In-memory store for the enquiry assistant. It lives at module level (not in React state) so the visitor's
 * answers and the open/closed state survive a language switch, which remounts the locale layout.
 * Nothing here is persisted to localStorage / cookies — personal data stays in memory only.
 */
export type Draft = {
  vehicle: "" | "car" | "two_wheeler";
  amount: string;
  area: string;
  employment: "" | "salaried" | "self_employed" | "business";
  name: string;
  mobile: string;
  callback: "" | "morning" | "afternoon" | "evening" | "anytime";
  consent: boolean;
};

export type AssistState = {
  open: boolean;
  step: number; // 0..6 questions/review, 7 = result
  draft: Draft;
  idempotencyKey: string;
  openedAt: number;
  result: null | { kind: "success"; reference: string; name: string; mobile: string } | { kind: "preview" };
  animated: boolean; // opening animation already played (don't replay after a remount)
};

const emptyDraft: Draft = { vehicle: "", amount: "", area: "", employment: "", name: "", mobile: "", callback: "", consent: false };
const fresh = (): AssistState => ({
  open: false, step: 0, draft: { ...emptyDraft }, idempotencyKey: "", openedAt: 0, result: null, animated: false,
});

let state: AssistState = fresh();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const assistStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  set(patch: Partial<AssistState>) { state = { ...state, ...patch }; emit(); },
  setDraft(patch: Partial<Draft>) { state = { ...state, draft: { ...state.draft, ...patch } }; emit(); },
  open() {
    if (state.open) return;
    const needNew = !state.idempotencyKey || state.result !== null;
    if (needNew) state = fresh();
    state = {
      ...state, open: true,
      idempotencyKey: state.idempotencyKey || crypto.randomUUID(),
      openedAt: state.openedAt || Date.now(),
    };
    emit();
  },
  close() { state = { ...state, open: false, animated: false }; emit(); },
  reset() { state = { ...fresh(), open: true, idempotencyKey: crypto.randomUUID(), openedAt: Date.now() }; emit(); },
};

const server = fresh();
export const useAssist = () => useSyncExternalStore(assistStore.subscribe, assistStore.get, () => server);
