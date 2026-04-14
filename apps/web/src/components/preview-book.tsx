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
            fontSize: "2rem",
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
      <div className="relative flex h-full flex-col justify-end overflow-hidden rounded-[20px] bg-cocoa text-white shadow-inner">
        {page.photoUrl ? (
          <img
            src={page.photoUrl}
            alt={page.title ?? "cover"}
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 hover:scale-105"
          />
        ) : null}
        
        {/* Render Cover Stickers */}
        <StickerLayer decorations={page.decorations} />

        <div className="relative mt-auto bg-gradient-to-t from-cocoa via-cocoa/80 to-transparent p-10">
          <div className="h-px w-12 bg-coral mb-6" />
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/60 mb-2">
            Anniversary Album
          </p>
          <h3 className="font-serif text-4xl leading-tight">
            {page.title}
          </h3>
          {page.body ? <p className="mt-4 text-sm text-white/70 font-light tracking-wide">{page.body}</p> : null}
        </div>
      </div>
    );
  }

  if (page.type === "moment") {
    return (
      <div className="grid h-full gap-8 bg-white p-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[16px] shadow-lg group">
          {page.photoUrl ? (
            <img
              src={page.photoUrl}
              alt={page.title ?? "moment"}
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          ) : null}
          
          {/* Render Moment Stickers */}
          <StickerLayer decorations={page.decorations} />

          <div className="absolute inset-0 bg-black/5" />
        </div>
        <div className="flex flex-col justify-center py-4">
          <p className="text-[10px] uppercase tracking-[0.4em] text-rosewood/40 font-bold mb-6">
            Moment {page.pageNumber}
          </p>
          <h3 className="font-serif text-3xl text-cocoa mb-6 border-b border-rosewood/5 pb-6">
            {page.title}
          </h3>
          {page.body ? (
            <p className="whitespace-pre-wrap text-sm leading-8 text-rosewood/70 font-light italic">
              "{page.body}"
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (page.type === "letter") {
    return (
      <div className="flex h-full flex-col justify-center items-center bg-[#fffdf8] p-12 text-cocoa text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coral/20 to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-rosewood/40 mb-10">Private Letter</p>
        <h3 className="font-serif text-4xl mb-10">{page.title}</h3>
        <div className="max-w-md">
          <p className="whitespace-pre-wrap text-base leading-9 text-rosewood/80 font-serif opacity-90 italic">
            {page.body}
          </p>
        </div>
        <div className="absolute bottom-0 right-0 p-8 opacity-10 rotate-12 translate-x-4 translate-y-4">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-oat/30 p-12 text-cocoa text-center border-4 border-double border-white/40">
      <p className="text-[10px] uppercase tracking-[0.4em] text-rosewood/40 mb-6">Closing</p>
      <h3 className="font-serif text-3xl mb-4 italic opacity-80">{page.title}</h3>
      {page.body ? <p className="text-sm text-rosewood/60 leading-7 font-light">{page.body}</p> : null}
      <div className="mt-12 flex h-12 w-12 items-center justify-center rounded-full border border-rosewood/10 bg-white/50 text-rosewood text-xs italic">
        SG
      </div>
    </div>
  );
}

export function PreviewBook({ draft }: { draft: AlbumDraftDetail }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<"classic" | "acoustic" | "jazz">("classic");

  return (
    <div className="relative">
      {/* Mood Music Player (Floating) */}
      <div className="fixed bottom-8 right-8 z-40 animate-rise">
        <div className="paper-panel p-4 rounded-[24px] shadow-2xl flex items-center gap-4 bg-white/80 backdrop-blur-md">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-all",
              isPlaying ? "bg-coral text-white scale-110 shadow-lg shadow-coral/30" : "bg-rosewood/5 text-rosewood"
            )}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <div className="flex flex-col pr-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-rosewood/40 font-bold mb-1">Album Mood</p>
            <div className="flex gap-2">
              {(["classic", "acoustic", "jazz"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={cn(
                    "text-[10px] uppercase tracking-widest px-2 py-1 rounded-md transition-all",
                    mood === m ? "bg-rosewood text-white" : "text-rosewood/40 hover:bg-rosewood/5"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {isPlaying && (
            <div className="flex gap-1 items-end h-4 pr-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-coral rounded-full animate-bounce"
                  style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Magazine Horizontal Scroller */}
      <div className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-hide px-4 sm:px-0">
        {draft.generatedPages.map((page, index) => (
          <div
            key={`${page.pageNumber}-${page.type}`}
            className="flex-none w-full max-w-[840px] snap-center animate-rise"
            style={{ animationDelay: `${Math.min(index * 100, 400)}ms` }}
          >
            <div className="mb-4 flex items-center justify-between px-4 text-[10px] uppercase tracking-[0.3em] text-rosewood/40 font-bold">
              <span>
                Plate {String(page.pageNumber).padStart(2, "0")}
              </span>
              <span>{page.type}</span>
            </div>
            <div className="paper-panel page-grid min-h-[520px] rounded-[24px] p-2 shadow-2xl relative group overflow-hidden border-none">
              {/* Spine shadow for book feeling */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent z-10 pointer-events-none" />
              <div className="relative h-full w-full bg-white rounded-[18px] overflow-hidden">
                {renderPageContent(page)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Navigator Help */}
      <div className="hidden lg:flex absolute -bottom-4 left-1/2 -translate-x-1/2 items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-rosewood/40">
        <span>← Scroll to flip</span>
        <div className="h-px w-12 bg-rosewood/10" />
        <span>{draft.generatedPages.length} Pages</span>
      </div>

      {/* Side Info Panel */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Panel className="lg:col-span-2 bg-white/40 border-none backdrop-blur-sm p-10 rounded-[34px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-coral font-bold mb-2">Album Info</p>
              <h2 className="font-serif text-4xl text-cocoa">{draft.title}</h2>
              <p className="mt-4 text-sm text-rosewood/60 leading-7 max-w-lg">{draft.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-full bg-white/60 text-[10px] uppercase tracking-widest text-rosewood border border-rosewood/5">
                {labelForAnniversaryType(draft.anniversaryType)}
              </div>
              <div className="px-4 py-2 rounded-full bg-white/60 text-[10px] uppercase tracking-widest text-rosewood border border-rosewood/5">
                {formatDate(draft.anniversaryDate)}
              </div>
            </div>
          </div>
        </Panel>
        
        <div className="bg-cocoa p-10 rounded-[34px] text-white flex flex-col justify-between shadow-2xl">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold mb-4">Summary</p>
            <p className="text-sm leading-relaxed opacity-80">
              {draft.couple.senderName}님이 {draft.couple.receiverName}님을 위해 준비한 총 {draft.moments.length}장의 추억이 담긴 앨범입니다.
            </p>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-[10px] uppercase tracking-widest text-coral font-bold italic">Editorial Selection Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewBookSkeleton() {
  return (
    <div className="flex gap-8 overflow-hidden px-4 sm:px-0">
      {[1, 2].map((i) => (
        <div key={i} className="flex-none w-full max-w-[840px] animate-pulse">
          <div className="mb-4 h-3 w-24 rounded bg-rosewood/10" />
          <div className="min-h-[520px] rounded-[34px] bg-white/40 p-4 border border-rosewood/5" />
        </div>
      ))}
    </div>
  );
}

export function ModeBadge({ source }: { source: "api" | "mock" }) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.28em] font-bold shadow-sm",
        source === "api"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {source === "api" ? "Pro Pipeline" : "Preview Mode"}
    </div>
  );
}
