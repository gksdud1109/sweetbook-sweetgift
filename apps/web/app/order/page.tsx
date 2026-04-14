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
import { cn } from "@/src/lib/utils";

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
        : { ...createInitialOrderFormState(draft.couple.receiverName), ...current }
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="grid gap-6 py-12">
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
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] py-8 lg:py-16 items-start">
      <div className="grid gap-10">
        <div className="flex items-end justify-between gap-4">
          <PageHero
            eyebrow="Gift Customization"
            title="마지막으로 선물의 디테일을 정해주세요."
            body="배송 정보와 함께 실제 제작될 앨범의 재질과 선물 포장 옵션을 선택합니다."
          />
          <ModeBadge source={source} />
        </div>
        
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        
        <form onSubmit={handleSubmit} className="grid gap-10">
          <section className="animate-rise [animation-delay:100ms]">
            <h3 className="text-xs uppercase tracking-[0.4em] text-rosewood/40 font-bold mb-6">01. Premium Options</h3>
            <div className="grid gap-6">
              <Panel className="p-8 border-none bg-white/60 backdrop-blur-sm">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-cocoa block mb-4">Paper Quality</label>
                    <div className="flex gap-2 p-1 bg-rosewood/5 rounded-xl w-fit">
                      {(["matte", "glossy"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setOrderForm(c => ({ ...c, packaging: opt }))}
                          className={cn(
                            "px-4 py-2 rounded-lg text-xs uppercase tracking-widest transition-all",
                            orderForm.packaging === opt ? "bg-white text-rosewood shadow-sm font-bold" : "text-rosewood/40 hover:text-rosewood/60"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-cocoa block mb-4">Ribbon Color</label>
                    <div className="flex gap-4">
                      {(["none", "red", "gold"] as const).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setOrderForm(c => ({ ...c, ribbon: color }))}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                            orderForm.ribbon === color ? "border-coral scale-110 shadow-lg shadow-coral/20" : "border-transparent"
                          )}
                        >
                          <div className={cn(
                            "h-5 w-5 rounded-full",
                            color === "none" && "bg-slate-100 border border-slate-200 relative overflow-hidden",
                            color === "red" && "bg-red-500",
                            color === "gold" && "bg-amber-400"
                          )}>
                            {color === "none" && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-6 bg-red-400 rotate-45" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-rosewood/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-cocoa">Add Gift Card</p>
                    <p className="text-[10px] text-rosewood/40 uppercase tracking-widest mt-1">+ ₩2,000</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderForm(c => ({ ...c, giftCard: !c.giftCard }))}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      orderForm.giftCard ? "bg-coral" : "bg-rosewood/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all",
                      orderForm.giftCard && "translate-x-6"
                    )} />
                  </button>
                </div>
              </Panel>
            </div>
          </section>

          <section className="animate-rise [animation-delay:200ms]">
            <h3 className="text-xs uppercase tracking-[0.4em] text-rosewood/40 font-bold mb-6">02. Delivery Info</h3>
            <Panel className="p-10 border-none bg-white shadow-2xl rounded-[40px]">
              <div className="grid gap-6">
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
                <div className="grid gap-6 sm:grid-cols-[1fr_120px]">
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
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-12">
                <ButtonLink href="/preview" variant="ghost">
                  수정하러 가기
                </ButtonLink>
                <Button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-cocoa text-white hover:bg-rosewood transition-all">
                  {isSubmitting ? "처리 중..." : "주문 완료 및 결제"}
                </Button>
              </div>
            </Panel>
          </section>
        </form>
      </div>

      <aside className="lg:sticky lg:top-24 animate-rise [animation-delay:300ms]">
        <Panel className="p-10 rounded-[40px] bg-cocoa text-white border-none shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
          
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold mb-6">Price Summary</p>
          <h2 className="font-serif text-3xl mb-8">{draft?.title ?? "Anniversary Album"}</h2>
          
          <dl className="grid gap-4 text-sm mb-10">
            <div className="flex justify-between opacity-60">
              <dt>기본 제작비</dt>
              <dd>₩35,000</dd>
            </div>
            <div className="flex justify-between opacity-60">
              <dt>페이지 추가 (8p)</dt>
              <dd>₩0 (무료)</dd>
            </div>
            {orderForm.giftCard && (
              <div className="flex justify-between text-coral font-bold">
                <dt>기프트 카드</dt>
                <dd>+ ₩2,000</dd>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between text-xl font-bold">
              <dt>최종 금액</dt>
              <dd>₩{orderForm.giftCard ? "37,000" : "35,000"}</dd>
            </div>
          </dl>

          <div className="bg-white/5 p-6 rounded-[24px]">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 font-bold">Order Summary</p>
            <ul className="text-xs space-y-2 opacity-70 leading-relaxed">
              <li>• {orderForm.packaging === "matte" ? "고급 무광 용지" : "선명한 유광 용지"}</li>
              <li>• {orderForm.ribbon === "none" ? "포장 없음" : `${orderForm.ribbon === "red" ? "클래식 레드" : "프리미엄 골드"} 리본 포장`}</li>
              <li>• SweetBook 정식 인쇄 서비스 연동</li>
            </ul>
          </div>
        </Panel>
      </aside>
    </div>
  );
}
