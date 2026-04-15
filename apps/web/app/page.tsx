/* eslint-disable @next/next/no-img-element */

import { ButtonLink, PageHero, Panel } from "@/src/components/ui";

export default function LandingPage() {
  return (
    <div className="relative pt-12 pb-20 lg:pt-20">
      <div className="grid gap-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Left Side: Emotional Pitch */}
        <div className="flex flex-col justify-center animate-rise">
          <PageHero
            eyebrow="Moment to Memory"
            title="당신의 소중한 순간이 가장 특별한 선물이 되도록."
            body="SweetGift는 흩어진 사진과 짧은 기록들을 모아 세상에 단 한 권뿐인 프리미엄 에디토리얼 앨범으로 엮어드립니다. 디자인 고민 없이, 사진만 던져주세요."
            actions={
              <div className="flex flex-wrap gap-5 mt-12">
                <ButtonLink href="/create" className="px-10 py-5 text-base font-bold shadow-liquid bg-brand-primary hover:bg-brand-primary/90 transition-all scale-105 hover:scale-110 rounded-2xl text-white">
                  앨범 만들기 시작
                </ButtonLink>
                <ButtonLink href="/preview" variant="secondary" className="px-10 py-5 text-base font-bold backdrop-blur-md bg-white/40 border-brand-primary/10 text-brand-primary hover:bg-white/60 rounded-2xl">
                  미리보기 예시
                </ButtonLink>
              </div>
            }
          />
          
          {/* Subtle Trust Indicators */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10 border-t border-slate-100 pt-12">
            {[
              ["✨", "Smart Decor", "이모지 스티커로 꾸미는 나만의 다꾸 감성"],
              ["🎨", "Liquid UI", "최신 트렌드를 반영한 유려한 사용자 경험"],
              ["🖨️", "Pro Pipeline", "실제 인쇄 가능한 고품질 도서 제작 공정"]
            ].map(([emoji, title, desc]) => (
              <div key={title} className="group cursor-default">
                <div className="text-2xl mb-4 group-hover:scale-125 transition-transform duration-300 origin-left">{emoji}</div>
                <h4 className="font-bold text-brand-dark mb-2 text-sm">{title}</h4>
                <p className="text-[11px] text-slate-400 leading-5 font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Elegant Book Spread Preview */}
        <div className="relative group perspective-1000">
          <div className="absolute -inset-10 bg-gradient-to-tr from-brand-primary/20 to-brand-secondary/20 rounded-full blur-[100px] -z-10 opacity-40 group-hover:opacity-70 transition-opacity duration-1000" />
          
          <div className="relative flex flex-col gap-8">
            {/* Main Cover Card */}
            <Panel className="overflow-hidden p-0 rounded-[48px] shadow-liquid rotate-[-2deg] hover:rotate-0 transition-all duration-700 border-none bg-brand-dark overflow-hidden">
              <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden">
                <img
                  src="/dummy/photos/cover.svg"
                  alt="SweetGift cover preview"
                  className="absolute inset-0 h-full w-full object-cover opacity-50 scale-110 group-hover:scale-100 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent" />
                <div className="absolute bottom-12 left-12 right-12 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-primary mb-6">Premium Anniversary</p>
                  <h2 className="font-serif text-5xl leading-tight mb-6 tracking-tight">Our Stories<br/>Unfolded.</h2>
                  <div className="h-1 w-16 bg-brand-primary mb-8 rounded-full" />
                  <p className="text-sm font-medium opacity-70 leading-relaxed max-w-xs italic">우리의 가장 빛나던 일 년을 종이의 질감으로 기록합니다.</p>
                </div>
              </div>
            </Panel>

            {/* Floating Side Cards */}
            <div className="grid grid-cols-2 gap-8 px-8 -mt-16 relative z-10">
              <div className="paper-panel p-6 rounded-[32px] shadow-2xl rotate-[-6deg] hover:rotate-0 transition-all duration-500 bg-white/80 backdrop-blur-xl border-white/40">
                <div className="aspect-square rounded-[24px] overflow-hidden mb-5 shadow-inner">
                  <img src="/dummy/photos/moment-02.svg" alt="Moment" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">Moments ✨</p>
                <h4 className="font-serif text-xl text-brand-dark italic">초여름 산책</h4>
              </div>
              
              <div className="paper-panel p-10 rounded-[32px] shadow-2xl rotate-[4deg] hover:rotate-0 transition-all duration-500 bg-brand-primary text-white border-none flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Editor&apos;s Note</p>
                <p className="font-serif text-2xl leading-snug italic">
                  &ldquo;우리의 일 년은<br/>생각보다 더 선명해.&rdquo;
                </p>
                <p className="mt-6 text-[11px] font-bold text-white/60 tracking-widest">PRIVATE LETTER</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
