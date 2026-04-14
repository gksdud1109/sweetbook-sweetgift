"use client";

import { useRef, useState } from "react";
import { cn, extractDateFromFile } from "@/src/lib/utils";
import { uploadFile } from "@/src/lib/api-client";
import type { EditableMoment } from "@/src/lib/album-flow";

interface SmartDropzoneProps {
  onMomentsAdded: (moments: EditableMoment[]) => void;
  maxCount: number;
}

const POETIC_CAPTIONS = [
  "함께라서 더욱 선명했던 하루",
  "다시 돌아가고 싶은 따뜻한 오후",
  "우리의 이야기가 시작된 순간",
  "어떤 말로도 부족한 우리의 온도",
  "오래도록 기억하고 싶은 풍경",
  "너와 함께 걷던 그 밤의 공기",
  "특별할 것 없는 일상이 선물 같았던 날",
  "웃음이 끊이지 않았던 우리만의 여행"
];

export function SmartDropzone({ onMomentsAdded, maxCount }: SmartDropzoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    const newMoments: EditableMoment[] = [];
    const filesArray = Array.from(files).slice(0, maxCount);

    for (const file of filesArray) {
      try {
        const photoUrl = await uploadFile(file);
        const date = extractDateFromFile(file);
        const randomCaption = POETIC_CAPTIONS[Math.floor(Math.random() * POETIC_CAPTIONS.length)];
        
        newMoments.push({
          id: `smart_${Math.random().toString(36).slice(2, 9)}`,
          date,
          title: "새로운 추억",
          body: randomCaption,
          photoUrl
        });
      } catch (err) {
        console.error("Upload failed for file:", file.name, err);
      }
    }

    if (newMoments.length > 0) {
      onMomentsAdded(newMoments);
    }
    setIsProcessing(false);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        processFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative flex min-h-[180px] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[34px] border-2 border-dashed border-rosewood/15 bg-white/40 px-6 py-10 transition-all hover:border-coral hover:bg-white/80 cursor-pointer",
        isOver && "border-coral bg-white scale-[1.01] shadow-xl shadow-coral/5",
        isProcessing && "pointer-events-none opacity-80"
      )}
    >
      <input
        type="file"
        ref={inputRef}
        multiple
        className="hidden"
        accept="image/*"
        onChange={(e) => processFiles(e.target.files)}
      />

      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full bg-rosewood/5 text-rosewood/50 transition-transform group-hover:scale-110",
        isOver && "bg-coral/10 text-coral"
      )}>
        {isProcessing ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />
        ) : (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </div>

      <div className="text-center">
        <h3 className="font-medium text-cocoa">사진 여러 장을 한 번에 던져보세요</h3>
        <p className="mt-2 text-sm text-rosewood/60 leading-6">
          {isProcessing ? "추억들을 멋지게 앨범으로 구성 중입니다..." : "사진 메타데이터를 분석해 날짜와 제목을 자동으로 채워드릴게요."}
        </p>
      </div>

      {isOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-coral/5 backdrop-blur-[2px]">
          <p className="text-lg font-serif text-coral">여기에 놓으세요 ✨</p>
        </div>
      )}
    </div>
  );
}
