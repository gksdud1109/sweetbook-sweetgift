/* eslint-disable @next/next/no-img-element */

"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/src/lib/api-client";
import { cn } from "@/src/lib/utils";
import { Button } from "./ui";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
  hint?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  className,
  hint,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);
    setError(null);

    try {
      const uploadedUrl = await uploadFile(file);
      onChange(uploadedUrl);
      // Once uploaded, we can clear the local preview and use the real URL
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
      // Keep local preview so user sees what they tried to upload
    } finally {
      setIsUploading(false);
    }
  }

  const displayUrl = previewUrl || value;

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex items-center justify-between text-sm text-cocoa">
        <span>{label}</span>
        {hint ? <span className="text-xs text-rosewood/60">{hint}</span> : null}
      </div>

      <div
        className={cn(
          "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-rosewood/15 bg-white/50 transition-colors hover:bg-white/80",
          displayUrl && "border-solid border-rosewood/10 bg-white",
          isUploading && "opacity-70",
        )}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-cocoa/20 opacity-0 transition-opacity hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                사진 교체
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="flex flex-col items-center gap-2 p-8 text-rosewood/60"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">사진을 선택하거나 끌어다 놓으세요</span>
            <span className="text-xs opacity-70">JPG, PNG, WebP (최대 5MB)</span>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />
              <p className="text-xs font-medium text-rosewood">업로드 중...</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
      />

      {/* Manual URL fallback (always available for flexibility) */}
      <div className="mt-1">
        <input
          type="text"
          placeholder="또는 이미지 URL 직접 입력"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-1 text-xs text-rosewood/50 outline-none focus:text-rosewood/80"
        />
      </div>
    </div>
  );
}

// Helper: Button size extension in ui.tsx would be better, but let's just add a small variant here if needed
function sizeStyles(size: "default" | "sm") {
  return size === "sm" ? "px-3 py-1.5 text-xs" : "";
}

// Decorator to Button for size support locally if not in ui.tsx
// (Actually we can just use className on Button from ui.tsx)
