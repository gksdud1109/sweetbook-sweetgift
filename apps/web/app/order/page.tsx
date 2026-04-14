"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/src/lib/api-client";
import {
  createInitialOrderFormState,
  toOrderRequest,
  type OrderFormState,
} from "@/src/lib/album-flow";
import { useAlbumFlow } from "@/src/providers/album-flow-provider";
import {
  Button,
  ButtonLink,
  InputField,
  PageHero,
  Panel,
  StatusBanner,
} from "@/src/components/ui";
import { ModeBadge } from "@/src/components/preview-book";

export default function OrderPage() {
  const router = useRouter();
  const { hydrated, book, draft, source, setOrder } = useAlbumFlow();
  const [orderForm, setOrderForm] = useState<OrderFormState>(
    createInitialOrderFormState(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) {
      return;
    }

    setOrderForm((current) =>
      current.name
        ? current
        : createInitialOrderFormState(draft.couple.receiverName),
    );
  }, [draft]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!book) {
      setError("먼저 책 생성 요청을 완료해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createOrder(toOrderRequest(book.bookId, orderForm));
      setOrder(result.data, result.source);
      startTransition(() => {
        router.push(`/completion?orderId=${result.data.orderId}`);
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "주문 생성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <Panel>
        <p className="text-sm text-rosewood/75">주문 화면을 준비 중입니다...</p>
      </Panel>
    );
  }

  if (!book) {
    return (
      <div className="grid gap-6">
        <PageHero
          eyebrow="Order Form"
          title="책 생성이 먼저 필요합니다."
          body="Preview 화면에서 `책 생성 요청`을 실행하면 Orders API 단계로 이어집니다."
          actions={
            <ButtonLink href="/preview">Preview로 이동</ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.98fr_0.82fr]">
      <div className="grid gap-6">
        <div className="flex items-end justify-between gap-4">
          <PageHero
            eyebrow="Order Form"
            title="배송 정보만 입력하면 앨범 주문이 완료됩니다."
            body="MVP 범위에서는 결제 없이 recipient 정보만 받아 `POST /api/v1/orders`를 호출합니다."
          />
          <ModeBadge source={source} />
        </div>
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <InputField
              label="수령인 이름"
              value={orderForm.name}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <InputField
              label="연락처"
              placeholder="010-0000-0000"
              value={orderForm.phone}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
            <InputField
              label="기본 주소"
              value={orderForm.address1}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  address1: event.target.value,
                }))
              }
            />
            <InputField
              label="상세 주소"
              value={orderForm.address2}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  address2: event.target.value,
                }))
              }
            />
            <InputField
              label="우편번호"
              value={orderForm.zipCode}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  zipCode: event.target.value,
                }))
              }
            />
            <div className="flex justify-end gap-3 pt-2">
              <ButtonLink href="/preview" variant="secondary">
                Preview로 돌아가기
              </ButtonLink>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "주문 생성 중..." : "주문 생성 요청"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
      <Panel className="h-fit">
        <p className="text-xs uppercase tracking-[0.3em] text-rosewood/60">
          Current Order Context
        </p>
        <h2 className="mt-3 font-serifDisplay text-3xl text-cocoa">
          {draft?.title ?? "기념일 앨범"}
        </h2>
        <dl className="mt-8 space-y-4 text-sm text-rosewood/80">
          <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
            <dt>draftId</dt>
            <dd>{book.draftId}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
            <dt>bookId</dt>
            <dd>{book.bookId}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-rosewood/10 pb-4">
            <dt>status</dt>
            <dd>{book.status}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
