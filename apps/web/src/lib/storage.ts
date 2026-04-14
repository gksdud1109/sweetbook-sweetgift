import type { PersistedFlow } from "@/src/lib/album-flow";
import { createInitialFlowState, STORAGE_KEY } from "@/src/lib/album-flow";
import { persistedFlowSchema } from "@/src/lib/storage-schema";

export function readFlowSnapshot(): PersistedFlow {
  if (typeof window === "undefined") {
    return createInitialFlowState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialFlowState();
  }

  try {
    const parsed = persistedFlowSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      return parsed.data;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    return createInitialFlowState();
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return createInitialFlowState();
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
