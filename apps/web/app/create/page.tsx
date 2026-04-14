"use client";

import { startTransition, useState } from "react";
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
import { labelForAnniversaryType } from "@/src/lib/utils";
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

const anniversaryOptions = ["100days", "200days", "1year", "custom"] as const;

export default function CreatePage() {
  const router = useRouter();
  const { form, setForm, setDraft, loadSample, source } = useAlbumFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setErrorBanner(null);

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
        setErrorBanner("입력한 내용을 확인해 주세요.");
      } else if (submitError instanceof Error) {
        setErrorBanner(submitError.message);
      } else {
        setErrorBanner("앨범 초안을 만드는 중 문제가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow="Create Album"
        title="가장 중요한 사진 몇 장만 던져주세요. 나머지는 저희가 채워드릴게요."
        body="anniversary, names, title, letter만 정하고, 추억 사진들은 한 번에 드래그 앤 드롭하세요. 사진 속 날짜를 분석하고 어울리는 문구를 자동으로 추천해 드립니다."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                loadSample();
                setErrors({});
                setErrorBanner(null);
              }}
            >
              샘플 데이터로 채우기
            </Button>
              <ButtonLink href="/" variant="ghost">
                랜딩으로 돌아가기
              </ButtonLink>
          </>
        }
      />

      {source === "mock" ? (
        <StatusBanner>
          현재 앱은 mock fallback을 기본값으로 유지합니다. `NEXT_PUBLIC_API_BASE_URL`이 연결되면 실제 API를 우선 호출합니다.
        </StatusBanner>
      ) : null}

      {errorBanner ? <StatusBanner tone="error">{errorBanner}</StatusBanner> : null}

      <form onSubmit={handleSubmit} className="grid gap-6">
        <Panel>
          <div className="grid gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-rosewood/60">
                Anniversary Context
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {anniversaryOptions.map((option) => (
                  <StepPill
                    key={option}
                    active={form.anniversaryType === option}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        anniversaryType: option,
                      }))
                    }
                  >
                    {labelForAnniversaryType(option)}
                  </StepPill>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
              />
              
              <DecorationEditor
                decorations={form.coverDecorations || []}
                onChange={(coverDecorations) => setForm(c => ({ ...c, coverDecorations }))}
              >
                <ImageUpload
                  label="앨범 표지"
                  value={form.coverPhotoUrl}
                  error={errors.coverPhotoUrl}
                  onChange={(url) =>
                    setForm((current) => ({
                      ...current,
                      coverPhotoUrl: url,
                    }))
                  }
                  hint="파일 업로드 또는 URL 입력"
                />
              </DecorationEditor>

              <InputField
                label="보내는 사람 이름"
                value={form.senderName}
                error={errors.couple?.senderName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    senderName: event.target.value,
                  }))
                }
              />
              <InputField
                label="받는 사람 이름"
                value={form.receiverName}
                error={errors.couple?.receiverName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    receiverName: event.target.value,
                  }))
                }
              />
              <InputField
                label="앨범 제목"
                className="md:col-span-2"
                hint="1-40자"
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
                label="부제"
                className="md:col-span-2"
                hint="0-80자"
                value={form.subtitle}
                error={errors.subtitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subtitle: event.target.value,
                  }))
                }
              />
              <TextareaField
                label="진심을 담은 편지"
                className="md:col-span-2"
                hint="1-2000자"
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
        </Panel>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif text-3xl text-cocoa">Moments</p>
            <p className="mt-2 text-sm text-rosewood/75">
              사진을 던지거나 수동으로 추억을 입력할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm((current) => addQuickMoments(current));
                setErrors({});
                setErrorBanner(null);
              }}
              disabled={form.moments.length >= 8}
            >
              샘플 추가
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForm((current) => addBlankMoment(current))}
              disabled={form.moments.length >= 8}
            >
              수동 추가
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

        <div className="grid gap-5">
          {form.moments.map((moment, index) => (
            <MomentEditor
              key={moment.id}
              index={index}
              moment={moment}
              canRemove={form.moments.length > 3}
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

        <div className="flex flex-wrap justify-end gap-3">
          <ButtonLink href="/preview" variant="ghost">
            미리보기 보기
          </ButtonLink>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "앨범 초안 생성 중..." : "미리보기 만들기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
