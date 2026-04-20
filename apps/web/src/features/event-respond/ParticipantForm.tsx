import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneRegex } from "@meetplan/shared";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}

export function ParticipantForm({ name, phone, onNameChange, onPhoneChange }: Props) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInvalid = phoneTouched && phone.length > 0 && !phoneRegex.test(phone);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Label htmlFor="resp-name">이름</Label>
        <Input
          id="resp-name"
          className="mt-2"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={40}
          placeholder="예: 김민수"
        />
        <p className="text-[11px] text-muted-foreground mt-1">호스트에게만 보입니다</p>
      </div>
      <div>
        <Label htmlFor="resp-phone">전화번호</Label>
        <Input
          id="resp-phone"
          className={cn("mt-2", phoneInvalid && "border-destructive focus-visible:ring-destructive")}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onBlur={() => setPhoneTouched(true)}
          inputMode="tel"
          placeholder="010-1234-5678"
        />
        {phoneInvalid ? (
          <p className="text-[11px] text-destructive mt-1">⚠ 010-1234-5678 형식으로 입력해주세요</p>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">호스트가 확정 시간을 문자로 알릴 때 사용해요</p>
        )}
      </div>
    </section>
  );
}
