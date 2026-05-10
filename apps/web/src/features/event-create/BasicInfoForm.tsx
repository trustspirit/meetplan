import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeriodPicker } from "./PeriodPicker";

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  periodMinutes: number;
  onPeriodChange: (v: number) => void;
}

export function BasicInfoForm({ title, onTitleChange, periodMinutes, onPeriodChange }: Props) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <Label htmlFor="ev-title">이벤트 이름</Label>
        <Input
          id="ev-title"
          className="mt-2"
          placeholder="예: 2분기 1:1 미팅"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <div>
        <Label>미팅 길이</Label>
        <div className="mt-2">
          <PeriodPicker value={periodMinutes} onChange={onPeriodChange} />
        </div>
      </div>
    </section>
  );
}
