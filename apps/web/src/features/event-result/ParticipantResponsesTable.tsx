import type { ParticipantResponse, ResponseField } from "@meetplan/shared";
import { formatKoreanPhone } from "@meetplan/shared";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

interface Props {
  responses: ParticipantResponse[];
  collectPhone: boolean;
  fields: ResponseField[];
  /** 주어지면 호스트가 직접 추가한 응답 옆에 삭제 버튼을 보여준다. */
  onDeleteManual?: (response: ParticipantResponse) => Promise<void>;
}

const EMPTY = "—";

/**
 * 호스트가 모은 응답 정보를 한 표로 보여준다.
 * 전화번호는 호스트 전용 화면에서만 노출된다 — 이 컴포넌트는 결과 화면에서만 쓴다.
 */
export function ParticipantResponsesTable({ responses, collectPhone, fields, onDeleteManual }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (responses.length === 0) return null;

  const deleteManual = async (r: ParticipantResponse) => {
    if (!onDeleteManual || deletingId) return;
    if (!window.confirm(t('manual.deleteConfirm', { name: r.name }))) return;
    setDeleteError(null);
    setDeletingId(r.id);
    try {
      await onDeleteManual(r);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t('manual.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const showNote = responses.some((r) => r.note);

  return (
    <div className="mt-6 flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text">{t('result.responsesTitle')}</h3>
      {deleteError && <p className="text-sm text-danger">{deleteError}</p>}

      <ScrollArea className="rounded-lg border border-border bg-surface">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              <th className="px-3 py-2 text-left font-semibold text-text-muted">
                {t('result.colName')}
              </th>
              {collectPhone && (
                <th className="border-l border-border px-3 py-2 text-left font-semibold text-text-muted">
                  {t('result.colPhone')}
                </th>
              )}
              {fields.map((f) => (
                <th
                  key={f.id}
                  className="border-l border-border px-3 py-2 text-left font-semibold text-text-muted"
                >
                  {f.label}
                </th>
              ))}
              {showNote && (
                <th className="border-l border-border px-3 py-2 text-left font-semibold text-text-muted">
                  {t('result.colNote')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-3 py-3 font-medium text-text">
                  <span className="flex items-center gap-1.5">
                    {r.name}
                    {r.addedByHost && <Badge>{t('manual.badge')}</Badge>}
                    {r.addedByHost && onDeleteManual && (
                      <button
                        type="button"
                        aria-label={`${t('manual.delete')} ${r.name}`}
                        onClick={() => deleteManual(r)}
                        disabled={deletingId !== null}
                        className="rounded p-1 text-text-subtle hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 size={12} aria-hidden />
                      </button>
                    )}
                  </span>
                </td>
                {collectPhone && (
                  <td className="whitespace-nowrap border-l border-border px-3 py-3 tabular-nums text-text-muted">
                    {r.phone ? formatKoreanPhone(r.phone) : EMPTY}
                  </td>
                )}
                {fields.map((f) => (
                  <td key={f.id} className="border-l border-border px-3 py-3 text-text">
                    {r.answers?.[f.id] || EMPTY}
                  </td>
                ))}
                {showNote && (
                  <td className="border-l border-border px-3 py-3 whitespace-pre-wrap text-text">
                    {r.note || EMPTY}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
