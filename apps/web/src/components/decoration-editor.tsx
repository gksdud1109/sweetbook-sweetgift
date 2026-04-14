"use client";

import { useState, useRef, useEffect } from "react";
import type { Decoration } from "@/src/lib/album-flow";
import { cn } from "@/src/lib/utils";
import { Button } from "./ui";

interface DecorationEditorProps {
  decorations: Decoration[];
  onChange: (decorations: Decoration[]) => void;
  onReplaceImage?: () => void;
  children: React.ReactNode;
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 드래그 로직 핸들러
  useEffect(() => {
    if (!draggingId) return;

    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current || !draggingId) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

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

  return (
    <div className="relative group/decor" onClick={(e) => e.stopPropagation()}>
      <div 
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-[28px] transition-all duration-500 touch-none",
          isEditMode ? "ring-4 ring-brand-primary/30 scale-[1.02] z-30 shadow-liquid" : "hover:shadow-liquid cursor-pointer"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isEditMode) setShowMenu(!showMenu);
        }}
      >
        {children}
        
        {/* Render Stickers */}
        {decorations.map((deco) => (
          <div
            key={deco.id}
            className={cn(
              "sticker-item absolute select-none transition-transform duration-75",
              isEditMode ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
              draggingId === deco.id && "scale-150 z-50 opacity-80"
            )}
            style={{
              left: `${deco.x}%`,
              top: `${deco.y}%`,
              transform: `translate(-50%, -50%) rotate(${deco.rotate}deg) scale(${deco.scale})`,
              fontSize: "2.5rem",
            }}
            onMouseDown={(e) => {
              if (!isEditMode) return;
              e.preventDefault();
              e.stopPropagation();
              setDraggingId(deco.id);
            }}
            onClick={(e) => {
              if (!isEditMode) return;
              e.preventDefault();
              e.stopPropagation();
              // 드래그가 아닐 때만 삭제 (단순 클릭)
              if (!draggingId) handleRemoveDecoration(deco.id);
            }}
          >
            {deco.value}
          </div>
        ))}

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
                  onReplaceImage?.(); 
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
        <div className="mt-6 p-8 bg-white/90 backdrop-blur-2xl rounded-[40px] border border-brand-primary/10 shadow-liquid animate-rise" onClick={(e) => e.stopPropagation()}>
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

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
            {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAddEmoji(emoji); }}
                className="text-4xl hover:scale-125 transition-transform p-4 bg-white rounded-[24px] shadow-sm border border-slate-50 hover:border-brand-primary/20 hover:shadow-xl group"
              >
                <span className="group-active:scale-90 transition-transform block">{emoji}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-400">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-ping" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Drag to arrange • Click to remove
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
