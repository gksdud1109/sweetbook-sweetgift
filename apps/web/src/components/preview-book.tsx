/* eslint-disable @next/next/no-img-element */

"use client";

import type { AlbumDraftDetail, GeneratedPage } from "@sweetgift/contracts";
import { Panel } from "@/src/components/ui";
import type { Decoration } from "@/src/lib/album-flow";
import { cn, formatDate, labelForAnniversaryType } from "@/src/lib/utils";

const DECORATION_SAFE_EDGE = 8;
const PREVIEW_DECORATION_BASE_PX = 32;

function clampDecorationPercent(value: number) {
  return Math.max(DECORATION_SAFE_EDGE, Math.min(100 - DECORATION_SAFE_EDGE, value));
}

function StickerLayer({
  decorations,
  className,
}: {
  decorations?: Decoration[];
  className?: string;
}) {
  if (!decorations || decorations.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)} aria-hidden="true">
      {decorations.map((deco) => (
        <div
          key={deco.id}
          className="absolute"
          style={{
            left: `${clampDecorationPercent(deco.x)}%`,
            top: `${clampDecorationPercent(deco.y)}%`,
            transform: `translate(-50%, -50%) rotate(${deco.rotate}deg) scale(${deco.scale})`,
            fontSize: `${PREVIEW_DECORATION_BASE_PX}px`,
            userSelect: "none",
            zIndex: 5,
            textShadow: "0 10px 20px rgba(15, 23, 42, 0.18)",
          }}
        >
          {deco.value}
        </div>
      ))}
    </div>
  );
}

function ImageStage({
  src,
  alt,
  decorations,
  mode = "contain",
  overlayClassName,
  imageClassName,
  className,
}: {
  src?: string;
  alt: string;
  decorations?: Decoration[];
  mode?: "contain" | "cover";
  overlayClassName?: string;
  imageClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[24px]",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full w-full",
            mode === "cover" ? "object-cover" : "object-contain",
            imageClassName,
          )}
        />
      ) : null}
      <StickerLayer decorations={decorations} className={overlayClassName} />
    </div>
  );
}

function renderPageContent(page: GeneratedPage) {
  if (page.type === "cover") {
    return (
      <div className="relative flex h-full min-h-[360px] flex-col justify-end overflow-hidden rounded-[30px] bg-brand-dark text-white sm:min-h-[420px]">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/20 via-brand-dark to-brand-dark" />
        {page.photoUrl ? (
          <ImageStage
            src={page.photoUrl}
            alt={page.title ?? "cover"}
            decorations={page.decorations}
            mode="contain"
            className="absolute inset-0 rounded-none bg-transparent"
            overlayClassName="inset-6 sm:inset-8"
            imageClassName="bg-brand-dark/30 p-6 opacity-70 sm:p-8"
          />
        ) : null}
        <div className="relative z-20 mt-auto bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent p-6 sm:p-8 lg:p-10">
          <div className="mb-6 h-1 w-12 rounded-full bg-brand-primary" />
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/80">
            Anniversary Book
          </p>
          <h3 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {page.title}
          </h3>
          {page.body ? (
            <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-white/70 sm:text-base">
              {page.body}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (page.type === "moment") {
    return (
      <div className="grid h-full gap-6 bg-white p-5 sm:p-7 lg:p-9 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-9">
        <div className="min-h-[300px] overflow-hidden rounded-[24px] bg-slate-50 shadow-xl ring-1 ring-slate-100">
          <ImageStage
            src={page.photoUrl}
            alt={page.title ?? "moment"}
            decorations={page.decorations}
            mode="contain"
            className="h-full bg-[linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.78))]"
            overlayClassName="inset-5"
            imageClassName="bg-white p-5"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.32em] text-brand-primary/40">
            Memory {page.pageNumber}
          </p>
          <h3 className="mb-5 text-3xl font-semibold leading-tight text-brand-dark sm:text-4xl">
            {page.title}
          </h3>
          <div className="mb-5 h-px w-full bg-slate-100" />
          {page.body ? (
            <p className="whitespace-pre-wrap text-base font-medium italic leading-8 text-slate-500 sm:leading-9">
              {page.body}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (page.type === "letter") {
    return (
      <div className="relative flex h-full min-h-[360px] flex-col items-center justify-center overflow-hidden bg-[#fdfcfb] p-8 text-center text-brand-dark sm:p-12">
        <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-primary/20" />
        <p className="mb-8 text-[11px] font-black uppercase tracking-[0.34em] text-brand-primary/40">Letter</p>
        <h3 className="mb-8 text-3xl font-semibold tracking-tight sm:text-5xl">{page.title}</h3>
        <div className="max-w-xl">
          <p className="whitespace-pre-wrap text-base leading-8 text-slate-600 sm:text-lg sm:leading-10">
            {page.body}
          </p>
        </div>
        <div className="mt-12 animate-pulse text-brand-accent">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-slate-50 p-8 text-center text-brand-dark sm:p-12">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-brand-primary shadow-xl animate-float">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-brand-primary/40">Final Page</p>
      <h3 className="mb-4 text-3xl font-semibold sm:text-4xl">{page.title}</h3>
      {page.body ? <p className="text-base font-medium leading-8 text-slate-400">{page.body}</p> : null}
    </div>
  );
}

export function PreviewBook({ draft }: { draft: AlbumDraftDetail }) {
  return (
    <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:items-start">
      <div className="min-w-0">
        <div className="custom-scrollbar -mx-2 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pb-5 sm:pb-6">
          {draft.generatedPages.map((page, index) => (
            <section
              key={`${page.pageNumber}-${page.type}`}
              className="w-[min(100%,1180px)] shrink-0 snap-center animate-rise 2xl:w-[min(100%,1280px)]"
              style={{ animationDelay: `${Math.min(index * 100, 400)}ms` }}
            >
              <div className="mb-4 flex items-center justify-between px-1 sm:px-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary/10 text-[10px] font-black text-brand-primary">
                    {String(page.pageNumber).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{page.type}</span>
                </div>
              </div>
              <div className="paper-panel relative aspect-[1.42/1] w-full overflow-hidden rounded-[34px] border-none p-3 shadow-liquid sm:p-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/[0.03] to-transparent sm:w-12" />
                <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-white shadow-inner">
                  {renderPageContent(page)}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 2xl:sticky 2xl:top-24 2xl:grid-cols-1">
        <Panel className="rounded-[36px] border-none bg-white/40 p-8 shadow-glass backdrop-blur-xl sm:p-10">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.34em] text-brand-primary">Album Preview</p>
              <h2 className="text-3xl font-semibold tracking-tight text-brand-dark sm:text-4xl">{draft.title}</h2>
              <p className="mt-4 text-base font-medium leading-8 text-slate-500">{draft.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-5 py-2.5 rounded-2xl bg-white shadow-sm text-[11px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/5">
                {labelForAnniversaryType(draft.anniversaryType)}
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-white shadow-sm text-[11px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/5">
                {formatDate(draft.anniversaryDate)}
              </div>
            </div>
          </div>
        </Panel>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-[36px] bg-brand-dark p-8 text-white shadow-liquid sm:p-10">
          <div className="blob absolute right-[-35%] top-[-35%] h-52 w-52 bg-brand-primary/20 opacity-50 blur-3xl" />
          <div className="relative">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-white/40">Summary</p>
            <p className="text-base font-medium leading-relaxed text-white/80">
              {draft.couple.senderName}님이 {draft.couple.receiverName}님을 위해 준비한 {draft.moments.length}개의 추억 페이지와 한 장의 편지가 앨범으로 정리되었습니다.
            </p>
          </div>
          <div className="relative mt-10 border-t border-white/10 pt-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-brand-accent">주문 전 미리보기 확인 가능</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewBookSkeleton() {
  return (
    <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:items-start">
      <div className="custom-scrollbar -mx-2 flex gap-6 overflow-x-auto px-2 pb-5 sm:pb-6">
        {[1, 2].map((i) => (
          <div key={i} className="w-[min(100%,1180px)] shrink-0 animate-pulse 2xl:w-[min(100%,1280px)]">
            <div className="mb-4 h-4 w-32 rounded-lg bg-slate-100" />
            <div className="aspect-[1.42/1] rounded-[34px] border border-slate-100 bg-white/40 p-4" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-1">
        <div className="h-56 animate-pulse rounded-[36px] bg-white/50" />
        <div className="h-64 animate-pulse rounded-[36px] bg-slate-900/80" />
      </div>
    </div>
  );
}

export function ModeBadge({ source }: { source: "api" | "mock" }) {
  return (
    <div
      className={cn(
        "inline-flex rounded-2xl border px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] shadow-glass backdrop-blur-md",
        source === "api"
          ? "border-brand-primary/20 bg-brand-primary/5 text-brand-primary"
          : "border-brand-secondary/20 bg-brand-secondary/5 text-brand-secondary",
      )}
    >
      {source === "api" ? "API 연결" : "미리보기 모드"}
    </div>
  );
}
