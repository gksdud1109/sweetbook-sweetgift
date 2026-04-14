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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="grid gap-6 py-20 animate-rise">
        <PageHero
          eyebrow="Checkout Flow"
          title="작품 생성이 먼저 필요합니다."
          body="미리보기 화면에서 '실물 도서 제작하기'를 실행하면 주문 단계로 이어집니다."
          actions={
            <ButtonLink href="/preview" className="bg-brand-primary shadow-liquid rounded-2xl">미리보기로 이동</ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] py-12 items-start">
      <div className="grid gap-12">
        <div className="flex items-end justify-between gap-8">
          <PageHero
            eyebrow="Order Customization"
            title="마지막으로 디테일을 완성하세요."
            body="선물 포장 옵션과 배송 정보를 입력해주세요. 당신의 소중한 기록이 작품으로 탄생하는 마지막 과정입니다."
          />
          <ModeBadge source={source} />
        </div>
        
        {error ? <StatusBanner tone="error" className="rounded-2xl shadow-sm">{error}</StatusBanner> : null}
        
        <form onSubmit={handleSubmit} className="grid gap-12">
          {/* Packaging Options */}
          <section className="animate-rise [animation-delay:100ms]">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-8">01. Production Options</h3>
            <div className="paper-panel p-10 rounded-[48px] border-none shadow-glass">
              <div className="grid gap-10 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-brand-dark block mb-5">Paper Texture</label>
                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                    {(["matte", "glossy"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOrderForm(c => ({ ...c, packaging: opt }))}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          orderForm.packaging === opt ? "bg-white text-brand-primary shadow-lg scale-105" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-brand-dark block mb-5">Ribbon Selection</label>
                  <div className="flex gap-5">
                    {(["none", "red", "gold"] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setOrderForm(c => ({ ...c, ribbon: color }))}
                        className={cn(
                          "h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center",
                          orderForm.ribbon === color ? "border-brand-primary scale-110 shadow-liquid" : "border-transparent"
                        )}
                      >
                        <div className={cn(
                          "h-6 w-6 rounded-full shadow-inner",
                          color === "none" && "bg-slate-50 border border-slate-200 relative overflow-hidden",
                          color === "red" && "bg-rose-500",
                          color === "gold" && "bg-amber-400"
                        )}>
                          {color === "none" && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-rose-300 rotate-45" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-dark">Premium Gift Card</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">+ ₩2,000</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderForm(c => ({ ...c, giftCard: !c.giftCard }))}
                  className={cn(
                    "w-14 h-7 rounded-full transition-all relative",
                    orderForm.giftCard ? "bg-brand-primary" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                    orderForm.giftCard && "translate-x-7"
                  )} />
                </button>
              </div>
            </div>
          </section>

          {/* Delivery Info */}
          <section className="animate-rise [animation-delay:200ms]">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary/40 mb-8">02. Shipping Details</h3>
            <Panel className="p-12 rounded-[48px] bg-white/60 backdrop-blur-xl border-none shadow-liquid">
              <div className="grid gap-8">
                <InputField
                  label="수령인 성함"
                  value={orderForm.name}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="rounded-2xl border-slate-100"
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
                  className="rounded-2xl border-slate-100"
                />
                <InputField
                  label="배송 주소"
                  value={orderForm.address1}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      address1: event.target.value,
                    }))
                  }
                  className="rounded-2xl border-slate-100"
                />
                <div className="grid gap-8 sm:grid-cols-[1fr_140px]">
                  <InputField
                    label="상세 주소"
                    value={orderForm.address2}
                    onChange={(event) =>
                      setOrderForm((current) => ({
                        ...current,
                        address2: event.target.value,
                      }))
                    }
                    className="rounded-2xl border-slate-100"
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
                    className="rounded-2xl border-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-5 mt-16">
                <ButtonLink href="/preview" variant="ghost" className="text-slate-400">
                  수정하러 가기
                </ButtonLink>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-12 py-5 bg-brand-dark text-white rounded-2xl shadow-liquid hover:bg-brand-primary transition-all scale-105 font-bold"
                >
                  {isSubmitting ? "처리 중..." : "결제 및 주문 완료"}
                </Button>
              </div>
            </Panel>
          </section>
        </form>
      </div>

      <aside className="lg:sticky lg:top-24 animate-rise [animation-delay:300ms]">
        <Panel className="p-12 rounded-[48px] bg-brand-dark text-white border-none shadow-liquid overflow-hidden relative">
          <div className="blob absolute top-[-20%] right-[-20%] w-48 h-48 bg-brand-primary/30 blur-3xl opacity-40" />
          
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-primary mb-8">Summary & Pricing</p>
          <h2 className="font-serif text-4xl mb-10 tracking-tight">{draft?.title ?? "Your Album"}</h2>
          
          <dl className="grid gap-5 text-sm mb-12">
            <div className="flex justify-between text-white/50">
              <dt>기본 제작 (High-end)</dt>
              <dd className="font-bold text-white">₩35,000</dd>
            </div>
            <div className="flex justify-between text-white/50">
              <dt>전문 에디토리얼 레이아웃</dt>
              <dd className="font-bold text-white">₩0</dd>
            </div>
            {orderForm.giftCard && (
              <div className="flex justify-between text-brand-primary font-black uppercase tracking-widest">
                <dt>Premium Gift Card</dt>
                <dd>+ ₩2,000</dd>
              </div>
            )}
            <div className="h-px bg-white/10 my-4" />
            <div className="flex justify-between text-2xl font-black">
              <dt className="tracking-tighter">TOTAL</dt>
              <dd className="text-brand-primary">₩{orderForm.giftCard ? "37,000" : "35,000"}</dd>
            </div>
          </dl>

          <div className="bg-white/5 backdrop-blur-md p-8 rounded-[32px] border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Confirmed Specs</p>
            <ul className="text-[13px] space-y-3 font-medium text-white/70">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                {orderForm.packaging === "matte" ? "고급 무광 프리미엄 용지" : "선명한 유광 하이글로시 용지"}
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                {orderForm.ribbon === "none" ? "친환경 기본 패키징" : `${orderForm.ribbon === "red" ? "클래식 레드" : "시그니처 골드"} 리본 포장`}
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                SweetBook Pro 인쇄 자동화 시스템 연동
              </li>
            </ul>
          </div>
        </Panel>
      </aside>
    </div>
  );
}
