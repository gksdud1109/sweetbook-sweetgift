import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AlbumFlowProvider } from "@/src/providers/album-flow-provider";

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SweetGift",
  description: "기념일 사진과 편지로 선물용 앨범을 만드는 커플 기프트 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans">
        <AlbumFlowProvider>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-grain opacity-90" />
            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-10 pt-6 sm:px-8 lg:px-10">
              <header className="mb-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-lg text-rosewood shadow-lg">
                    SG
                  </div>
                  <div>
                    <p className="font-serif text-xl tracking-[0.16em] text-cocoa">
                      SweetGift
                    </p>
                    <p className="text-xs uppercase tracking-[0.28em] text-rosewood/70">
                      Anniversary Album MVP
                    </p>
                  </div>
                </Link>
                <nav className="hidden gap-5 text-sm font-medium text-rosewood/80 sm:flex">
                  <Link href="/create">Create Album</Link>
                  <Link href="/preview">Preview</Link>
                  <Link href="/order">Order</Link>
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
