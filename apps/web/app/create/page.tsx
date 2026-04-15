"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { createAlbumDraft } from "@/src/lib/api-client";
import {
  addBlankMoment,
  addQuickMoments,
  removeMoment,
  toDraftRequest,
} from "@/src/lib/album-flow";
import { useAlbumFlow } from "@/src/providers/album-flow-provider";
import { MomentEditor } from "@/src/components/moment-editor";
import { ImageUpload } from "@/src/components/image-upload";
import { SmartDropzone } from "@/src/components/smart-dropzone";
import { DecorationEditor } from "@/src/components/decoration-editor";
import {
  Button,
  ButtonLink,
  InputField,
  PageHero,
  Panel,
  StatusBanner,
  StepPill,
  TextareaField,
} from "@/src/components/ui";

const anniversaryOptions = [
  { key: "100days", label: "100일", type: "100days" as const },
  { key: "200days", label: "200일", type: "200days" as const },
  { key: "300days", label: "300일", type: "custom" as const },
  { key: "500days", label: "500일", type: "custom" as const },
  { key: "1year", label: "1주년", type: "1year" as const },
  { key: "2years", label: "2주년", type: "custom" as const },
  { key: "3years", label: "3주년", type: "custom" as const },
  { key: "first-trip", label: "첫 여행", type: "custom" as const },
  { key: "proposal", label: "프로포즈", type: "custom" as const },
  { key: "custom", label: "직접 입력", type: "custom" as const },
] as const;

export default function CreatePage() {
  const router = useRouter();
  const { form, setForm, setDraft, loadSample } = useAlbumFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openCoverPicker, setOpenCoverPicker] = useState<(() => void) | null>(null);
  const handleCoverPickerReady = useCallback((picker: () => void) => {
    setOpenCoverPicker(() => picker);
  }, []);

  useEffect(() => {
    if (!errorBanner) {
      return;
    }

    setToastMessage(errorBanner);
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [errorBanner]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setErrorBanner(null);

    if (form.anniversaryType === "custom" && !form.anniversaryLabel.trim()) {
      setIsSubmitting(false);
      setErrorBanner("직접 정의하는 기념일 이름을 입력해 주세요.");
      return;
    }

    try {
      const payload = toDraftRequest(form);
      const result = await createAlbumDraft(payload);
      setDraft(result.data, result.source);
      startTransition(() => {
        router.push(`/preview?draftId=${result.data.draftId}`);
      });
    } catch (submitError) {
      if (submitError instanceof ZodError) {
        const fieldErrors: Record<string, any> = {};
        submitError.issues.forEach((issue) => {
          const path = issue.path;
          let current = fieldErrors;
          for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            current[key] = current[key] || {};
            current = current[key];
          }
          current[path[path.length - 1]] = issue.message;
        });
        setErrors(fieldErrors);
        setErrorBanner(
          submitError.issues[0]?.message ?? "입력한 내용을 다시 확인해 주세요.",
        );
      } else if (submitError instanceof Error) {
        setErrorBanner(submitError.message);
      } else {
        setErrorBanner("앨범 초안을 생성하는 중 문제가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <PageHero
          eyebrow="Creation Workspace"
          title="추억을 빚어내는 공간."
          body="기념일의 정보와 사진을 담아주세요. AI가 날짜를 분석하고 가장 아름다운 레이아웃을 제안합니다."
        />
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              loadSample();
              setErrors({});
              setErrorBanner(null);
            }}
            className="rounded-2xl border-slate-200 text-slate-500 hover:bg-white/60 backdrop-blur-sm"
          >
            샘플 데이터 로드
          </Button>
          <ButtonLink href="/" variant="ghost" className="text-slate-400">
            취소
          </ButtonLink>
        </div>
      </div>

      {toastMessage ? (
        <div className="pointer-events-none fixed right-6 top-24 z-50 max-w-sm animate-rise">
          <StatusBanner
            tone="error"
            className="rounded-2xl border-red-200/90 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur"
          >
            {toastMessage}
          </StatusBanner>
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="grid gap-12">
        <Panel className="p-10 rounded-[48px] bg-white/40 backdrop-blur-xl border-none shadow-glass">
          <div className="grid gap-10">
            <section>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-6">
                01. Context Settings
              </p>
              <div className="flex flex-wrap gap-3">
                {anniversaryOptions.map((option) => (
                  <StepPill
                    key={option.key}
                    active={
                      option.type === "custom"
                        ? form.anniversaryType === "custom" &&
                          form.anniversaryLabel === option.label
                        : form.anniversaryType === option.type
                    }
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        anniversaryType: option.type,
                        anniversaryLabel:
                          option.key === "custom" ? current.anniversaryLabel : option.label,
                      }))
                    }
                    className={
                      (option.type === "custom"
                        ? form.anniversaryType === "custom" &&
                          form.anniversaryLabel === option.label
                        : form.anniversaryType === option.type)
                        ? "bg-brand-primary text-white border-brand-primary shadow-lg scale-105"
                        : ""
                    }
                  >
                    {option.label}
                  </StepPill>
                ))}
              </div>
              {form.anniversaryType === "custom" ? (
                <div className="mt-5 max-w-md">
                  <InputField
                    label="직접 정의하는 기념일"
                    placeholder="예: 300일, 첫 여행, 우리의 시작"
                    value={form.anniversaryLabel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        anniversaryLabel: event.target.value,
                      }))
                    }
                    className="rounded-2xl border-slate-100"
                  />
                </div>
              ) : null}
            </section>

            <div className="grid gap-10 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.82fr)] xl:items-start">
              <div className="grid gap-8">
                <div className="grid gap-6 rounded-[32px] border border-white/60 bg-white/55 p-6 shadow-sm md:grid-cols-2 2xl:grid-cols-5">
                  <InputField
                    label="기념일 날짜"
                    type="date"
                    value={form.anniversaryDate}
                    error={errors.anniversaryDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        anniversaryDate: event.target.value,
                      }))
                    }
                    className="rounded-2xl border-slate-100 focus:border-brand-primary"
                  />
                  <InputField
                    label="보내는 이"
                    value={form.senderName}
                    error={errors.couple?.senderName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        senderName: event.target.value,
                      }))
                    }
                    className="rounded-2xl border-slate-100"
                  />
                  <InputField
                    label="받는 이"
                    value={form.receiverName}
                    error={errors.couple?.receiverName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        receiverName: event.target.value,
                      }))
                    }
                    className="rounded-2xl border-slate-100"
                  />
                  <InputField
                    label="앨범 타이틀"
                    className="rounded-2xl border-slate-100"
                    placeholder="우리의 열두 달"
                    value={form.title}
                    error={errors.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                  <InputField
                    label="서브 타이틀"
                    className="rounded-2xl border-slate-100 md:col-span-2 2xl:col-span-1"
                    placeholder="가장 찬란했던 계절의 기록"
                    value={form.subtitle}
                    error={errors.subtitle}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subtitle: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="rounded-[32px] border border-white/60 bg-white/55 p-6 shadow-sm">
                  <TextareaField
                    label="마음을 전하는 편지"
                    className="min-h-[220px] rounded-[28px] border-slate-100"
                    placeholder="여기에 당신의 진심을 담아주세요."
                    value={form.letter}
                    error={errors.letter}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        letter: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:sticky lg:top-24">
                <div className="px-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.34em] text-brand-primary/50">
                    Cover Preview
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    앨범을 대표할 표지 이미지를 선택하고, 필요하면 데코레이션으로 포인트를 더해보세요.
                  </p>
                </div>
                <DecorationEditor
                  decorations={form.coverDecorations || []}
                  onChange={(coverDecorations) => setForm(c => ({ ...c, coverDecorations }))}
                  onReplaceImage={() => openCoverPicker?.()}
                >
                  <ImageUpload
                    label="앨범 메인 표지"
                    value={form.coverPhotoUrl}
                    error={errors.coverPhotoUrl}
                    onChange={(url) =>
                      setForm((current) => ({
                        ...current,
                        coverPhotoUrl: url,
                      }))
                    }
                    className="rounded-[32px] overflow-visible border-2 border-dashed border-slate-200 bg-white/70"
                    onFilePickerReady={handleCoverPickerReady}
                  />
                </DecorationEditor>
              </div>
            </div>
          </div>
        </Panel>

        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-2">02. Story Boards</p>
              <h3 className="font-serif text-3xl text-brand-dark italic">Moments</h3>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setForm((current) => addQuickMoments(current));
                  setErrors({});
                  setErrorBanner(null);
                }}
                disabled={form.moments.length >= 8}
                className="rounded-xl border-slate-100 text-slate-400"
              >
                빠른 생성
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setForm((current) => addBlankMoment(current))}
                disabled={form.moments.length >= 8}
                className="bg-brand-primary shadow-lg rounded-xl"
              >
                추억 추가
              </Button>
            </div>
          </div>

          <SmartDropzone
            maxCount={8 - form.moments.length}
            onMomentsAdded={(newMoments) => {
              setForm((current) => ({
                ...current,
                moments: [...current.moments, ...newMoments].slice(0, 8),
              }));
              setErrors({});
            }}
          />

          <div className="grid gap-10 mt-10">
            {form.moments.map((moment, index) => (
              <MomentEditor
                key={moment.id}
                index={index}
                moment={moment}
                canRemove={form.moments.length > 1}
                errors={errors.moments?.[index]}
                onRemove={() =>
                  setForm((current) => removeMoment(current, moment.id))
                }
                onChange={(patch) =>
                  setForm((current) => ({
                    ...current,
                    moments: current.moments.map((item) =>
                      item.id === moment.id ? { ...item, ...patch } : item,
                    ),
                  }))
                }
              />
            ))}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-5 pt-12 border-t border-slate-100">
          <ButtonLink href="/preview" variant="ghost" className="text-slate-400">
            마지막 미리보기 보기
          </ButtonLink>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-12 py-5 bg-brand-dark text-white rounded-2xl shadow-liquid hover:bg-brand-primary transition-all scale-105 active:scale-95 text-base font-bold"
          >
            {isSubmitting ? "초안 생성 중..." : "미리보기 만들기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
