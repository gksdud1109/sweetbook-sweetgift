"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import type { Decoration } from "@/src/lib/album-flow";
import { cn } from "@/src/lib/utils";
import { Button } from "./ui";

interface DecorationEditorProps {
  decorations: Decoration[];
  onChange: (decorations: Decoration[]) => void;
  onReplaceImage?: () => void;
  children: ReactNode;
}

const DECORATION_SAFE_EDGE = 8;
const DECORATION_FONT_SIZE_PX = 40;
const DECORATION_SAFE_PADDING_PX = 18;

function getSafePercentBySize(size: number, scale: number) {
  if (!size) {
    return DECORATION_SAFE_EDGE;
  }

  const paddingPx = (DECORATION_FONT_SIZE_PX * scale) / 2 + DECORATION_SAFE_PADDING_PX;
  return Math.min(24, Math.max(DECORATION_SAFE_EDGE, (paddingPx / size) * 100));
}

function clampDecorationBySize(value: number, size: number, scale: number) {
  const safePercent = getSafePercentBySize(size, scale);
  return Math.max(safePercent, Math.min(100 - safePercent, value));
}

const EMOJI_CATEGORIES = [
  { label: "Emotion", emojis: ["❤️", "💖", "✨", "🌸", "🦋", "💌", "💝", "🥰", "💍", "🫂"] },
  { label: "Celebrate", emojis: ["🎉", "🎁", "🎈", "🌟", "🎂", "🥂", "🎬", "📸", "🎵", "🏆"] },
  { label: "Nature", emojis: ["☁️", "🌙", "☀️", "🍀", "🍃", "🌊", "❄️", "🍓", "🧸", "🏡"] },
  { label: "Design", emojis: ["〰️", "➰", "📍", "📌", "🎨", "✍️", "📜", "📐", "📎", "💎"] }
];

export function DecorationEditor({
  decorations,
  onChange,
  onReplaceImage,
  children,
}: DecorationEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveMenu] = useState<number>(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  function triggerImageReplace() {
    if (onReplaceImage) {
      onReplaceImage();
      return;
    }

    const fileInput = containerRef.current?.querySelector<HTMLInputElement>(
      "input[type='file']",
    );
    fileInput?.click();
  }

  function handleAddEmoji(emoji: string) {
    const newDecoration: Decoration = {
      id: `deco_${Math.random().toString(36).slice(2, 9)}`,
      type: "emoji",
      value: emoji,
      x: 50,
      y: 50,
      scale: 1.5,
      rotate: Math.random() * 20 - 10,
    };
    onChange([...decorations, newDecoration]);
  }

  function handleRemoveDecoration(id: string) {
    onChange(decorations.filter((d) => d.id !== id));
  }

  useEffect(() => {
    if (!draggingId) return;

    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current || !draggingId) return;

      const rect = containerRef.current.getBoundingClientRect();
      const activeDecoration = decorations.find((decoration) => decoration.id === draggingId);
      const scale = activeDecoration?.scale ?? 1.5;
      const x = clampDecorationBySize(
        ((e.clientX - rect.left) / rect.width) * 100,
        rect.width,
        scale,
      );
      const y = clampDecorationBySize(
        ((e.clientY - rect.top) / rect.height) * 100,
        rect.height,
        scale,
      );

      onChange(decorations.map(d => d.id === draggingId ? { ...d, x, y } : d));
    }

    function handleMouseUp() {
      setDraggingId(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, decorations, onChange]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const renderedDecorations = useMemo(
    () =>
      decorations.map((decoration) => ({
        ...decoration,
        renderX: clampDecorationBySize(
          decoration.x,
          containerSize.width,
          decoration.scale,
        ),
        renderY: clampDecorationBySize(
          decoration.y,
          containerSize.height,
          decoration.scale,
        ),
      })),
    [containerSize.height, containerSize.width, decorations],
  );

  function shouldBypassContainerClick(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(
      target.closest(
        "button, input, textarea, select, label, a, [data-ignore-decoration-toggle='true']",
      ),
    );
  }

  return (
    <div className="relative group/decor" onClick={(e) => e.stopPropagation()}>
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-visible rounded-[28px] transition-all duration-500 touch-none",
          isEditMode ? "ring-4 ring-brand-primary/30 scale-[1.02] z-30 shadow-liquid" : "hover:shadow-liquid cursor-pointer"
        )}
        onClick={(e) => {
          if (shouldBypassContainerClick(e.target)) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          if (!isEditMode) setShowMenu(!showMenu);
        }}
      >
        {children}

        {/* Render Stickers */}
        <div className="pointer-events-none absolute inset-[-20px] z-20">
          {renderedDecorations.map((deco) => (
            <div
              key={deco.id}
              className={cn(
                "sticker-item pointer-events-auto absolute select-none transition-transform duration-75",
                isEditMode ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
                draggingId === deco.id && "scale-150 z-50 opacity-80"
              )}
              style={{
                left: `${deco.renderX}%`,
                top: `${deco.renderY}%`,
                transform: `translate(-50%, -50%) rotate(${deco.rotate}deg) scale(${deco.scale})`,
                fontSize: "2.5rem",
                zIndex: 12,
                textShadow: "0 10px 20px rgba(15, 23, 42, 0.18)",
              }}
              onMouseDown={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
                e.stopPropagation();
                setDraggingId(deco.id);
              }}
            >
              {deco.value}
              {isEditMode ? (
                <button
                  type="button"
                  aria-label="데코 삭제"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-sm text-white shadow-lg transition hover:bg-brand-primary"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveDecoration(deco.id);
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Initial Over Menu */}
        {showMenu && !isEditMode && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col gap-3 p-4" onClick={(e) => e.stopPropagation()}>
              <Button 
                type="button"
                variant="primary" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditMode(true);
                  setShowMenu(false);
                }}
                className="bg-brand-primary hover:bg-brand-primary/90 shadow-xl min-w-[160px] rounded-2xl"
              >
                데코 편집하기
              </Button>
              <Button 
                type="button"
                variant="secondary" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerImageReplace();
                  setShowMenu(false);
                }}
                className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30 min-w-[160px] rounded-2xl"
              >
                사진 교체하기
              </Button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); }}
                className="text-white/60 text-[11px] mt-4 hover:text-white font-black uppercase tracking-[0.2em]"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Mode Toolbar */}
      {isEditMode && (
        <div className="mt-5 rounded-[32px] border border-brand-primary/10 bg-white/90 p-6 shadow-liquid animate-rise backdrop-blur-2xl sm:rounded-[40px] sm:p-8" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg animate-pulse">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-black text-brand-dark uppercase tracking-tight">Deco Studio</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Personalize your memory</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditMode(false); }}
              className="px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-liquid bg-brand-dark hover:bg-brand-primary transition-all"
            >
              Finish
            </Button>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveMenu(i); }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === i ? "bg-brand-primary text-white shadow-md scale-105" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 sm:gap-4 lg:grid-cols-10">
            {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAddEmoji(emoji); }}
                className="group rounded-[20px] border border-slate-50 bg-white p-3 text-3xl shadow-sm transition-transform hover:scale-125 hover:border-brand-primary/20 hover:shadow-xl sm:rounded-[24px] sm:p-4 sm:text-4xl"
              >
                <span className="group-active:scale-90 transition-transform block">{emoji}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-ping" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Drag to arrange • Use x to remove
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
