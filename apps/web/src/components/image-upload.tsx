/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { uploadFile } from "@/src/lib/api-client";
import { cn } from "@/src/lib/utils";
import { Button } from "./ui";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
  hint?: string;
  error?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  className,
  hint,
  error: validationError,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedUrl = await uploadFile(file);
      onChange(uploadedUrl);
      if (localUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localUrl);
      }
      setPreviewUrl(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setIsUploading(false);
    }
  }

  const displayUrl = previewUrl || value;
  const activeError = uploadError || validationError;
  const hasImage = Boolean(displayUrl);

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex items-center justify-between text-sm text-cocoa">
        <span>{label}</span>
        <div className="flex items-center gap-3">
          {hint ? <span className="text-xs text-rosewood/60">{hint}</span> : null}
          <button
            type="button"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rosewood/55 transition hover:text-rosewood/80"
            onClick={() => setShowUrlInput((current) => !current)}
          >
            {showUrlInput ? "URL 닫기" : "URL fallback"}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-rosewood/15 bg-white/50 transition-colors hover:bg-white/80 focus-within:border-coral focus-within:bg-white",
          hasImage && "border-solid border-rosewood/10 bg-white",
          activeError && "border-red-300 bg-red-50/20",
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

      {activeError && <p className="px-1 text-xs text-red-500">{activeError}</p>}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
      />

      {showUrlInput || !hasImage ? (
        <div className="rounded-[18px] border border-rosewood/10 bg-white/70 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-rosewood/50">
            Direct URL
          </p>
          <input
            type="text"
            placeholder="또는 이미지 URL 직접 입력"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-sm text-rosewood/75 outline-none placeholder:text-rosewood/35 focus:text-rosewood"
          />
        </div>
      ) : null}
    </div>
  );
}
