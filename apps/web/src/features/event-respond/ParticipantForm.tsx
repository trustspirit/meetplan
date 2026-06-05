import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { phoneRegex, formatKoreanPhone } from "@meetplan/shared";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}

export function ParticipantForm({ name, phone, onNameChange, onPhoneChange }: Props) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInvalid = phoneTouched && phone.length > 0 && !phoneRegex.test(phone);

  const handlePhoneChange = (raw: string) => {
    onPhoneChange(formatKoreanPhone(raw));
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Label htmlFor="resp-name">{t('form.nameLabel')}</Label>
        <Input
          id="resp-name"
          className="mt-2"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={40}
          placeholder={t('form.namePlaceholder')}
        />
        <p className="text-[11px] text-muted-foreground mt-1">{t('form.nameHint')}</p>
      </div>
      <div>
        <Label htmlFor="resp-phone">{t('form.phoneLabel')}</Label>
        <Input
          id="resp-phone"
          className={cn("mt-2", phoneInvalid && "border-destructive focus-visible:ring-destructive")}
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={() => setPhoneTouched(true)}
          inputMode="numeric"
          maxLength={13}
          placeholder={t('form.phonePlaceholder')}
        />
        {phoneInvalid ? (
          <p className="flex items-center gap-1 text-[11px] text-destructive mt-1">
            <AlertCircle size={11} className="shrink-0" />
            {t('form.phoneError')}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">{t('form.phoneHint')}</p>
        )}
      </div>
    </section>
  );
}
