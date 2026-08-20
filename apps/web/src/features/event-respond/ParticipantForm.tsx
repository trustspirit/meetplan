import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { phoneRegex, formatKoreanPhone, MAX_ANSWER_LENGTH, type ResponseField } from "@meetplan/shared";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  phone: string;
  note: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  collectPhone: boolean;
  fields: ResponseField[];
  answers: Record<string, string>;
  onAnswerChange: (fieldId: string, value: string) => void;
}

export function ParticipantForm({
  name, phone, note, onNameChange, onPhoneChange, onNoteChange,
  collectPhone, fields, answers, onAnswerChange,
}: Props) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInvalid = phoneTouched && phone.length > 0 && !phoneRegex.test(phone);

  return (
    <section className="flex flex-col gap-5">
      <Field label={t('form.nameLabel')} htmlFor="resp-name" hint={t('form.nameHint')}>
        <Input
          id="resp-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={40}
          placeholder={t('form.namePlaceholder')}
        />
      </Field>

      {collectPhone && (
        <Field
          label={t('form.phoneLabel')}
          htmlFor="resp-phone"
          hint={t('form.phoneHint')}
          {...(phoneInvalid ? { error: t('form.phoneError') } : {})}
        >
          <Input
            id="resp-phone"
            value={phone}
            onChange={(e) => onPhoneChange(formatKoreanPhone(e.target.value))}
            onBlur={() => setPhoneTouched(true)}
            inputMode="numeric"
            maxLength={13}
            placeholder={t('form.phonePlaceholder')}
          />
        </Field>
      )}

      {fields.map((field) => (
        <Field
          key={field.id}
          // 필수 표시는 라벨에 붙인다 — Field가 접근 가능한 이름으로 그대로 쓴다.
          label={field.required ? `${field.label} *` : field.label}
          htmlFor={`resp-field-${field.id}`}
        >
          <Input
            id={`resp-field-${field.id}`}
            value={answers[field.id] ?? ""}
            maxLength={MAX_ANSWER_LENGTH}
            onChange={(e) => onAnswerChange(field.id, e.target.value)}
          />
        </Field>
      ))}

      <Field
        label={t('form.respondentNote')}
        htmlFor="resp-note"
        aside={<span className="text-2xs tabular-nums text-text-muted">{note.length}/300</span>}
      >
        <Textarea
          id="resp-note"
          maxLength={300}
          placeholder={t('form.respondentNotePlaceholder')}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      </Field>
    </section>
  );
}
