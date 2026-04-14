/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";
import type { AlbumDraftDetail, GeneratedPage, Decoration } from "@sweetgift/contracts";
import { Panel } from "@/src/components/ui";
import { cn, formatDate, labelForAnniversaryType } from "@/src/lib/utils";

function StickerLayer({ decorations }: { decorations?: Decoration[] }) {
  if (!decorations || decorations.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      {decorations.map((deco) => (
        <div
          key={deco.id}
          className="absolute"
          style={{
            left: `${deco.x}%`,
            top: `${deco.y}%`,
            transform: `translate(-50%, -50%) rotate(${deco.rotate}deg) scale(${deco.scale})`,
            fontSize: "2.5rem",
            userSelect: "none",
          }}
        >
          {deco.value}
        </div>
      ))}
    </div>
  );
}

function renderPageContent(page: GeneratedPage) {
  if (page.type === "cover") {
    return (
      <div className="relative flex h-full flex-col justify-end overflow-hidden rounded-[24px] bg-brand-dark text-white">
        {page.photoUrl ? (
          <img
            src={page.photoUrl}
            alt={page.title ?? "cover"}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        ) : null}
        <StickerLayer decorations={page.decorations} />
        <div className="relative mt-auto bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent p-12">
          <div className="h-1 w-12 bg-brand-primary mb-8 rounded-full" />
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-primary/80 mb-4">
            Exclusive Anniversary
          </p>
          <h3 className="font-serif text-5xl leading-tight tracking-tight">
            {page.title}
          </h3>
          {page.body ? <p className="mt-6 text-sm text-white/60 font-medium leading-relaxed max-w-sm">{page.body}</p> : null}
        </div>
      </div>
    );
  }

  if (page.type === "moment") {
    return (
      <div className="grid h-full gap-12 bg-white p-10 md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[20px] shadow-2xl group bg-slate-50">
          {page.photoUrl ? (
            <img
              src={page.photoUrl}
              alt={page.title ?? "moment"}
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          ) : null}
          <StickerLayer decorations={page.decorations} />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-8">
            Scene {page.pageNumber}
          </p>
          <h3 className="font-serif text-4xl text-brand-dark mb-8 leading-tight">
            {page.title}
          </h3>
          <div className="h-px w-full bg-slate-100 mb-8" />
          {page.body ? (
            <p className="whitespace-pre-wrap text-base leading-9 text-slate-500 font-medium italic">
              {page.body}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (page.type === "letter") {
    return (
      <div className="flex h-full flex-col justify-center items-center bg-[#fdfcfb] p-16 text-brand-dark text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-primary/20" />
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-12">Heartfelt Note</p>
        <h3 className="font-serif text-5xl mb-12 tracking-tighter">{page.title}</h3>
        <div className="max-w-xl">
          <p className="whitespace-pre-wrap text-lg leading-10 text-slate-600 font-serif italic">
            {page.body}
          </p>
        </div>
        <div className="mt-16 text-brand-accent animate-pulse">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-16 text-brand-dark text-center">
      <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-12 text-brand-primary animate-float">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-6">Fin.</p>
      <h3 className="font-serif text-4xl mb-6 italic">{page.title}</h3>
      {page.body ? <p className="text-base text-slate-400 font-medium leading-8">{page.body}</p> : null}
    </div>
  );
}

export function PreviewBook({ draft }: { draft: AlbumDraftDetail }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<"classic" | "acoustic" | "jazz">("classic");

  return (
    <div className="relative">
      {/* Mood Music Player (Top Floating) */}
      <div className="absolute top-[-80px] right-0 z-40">
        <div className="paper-panel px-6 py-3 rounded-2xl shadow-liquid flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                isPlaying ? "bg-brand-primary text-white shadow-lg" : "bg-slate-100 text-slate-400"
              )}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mood BGM</p>
              <p className="text-[11px] font-bold text-brand-dark">{isPlaying ? `Playing ${mood}...` : "Paused"}</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-100" />
          
          <div className="flex gap-2">
            {(["classic", "acoustic", "jazz"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                  mood === m ? "bg-brand-primary/10 text-brand-primary" : "text-slate-400 hover:bg-slate-50"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-10 overflow-x-auto pb-8 mb-8 snap-x snap-mandatory px-4 sm:px-0 custom-scrollbar">
        {draft.generatedPages.map((page, index) => (
          <div
            key={`${page.pageNumber}-${page.type}`}
            className="flex-none w-full max-w-[920px] snap-center animate-rise"
            style={{ animationDelay: `${Math.min(index * 100, 400)}ms` }}
          >
            <div className="mb-6 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary text-[10px] font-black">
                  {String(page.pageNumber).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{page.type}</span>
              </div>
            </div>
            <div className="paper-panel min-h-[580px] rounded-[40px] p-2 shadow-liquid relative group overflow-hidden border-none">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/[0.03] to-transparent z-10 pointer-events-none" />
              <div className="relative h-full w-full bg-white rounded-[32px] overflow-hidden shadow-inner">
                {renderPageContent(page)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Panel className="lg:col-span-2 bg-white/40 border-none backdrop-blur-xl p-12 rounded-[48px] shadow-glass">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary mb-4">Masterpiece Draft</p>
              <h2 className="font-serif text-5xl text-brand-dark tracking-tight">{draft.title}</h2>
              <p className="mt-6 text-base text-slate-500 leading-8 max-w-xl font-medium">{draft.subtitle}</p>
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
        
        <div className="bg-brand-dark p-12 rounded-[48px] text-white flex flex-col justify-between shadow-liquid relative overflow-hidden">
          <div className="blob absolute top-[-50%] right-[-50%] w-64 h-64 bg-brand-primary/20 blur-3xl opacity-50" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-6">Process Summary</p>
            <p className="text-base leading-relaxed font-medium text-white/80">
              {draft.couple.senderName}님이 {draft.couple.receiverName}님을 위해 정성껏 빚어낸 {draft.moments.length}장의 소중한 기록입니다.
            </p>
          </div>
          <div className="relative mt-12 pt-8 border-t border-white/10">
            <p className="text-[11px] font-black uppercase tracking-widest text-brand-accent italic">Quality Assurance Certified</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewBookSkeleton() {
  return (
    <div className="flex gap-10 overflow-hidden px-4 sm:px-0">
      {[1, 2].map((i) => (
        <div key={i} className="flex-none w-full max-w-[920px] animate-pulse">
          <div className="mb-6 h-4 w-32 rounded-lg bg-slate-100" />
          <div className="min-h-[580px] rounded-[40px] bg-white/40 p-4 border border-slate-100" />
        </div>
      ))}
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
      {source === "api" ? "Pro Pipeline" : "Preview Mode"}
    </div>
  );
}
