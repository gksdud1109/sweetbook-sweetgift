"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBook, getAlbumDraft } from "@/src/lib/api-client";
import { PreviewBook, ModeBadge } from "@/src/components/preview-book";
import { useAlbumFlow } from "@/src/providers/album-flow-provider";
import {
  Button,
  ButtonLink,
  PageHero,
  Panel,
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
              : "초안 정보를 불러오지 못했습니다.",
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
          : "책 생성 요청에 실패했습니다.",
      );
    } finally {
      setIsCreatingBook(false);
    }
  }

  if (!hydrated || isFetching) {
    return (
      <Panel>
        <p className="text-sm text-rosewood/75">앨범 미리보기를 준비 중입니다...</p>
      </Panel>
    );
  }

  if (!draft) {
    return (
      <div className="grid gap-6">
        <PageHero
          eyebrow="Album Preview"
          title="먼저 초안을 만들어야 미리보기를 볼 수 있습니다."
          body="Create Album 화면에서 직접 입력하거나 더미 데이터를 불러오면 generatedPages 기반 미리보기가 바로 생성됩니다."
          actions={<ButtonLink href="/create">앨범 만들러 가기</ButtonLink>}
        />
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHero
          eyebrow="Album Preview"
          title="핵심 화면은 Preview입니다. 생성된 페이지를 그대로 검토한 뒤 책 생성을 진행합니다."
          body="표지, 추억 페이지, 편지, 마무리 페이지까지 모두 `generatedPages` 렌더링으로 구성했습니다. 백엔드 연결 시 실제 계약 응답을 우선 사용하고, 준비 전에는 mock fallback으로 데모가 이어집니다."
        />
        <ModeBadge source={source} />
      </div>

      {source === "mock" ? (
        <StatusBanner>
          현재는 mock fallback 결과를 보고 있습니다. 백엔드가 준비되면 같은 버튼으로 `POST /api/v1/books`까지 실제 호출됩니다.
        </StatusBanner>
      ) : (
        <StatusBanner tone="success">
          백엔드 계약 응답으로 미리보기를 렌더링하고 있습니다.
        </StatusBanner>
      )}

      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

      <PreviewBook draft={draft} />

      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href="/create" variant="secondary">
          내용 수정하기
        </ButtonLink>
        <Button onClick={handleCreateBook} disabled={isCreatingBook}>
          {isCreatingBook ? "책 생성 요청 중..." : "책 생성 요청"}
        </Button>
      </div>
    </div>
  );
}
