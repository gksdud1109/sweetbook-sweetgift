import type { AnniversaryType } from "@sweetgift/contracts";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function labelForAnniversaryType(type: AnniversaryType) {
  switch (type) {
    case "100days":
      return "100일";
    case "200days":
      return "200일";
    case "1year":
      return "1주년";
    case "custom":
      return "직접 입력";
  }
}

export function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

