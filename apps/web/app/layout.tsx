import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Noto_Serif_KR } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AlbumFlowProvider } from "@/src/providers/album-flow-provider";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SweetGift | Moment to Memory",
  description: "당신의 소중한 순간을 한 권의 다정한 선물로 엮어드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans selection:bg-brand-primary/20 selection:text-brand-primary">
        <div className="liquid-bg">
          <div className="blob top-[-10%] left-[-10%] animate-blob" />
          <div className="blob bottom-[-10%] right-[-10%] animate-blob [animation-delay:2s] bg-brand-secondary/10" />
          <div className="blob top-[20%] right-[20%] animate-blob [animation-delay:4s] bg-brand-accent/10" />
        </div>
        
        <AlbumFlowProvider>
          <div className="relative min-h-screen">
            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-12 pt-8 sm:px-10 lg:px-12">
              <header className="mb-12 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-liquid transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight text-brand-dark">
                      SweetGift
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary/60">
                      Moment to Memory
                    </p>
                  </div>
                </Link>
                <nav className="hidden items-center gap-8 text-[13px] font-bold uppercase tracking-widest text-slate-400 sm:flex">
                  <Link href="/create" className="transition-colors hover:text-brand-primary">Create</Link>
                  <Link href="/preview" className="transition-colors hover:text-brand-primary">Preview</Link>
                  <Link href="/order" className="transition-colors hover:text-brand-primary">Order</Link>
                </nav>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </AlbumFlowProvider>
      </body>
    </html>
  );
}
