import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const callMock = vi.fn();
vi.mock("@/lib/callable", () => ({
  hostAddResponseCallable: (...args: unknown[]) => callMock(...args),
}));

import { AddManualResponseDialog } from "./AddManualResponseDialog";
import type { SlotColumn } from "./matrixModel";

const COLS: SlotColumn[] = [
  { slotId: "b", dateYmd: "2026-10-13", dateLabel: "10/13 (화)", timeLabel: "09:00" },
  { slotId: "a", dateYmd: "2026-10-12", dateLabel: "10/12 (월)", timeLabel: "10:00" },
];

describe("AddManualResponseDialog", () => {
  beforeEach(() => callMock.mockReset().mockResolvedValue({ data: { responseId: "r" } }));

  it("이름과 슬롯을 모두 골라야 추가할 수 있고, 선택한 값으로 호출한다", async () => {
    const onClose = vi.fn();
    render(<AddManualResponseDialog eventId="e1" slotColumns={COLS} onClose={onClose} />);
    const submit = screen.getByRole("button", { name: "추가" });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText("이름"), "  홍길동 ");
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "10:00" }));
    expect(submit).toBeEnabled();

    await userEvent.click(submit);
    expect(callMock).toHaveBeenCalledWith({ eventId: "e1", name: "홍길동", selectedSlotIds: ["a"] });
    expect(onClose).toHaveBeenCalled();
  });

  it("날짜를 시간순으로 보여준다", () => {
    render(<AddManualResponseDialog eventId="e1" slotColumns={COLS} onClose={() => {}} />);
    const first = screen.getByText("10/12 (월)");
    const second = screen.getByText("10/13 (화)");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
