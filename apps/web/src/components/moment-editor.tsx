"use client";

import type { EditableMoment } from "@/src/lib/album-flow";
import { Button, InputField, Panel, TextareaField } from "@/src/components/ui";

export function MomentEditor({
  index,
  moment,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  moment: EditableMoment;
  canRemove: boolean;
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
          <p className="mt-1 font-serifDisplay text-2xl text-cocoa">
            {moment.title || "추억 페이지"}
          </p>
        </div>
        {canRemove ? (
          <Button variant="ghost" onClick={onRemove}>
            삭제
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <InputField
          label="추억 날짜"
          type="date"
          value={moment.date}
          onChange={(event) => onChange({ date: event.target.value })}
        />
        <InputField
          label="사진 URL"
          placeholder="/dummy/photos/moment-01.svg"
          value={moment.photoUrl}
          onChange={(event) => onChange({ photoUrl: event.target.value })}
        />
        <InputField
          label="추억 제목"
          className="lg:col-span-2"
          value={moment.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <TextareaField
          label="짧은 설명"
          className="lg:col-span-2"
          value={moment.body}
          onChange={(event) => onChange({ body: event.target.value })}
        />
      </div>
    </Panel>
  );
}

