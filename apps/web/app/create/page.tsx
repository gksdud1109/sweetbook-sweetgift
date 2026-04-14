"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { createAlbumDraft } from "@/src/lib/api-client";
import {
  addBlankMoment,
  removeMoment,
  toDraftRequest,
} from "@/src/lib/album-flow";
import { useAlbumFlow } from "@/src/providers/album-flow-provider";
import { labelForAnniversaryType } from "@/src/lib/utils";
import { MomentEditor } from "@/src/components/moment-editor";
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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = toDraftRequest(form);
      const result = await createAlbumDraft(payload);
      setDraft(result.data, result.source);
      startTransition(() => {
        router.push(`/preview?draftId=${result.data.draftId}`);
      });
    } catch (submitError) {
      if (submitError instanceof ZodError) {
        setError(submitError.issues[0]?.message ?? "입력값을 확인해 주세요.");
      } else if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("앨범 초안을 만드는 중 문제가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow="Create Album"
        title="기념일의 핵심 장면만 입력하면, 선물로 보여줄 수 있는 앨범 미리보기가 만들어집니다."
        body="anniversary, names, title, letter, moments만 입력합니다. 사진은 로컬 더미 URL로도 충분하고, 백엔드가 준비되기 전까지는 같은 계약으로 mock fallback이 동작합니다."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                loadSample();
                setError(null);
              }}
            >
              더미 데이터 불러오기
            </Button>
              <ButtonLink href="/" variant="ghost">
                랜딩으로 돌아가기
              </ButtonLink>
          </>
        }
      />

      {source === "mock" ? (
        <StatusBanner>
          현재 앱은 mock fallback을 기본값으로 유지합니다. `NEXT_PUBLIC_API_BASE_URL`이 연결되면 같은 계약으로 실제 API를 우선 호출합니다.
        </StatusBanner>
      ) : null}

      {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}

      <form onSubmit={handleSubmit} className="grid gap-6">
        <Panel>
          <div className="grid gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-rosewood/60">
                Anniversary
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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    anniversaryDate: event.target.value,
                  }))
                }
              />
              <InputField
                label="표지 사진 URL"
                placeholder="/dummy/photos/cover.svg"
                value={form.coverPhotoUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    coverPhotoUrl: event.target.value,
                  }))
                }
              />
              <InputField
                label="보내는 사람 이름"
                value={form.senderName}
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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subtitle: event.target.value,
                  }))
                }
              />
              <TextareaField
                label="편지"
                className="md:col-span-2"
                hint="1-2000자"
                value={form.letter}
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
            <p className="font-serifDisplay text-3xl text-cocoa">Moments</p>
            <p className="mt-2 text-sm text-rosewood/75">
              최소 3개, 최대 8개의 추억을 넣을 수 있습니다.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setForm((current) => addBlankMoment(current))}
            disabled={form.moments.length >= 8}
          >
            추억 추가
          </Button>
        </div>

        <div className="grid gap-5">
          {form.moments.map((moment, index) => (
            <MomentEditor
              key={moment.id}
              index={index}
              moment={moment}
              canRemove={form.moments.length > 3}
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
            현재 미리보기 보기
          </ButtonLink>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "앨범 초안 생성 중..." : "미리보기 만들기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
