"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBook, getAlbumDraft } from "@/src/lib/api-client";
import { PreviewBook, PreviewBookSkeleton, ModeBadge } from "@/src/components/preview-book";
import { useAlbumFlow } from "@/src/providers/album-flow-provider";
import {
  Button,
  ButtonLink,
  PageHero,
  StatusBanner,
} from "@/src/components/ui";

export function PreviewPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromQuery = searchParams.get("draftId");
  const { hydrated, draft, source, setDraft, setBook } = useAlbumFlow();
  const [isFetching, setIsFetching] = useState(false);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !draftIdFromQuery) {
      return;
    }

    const draftId = draftIdFromQuery;

    if (source === "mock" && draft?.draftId === draftId) {
      return;
    }

    let cancelled = false;

    async function fetchDraft() {
      setIsFetching(true);
      setError(null);

      try {
        const result = await getAlbumDraft(draftId);
        if (!cancelled) {
          setDraft(result.data, result.source);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "앨범 정보를 성공적으로 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    void fetchDraft();

    return () => {
      cancelled = true;
    };
  }, [draft?.draftId, draftIdFromQuery, hydrated, setDraft, source]);

  async function handleCreateBook() {
    if (!draft) {
      return;
    }

    setIsCreatingBook(true);
    setError(null);

    try {
      const result = await createBook({ draftId: draft.draftId });
      setBook(result.data, result.source);
      startTransition(() => {
        router.push(`/order?bookId=${result.data.bookId}`);
      });
    } catch (bookError) {
      setError(
        bookError instanceof Error
          ? bookError.message
          : "인쇄용 도서 제작 요청 중 오류가 발생했습니다.",
      );
    } finally {
      setIsCreatingBook(false);
    }
  }

  if (!hydrated || isFetching) {
    return (
      <div className="py-20">
        <PreviewBookSkeleton />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="grid gap-12 py-20">
        <PageHero
          eyebrow="Curated Preview"
          title="앨범 초안이 아직 준비되지 않았습니다."
          body="나만의 소중한 기록을 먼저 담아보세요. 편집기에서 사진과 편지를 입력하면 실시간으로 정교하게 구성된 앨범 프리뷰가 생성됩니다."
          actions={<ButtonLink href="/create" className="bg-brand-primary shadow-liquid">기록 시작하기</ButtonLink>}
        />
        {error ? <StatusBanner tone="error" className="rounded-2xl">{error}</StatusBanner> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-10 pb-16 pt-8 sm:pt-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHero
          eyebrow="Preview & Review"
          title="당신의 소중한 기록이 작품이 되는 순간."
          body="에디토리얼 레이아웃으로 재구성된 앨범을 확인해보세요. 모든 페이지는 실제 인쇄 공격에 맞춰 정밀하게 설계되었습니다. 만족스러우시다면 인쇄 공정으로 전달할 수 있습니다."
        />
        <div className="flex flex-wrap items-center gap-3 lg:max-w-[280px] lg:justify-end">
          <ModeBadge source={source} />
          {source === "api" ? (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">Realtime Backend Sync Active</p>
          ) : (
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg">Independent Review Ready</p>
          )}
        </div>
      </div>

      {error ? <StatusBanner tone="error" className="rounded-2xl shadow-sm">{error}</StatusBanner> : null}

      <PreviewBook draft={draft} />

      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-8">
        <ButtonLink href="/create" variant="secondary" className="px-8 py-4 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50">
          편집기로 돌아가기
        </ButtonLink>
        <Button 
          onClick={handleCreateBook} 
          disabled={isCreatingBook}
          className="rounded-2xl bg-brand-dark px-12 py-4 text-white shadow-liquid transition-all hover:bg-brand-primary hover:-translate-y-0.5 active:translate-y-0"
        >
          {isCreatingBook ? "전송 중..." : "실물 도서로 제작하기"}
        </Button>
      </div>
    </div>
  );
}
