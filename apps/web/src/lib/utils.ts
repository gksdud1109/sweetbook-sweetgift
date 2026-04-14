/**
 * Tailwind CSS 클래스 합치기 유틸리티 (외부 의존성 없이 구현)
 */
export function cn(...inputs: any[]) {
  return inputs
    .flat()
    .filter((v) => typeof v === "string" && v)
    .join(" ");
}

/**
 * 인위적인 지연을 생성합니다. (Mock용)
 */
export const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * 날짜 포맷팅 (YYYY년 MM월 DD일)
 */
export function formatDate(date: string | Date | undefined) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * File 객체에서 날짜 정보를 추출합니다. (YYYY-MM-DD)
 */
export function extractDateFromFile(file: File): string {
  const date = new Date(file.lastModified);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 기념일 타입에 대한 한글 레이블 반환
 */
export function labelForAnniversaryType(type: string) {
  const map: Record<string, string> = {
    "100days": "100일",
    "200days": "200일",
    "1year": "1주년",
    custom: "기타 기념일",
  };
  return map[type] || type;
}
