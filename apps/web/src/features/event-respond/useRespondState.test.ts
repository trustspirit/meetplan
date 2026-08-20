import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRespondState } from "./useRespondState";

describe("useRespondState — answers", () => {
  it("prefill이 answers를 채운다", () => {
    const { result } = renderHook(() =>
      useRespondState({
        name: "홍길동",
        phone: "",
        selectedSlotIds: [],
        answers: { team: "1팀", car: "있음" },
      })
    );
    expect(result.current.state.answers).toEqual({ team: "1팀", car: "있음" });
  });

  it("한 항목을 수정해도 다른 항목의 답변은 그대로 남는다 (merge, not replace)", () => {
    const { result } = renderHook(() =>
      useRespondState({
        name: "홍길동",
        phone: "",
        selectedSlotIds: [],
        answers: { team: "1팀", car: "있음" },
      })
    );
    act(() => result.current.setAnswer("team", "2팀"));
    expect(result.current.state.answers).toEqual({ team: "2팀", car: "있음" });
  });

  it("setAnswer는 prefill에 없던 새 키를 추가해도 기존 키를 보존한다", () => {
    const { result } = renderHook(() =>
      useRespondState({
        name: "홍길동",
        phone: "",
        selectedSlotIds: [],
        answers: { team: "1팀" },
      })
    );
    act(() => result.current.setAnswer("note2", "x"));
    expect(result.current.state.answers).toEqual({ team: "1팀", note2: "x" });
  });

  it("prefill은 최초 한 번만 적용되어 이후 재도착한 prefill이 편집 내용을 덮지 않는다", () => {
    type Prefill = Parameters<typeof useRespondState>[0];
    const { result, rerender } = renderHook(
      (prefill: Prefill) => useRespondState(prefill),
      {
        initialProps: {
          name: "홍길동",
          phone: "",
          selectedSlotIds: [],
          answers: { team: "1팀" },
        } as Prefill,
      }
    );

    act(() => result.current.setAnswer("team", "수정됨"));
    expect(result.current.state.answers).toEqual({ team: "수정됨" });

    // 인증 상태 변화 등으로 prefill 객체가 새로 도착해도 이미 편집한 값은 유지되어야 한다.
    rerender({
      name: "홍길동",
      phone: "",
      selectedSlotIds: [],
      answers: { team: "서버값", car: "있음" },
    });

    expect(result.current.state.answers).toEqual({ team: "수정됨" });
  });
});
