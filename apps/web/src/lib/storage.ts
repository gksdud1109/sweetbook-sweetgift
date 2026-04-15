import type { PersistedFlow } from "@/src/lib/album-flow";
import { createInitialFlowState, STORAGE_KEY } from "@/src/lib/album-flow";
import { persistedFlowSchema } from "@/src/lib/storage-schema";

function scrubTransientUrl(value: string) {
  return value.startsWith("blob:") ? "" : value;
}

function scrubTransientUrls(snapshot: PersistedFlow): PersistedFlow {
  return {
    ...snapshot,
    form: {
      ...snapshot.form,
      coverPhotoUrl: scrubTransientUrl(snapshot.form.coverPhotoUrl),
      moments: snapshot.form.moments.map((moment) => ({
        ...moment,
        photoUrl: scrubTransientUrl(moment.photoUrl),
      })),
    },
    draft: snapshot.draft
      ? {
          ...snapshot.draft,
          coverPhotoUrl: scrubTransientUrl(snapshot.draft.coverPhotoUrl),
          moments: snapshot.draft.moments.map((moment) => ({
            ...moment,
            photoUrl: scrubTransientUrl(moment.photoUrl),
          })),
          generatedPages: snapshot.draft.generatedPages.map((page) => ({
            ...page,
            photoUrl: page.photoUrl ? scrubTransientUrl(page.photoUrl) : page.photoUrl,
          })),
        }
      : null,
  };
}

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
      return scrubTransientUrls(parsed.data);
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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scrubTransientUrls(snapshot)));
}

export function clearFlowSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
