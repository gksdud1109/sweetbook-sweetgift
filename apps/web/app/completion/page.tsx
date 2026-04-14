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
          body="Order Form에서 주문 생성 요청을 마친 뒤 다시 오면 `bookId`, `orderId`, `status`가 표시됩니다."
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
            title="앨범 제작과 주문 요청이 모두 완료되었습니다."
            body="MVP 완료 화면에서는 주문 결과를 단순하고 명확하게 보여줍니다. 심사자는 이 화면만 봐도 전체 happy path가 끝까지 연결된 것을 바로 이해할 수 있습니다."
          />
          <ModeBadge source={source} />
        </div>
        <StatusBanner tone="success">
          주문이 정상적으로 접수되었습니다. 아래 응답 값은 계약 문서의 완료 상태 형식을 그대로 따릅니다.
        </StatusBanner>
        <Panel>
          <dl className="grid gap-4 text-sm text-rosewood/80">
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>title</dt>
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
              <dt>status</dt>
              <dd>{order.status}</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Panel className="h-fit">
        <p className="text-xs uppercase tracking-[0.3em] text-rosewood/60">
          Next Action
        </p>
        <h2 className="mt-3 font-serifDisplay text-3xl text-cocoa">
          같은 흐름을 다시 데모할 수 있습니다.
        </h2>
        <p className="mt-4 text-sm leading-7 text-rosewood/80">
          상태를 초기화한 뒤 더미 데이터를 다시 불러오면, 과제 시연용 happy path를 반복해서 확인할 수 있습니다.
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
            새 앨범 시작
          </Button>
          <ButtonLink href="/create" variant="secondary">
            Create Album으로 이동
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
