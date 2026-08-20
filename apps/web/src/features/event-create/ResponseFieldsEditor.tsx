import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  MAX_RESPONSE_FIELDS,
  MAX_FIELD_LABEL_LENGTH,
  type ResponseField,
} from "@meetplan/shared";

interface Props {
  collectPhone: boolean;
  onCollectPhoneChange: (value: boolean) => void;
  fields: ResponseField[];
  onFieldsChange: (fields: ResponseField[]) => void;
}

/** 항상 수집되는 내장 항목 — 끌 수 없으므로 정보 표시만 한다. */
function AlwaysRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-text">{label}</span>
      <span className="text-2xs text-text-muted">{t('fields.always')}</span>
    </div>
  );
}

export function ResponseFieldsEditor({
  collectPhone, onCollectPhoneChange, fields, onFieldsChange,
}: Props) {
  const atLimit = fields.length >= MAX_RESPONSE_FIELDS;

  const addField = () => {
    if (atLimit) return;
    onFieldsChange([...fields, { id: crypto.randomUUID(), label: "", required: false }]);
  };

  const patchField = (id: string, patch: Partial<ResponseField>) => {
    onFieldsChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id));
  };

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-text">{t('fields.sectionTitle')}</h2>

      <Card className="divide-y divide-border overflow-hidden">
        <AlwaysRow label={t('fields.name')} />
        <AlwaysRow label={t('fields.note')} />

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text">{t('fields.phone')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={collectPhone}
            aria-label={t('fields.phone')}
            onClick={() => onCollectPhoneChange(!collectPhone)}
            className={cn(
              "flex min-h-touch items-center gap-2 rounded-md px-2 text-2xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collectPhone ? "text-primary" : "text-text-muted"
            )}
          >
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                collectPhone ? "bg-primary" : "bg-border-strong"
              )}
              aria-hidden
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-all",
                  collectPhone ? "left-[1.125rem]" : "left-0.5"
                )}
              />
            </span>
            {collectPhone ? t('fields.phoneOn') : t('fields.phoneOff')}
          </button>
        </div>

        {fields.map((field) => {
          const labelMissing = field.label.trim().length === 0;
          const errorId = `field-${field.id}-error`;
          return (
            <div key={field.id} className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={field.label}
                  maxLength={MAX_FIELD_LABEL_LENGTH}
                  placeholder={t('fields.labelPlaceholder')}
                  aria-label={t('fields.labelAria')}
                  aria-invalid={labelMissing ? true : undefined}
                  aria-describedby={labelMissing ? errorId : undefined}
                  onChange={(e) => patchField(field.id, { label: e.target.value })}
                  className="flex-1"
                />
                <label className="flex min-h-touch shrink-0 cursor-pointer items-center gap-1.5 px-1 text-2xs text-text-muted">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => patchField(field.id, { required: e.target.checked })}
                    className="h-4 w-4 cursor-pointer accent-[hsl(var(--primary))]"
                  />
                  {t('fields.required')}
                </label>
                <IconButton
                  aria-label={t('fields.remove')}
                  onClick={() => removeField(field.id)}
                  className="min-h-touch min-w-touch"
                >
                  <Trash2 size={16} aria-hidden />
                </IconButton>
              </div>
              {labelMissing && (
                <p id={errorId} className="text-2xs text-danger">{t('fields.labelMissing')}</p>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={addField}
            disabled={atLimit}
            className={cn(
              "min-h-touch rounded-md px-1 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "text-primary hover:underline"
            )}
          >
            {t('fields.add')}
          </button>
          <span className="text-2xs tabular-nums text-text-muted">
            {t('fields.count', { count: fields.length, max: MAX_RESPONSE_FIELDS })}
          </span>
        </div>
      </Card>
    </section>
  );
}
