import type { ResponseValidationError } from "@meetplan/shared";
import { t } from "@/lib/i18n";

/**
 * 검증 위반을 사용자에게 보여줄 한 줄 안내로 바꾼다.
 *
 * `unknown_field`는 사용자가 만들 수 없는 상태(클라이언트 버그나 변조)이므로
 * 구체적으로 알려줄 게 없다. 일반 오류로 낮춘다.
 */
export function describeMissing(error: ResponseValidationError | null): string | null {
  if (!error) return null;
  switch (error.code) {
    case "name_missing": return t('respond.missingName');
    case "slots_missing": return t('respond.missingSlots');
    case "phone_missing":
    case "phone_invalid": return t('respond.missingPhone');
    case "field_required": return t('respond.missingField', { label: error.label });
    case "field_too_long": return t('respond.fieldTooLong', { label: error.label });
    case "unknown_field": return t('common.inputError');
  }
}
