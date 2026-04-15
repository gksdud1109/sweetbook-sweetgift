"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, PageHero, Panel, StatusBanner } from "@/src/components/ui";
import { ModeBadge } from "@/src/components/preview-book";
import { useAlbumFlow } from "@/src/providers/album-flow-provider";

export default function CompletionPage() {
  const router = useRouter();
  const { hydrated, draft, book, order, source, resetFlow } = useAlbumFlow();

  if (!hydrated) {
    return (
      <Panel>
        <p className="text-sm text-rosewood/75">완료 화면을 준비 중입니다...</p>
      </Panel>
    );
  }

  if (!order || !book) {
    return (
      <div className="grid gap-6">
        <PageHero
          eyebrow="Completion"
          title="주문 완료 정보가 아직 없습니다."
          body="주문 요청을 완료하면 이 화면에서 앨범 제목과 주문 정보를 확인할 수 있습니다."
          actions={
            <ButtonLink href="/order">Order Form으로 이동</ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.94fr_0.86fr]">
      <div className="grid gap-6">
        <div className="flex items-end justify-between gap-4">
          <PageHero
            eyebrow="Completion"
            title="앨범 주문 요청이 정상적으로 접수되었습니다."
            body="입력한 앨범 정보와 주문 결과를 아래에서 확인할 수 있습니다."
          />
          <ModeBadge source={source} />
        </div>
        <StatusBanner tone="success">
          주문 요청이 완료되었습니다. 필요하면 새 앨범을 다시 만들어 흐름을 반복해 확인할 수 있습니다.
        </StatusBanner>
        <Panel>
          <dl className="grid gap-4 text-sm text-rosewood/80">
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>앨범 제목</dt>
              <dd>{draft?.title ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>bookId</dt>
              <dd>{book.bookId}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>orderId</dt>
              <dd>{order.orderId}</dd>
            </div>
            <div className="flex justify-between gap-4 pb-1">
              <dt>상태</dt>
              <dd>{order.status}</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Panel className="h-fit">
        <p className="text-xs uppercase tracking-[0.3em] text-rosewood/60">
          다음 단계
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-cocoa">
          새로운 앨범을 다시 만들어볼 수 있습니다.
        </h2>
        <p className="mt-4 text-sm leading-7 text-rosewood/80">
          상태를 초기화한 뒤 더미 데이터를 다시 불러오면 다른 기념일 앨범도 같은 흐름으로 확인할 수 있습니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              resetFlow();
              startTransition(() => {
                router.push("/create");
              });
            }}
          >
            새 앨범 만들기
          </Button>
          <ButtonLink href="/create" variant="secondary">
            Create Album으로 이동
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
