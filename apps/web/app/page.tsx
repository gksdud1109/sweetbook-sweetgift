/* eslint-disable @next/next/no-img-element */

import { ButtonLink, PageHero, Panel } from "@/src/components/ui";

export default function LandingPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
      <div>
        <PageHero
          eyebrow="Anniversary Gift Service"
          title="사진, 편지, 추억 몇 장면만 있으면 기념일 선물용 앨범이 완성됩니다."
          body="SweetGift는 커플의 기념일을 위해 사진과 편지, 짧은 추억 기록을 한 권의 선물용 앨범으로 정리해 주는 서비스입니다. MVP에서는 입력부터 미리보기, 주문 완료까지 한 번에 데모할 수 있습니다."
          actions={
            <>
              <ButtonLink href="/create">앨범 만들기 시작</ButtonLink>
              <ButtonLink href="/preview" variant="secondary">
                미리보기 화면 보기
              </ButtonLink>
            </>
          }
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["1", "더미 데이터 로드", "샘플 사진과 편지를 버튼 하나로 바로 채웁니다."],
            ["2", "생성된 페이지 미리보기", "표지, 순간 페이지, 편지, 마무리 페이지를 확인합니다."],
            ["3", "책 생성 후 주문", "Books API와 Orders API 계약에 맞춰 마지막까지 진행합니다."],
          ].map(([step, title, body]) => (
            <Panel key={step} className="rounded-[24px] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-rosewood/60">
                Step {step}
              </p>
              <h3 className="mt-3 font-serifDisplay text-2xl text-cocoa">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-rosewood/80">{body}</p>
            </Panel>
          ))}
        </div>
      </div>
      <Panel className="overflow-hidden p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_0.84fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-cocoa p-5 text-white">
            <img
              src="/dummy/photos/cover.svg"
              alt="SweetGift cover preview"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="relative flex h-full flex-col justify-between">
              <div className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em]">
                Preview First
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                  Anniversary Album
                </p>
                <h2 className="mt-4 max-w-sm font-serifDisplay text-4xl leading-tight">
                  A Year Written In Us
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">
                  가장 중요한 장면부터 편지까지, 선물처럼 보이는 화면으로 바로 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="paper-panel overflow-hidden rounded-[28px] p-3">
              <img
                src="/dummy/photos/moment-02.svg"
                alt="Moment preview"
                className="h-52 w-full rounded-[24px] object-cover"
              />
              <div className="px-2 pb-2 pt-4">
                <p className="text-xs uppercase tracking-[0.28em] text-rosewood/55">
                  Moment Page
                </p>
                <h3 className="mt-2 font-serifDisplay text-2xl text-cocoa">
                  초여름 산책
                </h3>
                <p className="mt-3 text-sm leading-7 text-rosewood/80">
                  이미지와 문장이 한 페이지에 엮여 선물용 앨범처럼 보이도록 구성했습니다.
                </p>
              </div>
            </div>
            <div className="paper-panel rounded-[28px] bg-white/90 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-rosewood/55">
                Letter Page
              </p>
              <p className="mt-4 font-serifDisplay text-3xl text-cocoa">
                To. 지은
              </p>
              <p className="mt-4 text-sm leading-8 text-rosewood/80">
                우리의 일 년은 생각보다 더 선명하게 남아 있었어. 이 책이 오늘을 오래 기억하게 해주면 좋겠어.
              </p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
