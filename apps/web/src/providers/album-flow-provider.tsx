"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AlbumDraftDetail,
  CreateBookResponse,
  CreateOrderResponse,
} from "@sweetgift/contracts";
import {
  createInitialFormState,
  type AlbumDraftFormState,
  type PersistedFlow,
  type RuntimeSource,
} from "@/src/lib/album-flow";
import {
  clearFlowSnapshot,
  readFlowSnapshot,
  writeFlowSnapshot,
} from "@/src/lib/storage";
import { sampleDraftForm } from "@/src/data/sample-draft";

type AlbumFlowContextValue = PersistedFlow & {
  hydrated: boolean;
  setForm: (
    updater: AlbumDraftFormState | ((current: AlbumDraftFormState) => AlbumDraftFormState),
  ) => void;
  loadSample: () => void;
  setDraft: (draft: AlbumDraftDetail, source: RuntimeSource) => void;
  setBook: (book: CreateBookResponse, source: RuntimeSource) => void;
  setOrder: (order: CreateOrderResponse, source: RuntimeSource) => void;
  resetFlow: () => void;
};

const AlbumFlowContext = createContext<AlbumFlowContextValue | null>(null);

export function AlbumFlowProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [flow, setFlow] = useState<PersistedFlow>({
    form: createInitialFormState(),
    draft: null,
    book: null,
    order: null,
    source: "mock",
  });

  useEffect(() => {
    setFlow(readFlowSnapshot());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeFlowSnapshot(flow);
  }, [flow, hydrated]);

  const value = useMemo<AlbumFlowContextValue>(
    () => ({
      ...flow,
      hydrated,
      setForm: (updater) => {
        setFlow((current) => ({
          ...current,
          form:
            typeof updater === "function"
              ? updater(current.form)
              : updater,
        }));
      },
      loadSample: () => {
        setFlow((current) => ({
          ...current,
          form: sampleDraftForm,
        }));
      },
      setDraft: (draft, source) => {
        setFlow((current) => ({
          ...current,
          draft,
          book: null,
          order: null,
          source,
          form: {
            anniversaryType: draft.anniversaryType,
            anniversaryDate: draft.anniversaryDate,
            senderName: draft.couple.senderName,
            receiverName: draft.couple.receiverName,
            title: draft.title,
            subtitle: draft.subtitle,
            letter: draft.letter,
            coverPhotoUrl: draft.coverPhotoUrl,
            moments: draft.moments.map((moment) => ({
              id: moment.id,
              date: moment.date,
              title: moment.title,
              body: moment.body,
              photoUrl: moment.photoUrl,
            })),
          },
        }));
      },
      setBook: (book, source) => {
        setFlow((current) => ({
          ...current,
          book,
          order: null,
          source,
        }));
      },
      setOrder: (order, source) => {
        setFlow((current) => ({
          ...current,
          order,
          source,
        }));
      },
      resetFlow: () => {
        clearFlowSnapshot();
        setFlow({
          form: createInitialFormState(),
          draft: null,
          book: null,
          order: null,
          source: "mock",
        });
      },
    }),
    [flow, hydrated],
  );

  return (
    <AlbumFlowContext.Provider value={value}>
      {children}
    </AlbumFlowContext.Provider>
  );
}

export function useAlbumFlow() {
  const context = useContext(AlbumFlowContext);
  if (!context) {
    throw new Error("AlbumFlowProvider가 필요합니다.");
  }

  return context;
}
