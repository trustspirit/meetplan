import { useCallback, useEffect, useRef, useState } from "react";

export interface RespondState {
  name: string;
  phone: string;
  selectedSlotIds: Set<string>;
}

const initial: RespondState = {
  name: "",
  phone: "",
  selectedSlotIds: new Set(),
};

export function useRespondState(prefill?: {
  name: string;
  phone: string;
  selectedSlotIds: string[];
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
        selectedSlotIds: new Set(prefill.selectedSlotIds),
      });
    }
  }, [prefill]);

  const setName = useCallback((name: string) => setState((s) => ({ ...s, name })), []);
  const setPhone = useCallback((phone: string) => setState((s) => ({ ...s, phone })), []);
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

  return { state, setName, setPhone, toggleSlot, setSlotChecked };
}
