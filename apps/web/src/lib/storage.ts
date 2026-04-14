import type { PersistedFlow } from "@/src/lib/album-flow";
import { createInitialFormState, STORAGE_KEY } from "@/src/lib/album-flow";

export function readFlowSnapshot(): PersistedFlow {
  if (typeof window === "undefined") {
    return {
      form: createInitialFormState(),
      draft: null,
      book: null,
      order: null,
      source: "mock",
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      form: createInitialFormState(),
      draft: null,
      book: null,
      order: null,
      source: "mock",
    };
  }

  try {
    return JSON.parse(raw) as PersistedFlow;
  } catch {
    return {
      form: createInitialFormState(),
      draft: null,
      book: null,
      order: null,
      source: "mock",
    };
  }
}

export function writeFlowSnapshot(snapshot: PersistedFlow) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearFlowSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
