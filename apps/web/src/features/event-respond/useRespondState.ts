import { useCallback, useEffect, useRef, useState } from "react";
import type { CellGridModel } from "./slotsToCells";

export interface RespondState {
  name: string;
  phone: string;
  note: string;
  selectedSlotIds: Set<string>;
  answers: Record<string, string>;
}

const initial: RespondState = {
  name: "",
  phone: "",
  note: "",
  selectedSlotIds: new Set(),
  answers: {},
};

export function useRespondState(prefill?: {
  name: string;
  phone: string;
  note?: string;
  selectedSlotIds: string[];
  answers?: Record<string, string>;
}) {
  const [state, setState] = useState<RespondState>(initial);
  const hasPrefilled = useRef(false);

  useEffect(() => {
    // prefill은 단 한 번만 적용 — 이후 인증 상태 변화 등으로 prefill이 재도착해도 사용자 편집을 덮지 않음.
    if (prefill && !hasPrefilled.current) {
      hasPrefilled.current = true;
      setState({
        name: prefill.name,
        phone: prefill.phone,
        note: prefill.note ?? "",
        selectedSlotIds: new Set(prefill.selectedSlotIds),
        answers: prefill.answers ?? {},
      });
    }
  }, [prefill]);

  const setName = useCallback((name: string) => setState((s) => ({ ...s, name })), []);
  const setPhone = useCallback((phone: string) => setState((s) => ({ ...s, phone })), []);
  const setNote = useCallback((note: string) => setState((s) => ({ ...s, note })), []);
  const toggleSlot = useCallback((slotId: string) => {
    setState((s) => {
      const next = new Set(s.selectedSlotIds);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return { ...s, selectedSlotIds: next };
    });
  }, []);
  const setSlotChecked = useCallback((slotId: string, on: boolean) => {
    setState((s) => {
      const next = new Set(s.selectedSlotIds);
      if (on) next.add(slotId);
      else next.delete(slotId);
      return { ...s, selectedSlotIds: next };
    });
  }, []);

  /** Step 1에서 날짜를 해제할 때 그 날짜의 선택된 슬롯도 함께 지운다 (스펙 §8.5). */
  const clearSlotsForDate = useCallback((grid: CellGridModel, dateYmd: string) => {
    setState((s) => {
      const next = new Set(s.selectedSlotIds);
      for (const [cellKey, slotId] of grid.slotIdByCell) {
        if (cellKey.startsWith(`${dateYmd}_`)) next.delete(slotId);
      }
      return { ...s, selectedSlotIds: next };
    });
  }, []);

  const setAnswer = useCallback((fieldId: string, value: string) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [fieldId]: value } }));
  }, []);

  return { state, setName, setPhone, setNote, toggleSlot, setSlotChecked, clearSlotsForDate, setAnswer };
}
