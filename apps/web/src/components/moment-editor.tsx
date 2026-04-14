"use client";

import type { EditableMoment } from "@/src/lib/album-flow";
import { Button, InputField, Panel, TextareaField } from "@/src/components/ui";
import { ImageUpload } from "./image-upload";
import { DecorationEditor } from "./decoration-editor";

export function MomentEditor({
  index,
  moment,
  canRemove,
  errors,
  onChange,
  onRemove,
}: {
  index: number;
  moment: EditableMoment;
  canRemove: boolean;
  errors?: Record<string, string>;
  onChange: (patch: Partial<EditableMoment>) => void;
  onRemove: () => void;
}) {
  return (
    <Panel className="rounded-[24px] bg-white/55 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rosewood/60">
            Moment {index + 1}
          </p>
          <p className="mt-1 font-serif text-2xl text-cocoa">
            {moment.title || "추억 페이지"}
          </p>
        </div>
        {canRemove ? (
          <Button variant="ghost" onClick={onRemove}>
            삭제
          </Button>
        ) : null}
      </div>
      <div className="grid gap-6">
        <DecorationEditor
          decorations={moment.decorations || []}
          onChange={(decorations) => onChange({ decorations })}
        >
          <ImageUpload
            label="추억 사진"
            value={moment.photoUrl}
            onChange={(url) => onChange({ photoUrl: url })}
            error={errors?.photoUrl}
            hint="파일을 올리거나 URL을 입력하세요"
          />
        </DecorationEditor>
        
        <div className="grid gap-4 lg:grid-cols-2">
          <InputField
            label="추억 날짜"
            type="date"
            value={moment.date}
            error={errors?.date}
            onChange={(event) => onChange({ date: event.target.value })}
          />
          <InputField
            label="추억 제목"
            value={moment.title}
            error={errors?.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
          <TextareaField
            label="짧은 설명"
            className="lg:col-span-2"
            value={moment.body}
            error={errors?.body}
            onChange={(event) => onChange({ body: event.target.value })}
          />
        </div>
      </div>
    </Panel>
  );
}
