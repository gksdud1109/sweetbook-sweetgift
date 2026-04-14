"use client";

import { useState } from "react";
import type { Decoration } from "@/src/lib/album-flow";
import { cn } from "@/src/lib/utils";

interface DecorationEditorProps {
  decorations: Decoration[];
  onChange: (decorations: Decoration[]) => void;
  children: React.ReactNode;
}

const EMOJI_PALETTE = ["❤️", "✨", "🌸", "📸", "🎁", "💌", "🌟", "☁️", "🐻", "🎈"];

export function DecorationEditor({
  decorations,
  onChange,
  children,
}: DecorationEditorProps) {
  const [activeMenu, setActiveMenu] = useState<{ x: number; y: number } | null>(null);

  function handleContainerClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only open menu if clicking the container itself or the image (not existing stickers)
    if ((e.target as HTMLElement).closest(".sticker-item")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setActiveMenu({ x, y });
  }

  function addEmoji(emoji: string) {
    if (!activeMenu) return;

    const newDecoration: Decoration = {
      id: `deco_${Math.random().toString(36).slice(2, 9)}`,
      type: "emoji",
      value: emoji,
      x: activeMenu.x,
      y: activeMenu.y,
      scale: 1,
      rotate: Math.random() * 20 - 10, // Random tilt for Dakku vibe
    };

    onChange([...decorations, newDecoration]);
    setActiveMenu(null);
  }

  function removeDecoration(id: string) {
    onChange(decorations.filter((d) => d.id !== id));
  }

  return (
    <div className="relative group/deco">
      <div 
        className="relative cursor-crosshair overflow-hidden rounded-[24px]"
        onClick={handleContainerClick}
      >
        {children}
        
        {/* Render Existing Decorations */}
        {decorations.map((deco) => (
          <div
            key={deco.id}
            className="sticker-item absolute cursor-pointer transition-transform hover:scale-125 hover:z-20"
            style={{
              left: `${deco.x}%`,
              top: `${deco.y}%`,
              transform: `translate(-50%, -50%) rotate(${deco.rotate}deg) scale(${deco.scale})`,
              fontSize: "2rem",
              userSelect: "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
              removeDecoration(deco.id);
            }}
            title="클릭하여 삭제"
          >
            {deco.value}
          </div>
        ))}

        {/* Emoji Palette Popover */}
        {activeMenu && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} 
            />
            <div 
              className="absolute z-40 bg-white/90 backdrop-blur-md shadow-2xl p-3 rounded-2xl grid grid-cols-5 gap-2 animate-rise"
              style={{
                left: `${Math.min(activeMenu.x, 80)}%`,
                top: `${Math.min(activeMenu.y, 80)}%`,
                transform: "translate(-20%, -110%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Help Hint */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-rosewood/40 uppercase tracking-widest font-bold">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rosewood/10 italic">!</span>
        사진 위를 클릭해 감성 스티커를 붙여보세요 (클릭 시 삭제)
      </div>
    </div>
  );
}
