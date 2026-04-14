import { Suspense } from "react";
import { Panel } from "@/src/components/ui";
import { PreviewPageClient } from "@/src/components/preview-page-client";

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <Panel>
          <p className="text-sm text-rosewood/75">앨범 미리보기를 준비 중입니다...</p>
        </Panel>
      }
    >
      <PreviewPageClient />
    </Suspense>
  );
}

