/* eslint-disable @next/next/no-img-element */

"use client";

import type { AlbumDraftDetail, GeneratedPage } from "@sweetgift/contracts";
import { Panel } from "@/src/components/ui";
import { cn, formatDate, labelForAnniversaryType } from "@/src/lib/utils";

function renderPageContent(page: GeneratedPage) {
  if (page.type === "cover") {
    return (
      <div className="relative flex h-full flex-col justify-end overflow-hidden rounded-[30px] bg-cocoa text-white">
        {page.photoUrl ? (
          <img
            src={page.photoUrl}
            alt={page.title ?? "cover"}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}
        <div className="relative mt-auto bg-gradient-to-t from-cocoa via-cocoa/80 to-transparent p-7">
          <p className="text-xs uppercase tracking-[0.34em] text-white/70">
            Cover
          </p>
          <h3 className="mt-3 font-serif text-3xl leading-tight">
            {page.title}
          </h3>
          {page.body ? <p className="mt-3 text-sm text-white/80">{page.body}</p> : null}
        </div>
      </div>
    );
  }

  if (page.type === "moment") {
    return (
      <div className="grid h-full gap-4 rounded-[30px] bg-white p-5 md:grid-cols-[1.15fr_0.85fr]">
        {page.photoUrl ? (
          <img
            src={page.photoUrl}
            alt={page.title ?? "moment"}
            className="h-64 w-full rounded-[24px] object-cover md:h-full"
          />
        ) : null}
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-rosewood/55">
              Moment
            </p>
            <h3 className="mt-3 font-serif text-3xl text-cocoa">
              {page.title}
            </h3>
            {page.body ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-rosewood/80">
                {page.body}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (page.type === "letter") {
    return (
      <div className="flex h-full flex-col rounded-[30px] bg-[#fffdf8] p-8 text-cocoa">
        <p className="text-xs uppercase tracking-[0.34em] text-rosewood/55">
          Letter
        </p>
        <h3 className="mt-3 font-serif text-3xl">{page.title}</h3>
        <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-rosewood/85">
          {page.body}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-start justify-end rounded-[30px] bg-gradient-to-br from-oat to-blush p-8 text-cocoa">
      <p className="text-xs uppercase tracking-[0.34em] text-rosewood/55">
        Closing
      </p>
      <h3 className="mt-3 font-serif text-3xl">{page.title}</h3>
      {page.body ? <p className="mt-4 text-sm leading-7 text-rosewood/80">{page.body}</p> : null}
    </div>
  );
}

export function PreviewBookSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-3 flex justify-between px-2">
              <div className="h-3 w-16 rounded bg-rosewood/10" />
              <div className="h-3 w-12 rounded bg-rosewood/10" />
            </div>
            <div className="min-h-[420px] rounded-[34px] bg-white/40 p-4 border border-rosewood/5" />
          </div>
        ))}
      </div>
      <div className="h-fit space-y-6">
        <div className="rounded-[28px] bg-white/40 p-8 border border-rosewood/5 animate-pulse">
          <div className="h-3 w-24 rounded bg-rosewood/10" />
          <div className="mt-4 h-8 w-48 rounded bg-rosewood/10" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between border-b border-rosewood/5 pb-4">
                <div className="h-3 w-12 rounded bg-rosewood/10" />
                <div className="h-3 w-20 rounded bg-rosewood/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewBook({ draft }: { draft: AlbumDraftDetail }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-5">
        {draft.generatedPages.map((page, index) => (
          <div
            key={`${page.pageNumber}-${page.type}`}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(index * 80, 360)}ms` }}
          >
            <div className="mb-3 flex items-center justify-between px-2 text-xs uppercase tracking-[0.28em] text-rosewood/50">
              <span>
                Page {String(page.pageNumber).padStart(2, "0")}
              </span>
              <span>{page.type}</span>
            </div>
            <div className="paper-panel page-grid min-h-[420px] rounded-[34px] p-4 shadow-album">
              {renderPageContent(page)}
            </div>
          </div>
        ))}
      </div>
      <div className="order-first xl:order-last">
        <Panel className="h-fit xl:sticky xl:top-24">
          <p className="text-xs uppercase tracking-[0.34em] text-rosewood/60">
            Album Summary
          </p>
          <h2 className="mt-3 font-serif text-3xl text-cocoa">
            {draft.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-rosewood/80">
            {draft.subtitle}
          </p>
          <dl className="mt-8 space-y-4 text-sm text-rosewood/80">
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>기념일</dt>
              <dd>{labelForAnniversaryType(draft.anniversaryType)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>날짜</dt>
              <dd>{formatDate(draft.anniversaryDate)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>커플 이름</dt>
              <dd>
                {draft.couple.senderName} & {draft.couple.receiverName}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
              <dt>추억 페이지</dt>
              <dd>{draft.moments.length}개</dd>
            </div>
          </dl>
          <div className="mt-8 rounded-[24px] bg-cocoa px-5 py-5 text-white">
            <p className="text-xs uppercase tracking-[0.34em] text-white/65">
              Reviewer Demo
            </p>
            <p className="mt-2 text-sm leading-7 text-white/85">
              더미 데이터만 불러와도 한 권의 앨범이 즉시 생성되도록 구성했습니다.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ModeBadge({ source }: { source: "api" | "mock" }) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em]",
        source === "api"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {source === "api" ? "Backend Connected" : "Mock Fallback"}
    </div>
  );
}
