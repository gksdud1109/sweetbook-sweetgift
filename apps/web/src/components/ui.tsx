"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/src/lib/utils";

function buttonStyles(variant: "primary" | "secondary" | "ghost") {
  return cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" &&
      "bg-cocoa text-white shadow-lg shadow-cocoa/15 hover:bg-rosewood",
    variant === "secondary" &&
      "border border-rosewood/15 bg-white/80 text-cocoa hover:bg-white",
    variant === "ghost" && "text-rosewood hover:bg-white/50",
  );
}

export function PageHero({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actions?: ReactNode;
}) {
  return (
    <section className="animate-rise">
      <p className="mb-3 text-xs uppercase tracking-[0.34em] text-rosewood/70">
        {eyebrow}
      </p>
      <h1 className="max-w-4xl font-serifDisplay text-4xl leading-tight text-cocoa sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-rosewood/80 sm:text-lg">
        {body}
      </p>
      {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}

export function Panel({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("paper-panel rounded-[28px] p-6 sm:p-8", className)}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={cn(buttonStyles(variant), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonStyles(variant), className)}>
      {children}
    </Link>
  );
}

export function InputField({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm text-cocoa">
        <span>{label}</span>
        {hint ? <span className="text-xs text-rosewood/60">{hint}</span> : null}
      </div>
      <input
        className={cn(
          "w-full rounded-[20px] border border-rosewood/10 bg-white/80 px-4 py-3 text-sm text-cocoa outline-none transition placeholder:text-rosewood/35 focus:border-coral focus:bg-white",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function TextareaField({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm text-cocoa">
        <span>{label}</span>
        {hint ? <span className="text-xs text-rosewood/60">{hint}</span> : null}
      </div>
      <textarea
        className={cn(
          "min-h-[132px] w-full rounded-[24px] border border-rosewood/10 bg-white/80 px-4 py-3 text-sm text-cocoa outline-none transition placeholder:text-rosewood/35 focus:border-coral focus:bg-white",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function StatusBanner({
  tone = "neutral",
  children,
}: PropsWithChildren<{ tone?: "neutral" | "error" | "success" }>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border px-4 py-3 text-sm",
        tone === "neutral" &&
          "border-rosewood/10 bg-white/70 text-rosewood/80",
        tone === "error" && "border-red-200 bg-red-50 text-red-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </div>
  );
}

export function StepPill({
  active,
  children,
  onClick,
}: PropsWithChildren<{ active?: boolean; onClick?: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition",
        active
          ? "border-cocoa bg-cocoa text-white"
          : "border-rosewood/10 bg-white/70 text-rosewood hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
