import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseFieldsEditor } from "./ResponseFieldsEditor";
import type { ResponseField } from "@meetplan/shared";

function setup(fields: ResponseField[] = [], collectPhone = true) {
  const onFieldsChange = vi.fn();
  const onCollectPhoneChange = vi.fn();
  render(
    <ResponseFieldsEditor
      collectPhone={collectPhone}
      onCollectPhoneChange={onCollectPhoneChange}
      fields={fields}
      onFieldsChange={onFieldsChange}
    />
  );
  return { onFieldsChange, onCollectPhoneChange };
}

describe("ResponseFieldsEditor", () => {
  it("이름과 기타 사항은 항상 수집으로 표시된다", () => {
    setup();
    expect(screen.getByText("이름")).toBeInTheDocument();
    expect(screen.getByText("기타 사항")).toBeInTheDocument();
    expect(screen.getAllByText("항상 수집")).toHaveLength(2);
  });

  it("전화번호 토글이 현재 상태를 반영한다", () => {
    setup([], false);
    expect(screen.getByRole("switch", { name: "전화번호" })).toHaveAttribute("aria-checked", "false");
  });

  it("전화번호 토글을 누르면 onCollectPhoneChange를 호출한다", async () => {
    const { onCollectPhoneChange } = setup([], true);
    await userEvent.click(screen.getByRole("switch", { name: "전화번호" }));
    expect(onCollectPhoneChange).toHaveBeenCalledWith(false);
  });

  it("항목 추가를 누르면 빈 항목이 하나 늘어난다", async () => {
    const { onFieldsChange } = setup([]);
    await userEvent.click(screen.getByRole("button", { name: "+ 항목 추가" }));
    expect(onFieldsChange).toHaveBeenCalledTimes(1);
    const next = onFieldsChange.mock.calls[0]![0] as ResponseField[];
    expect(next).toHaveLength(1);
    expect(next[0]!.label).toBe("");
    expect(next[0]!.required).toBe(false);
    expect(next[0]!.id).toMatch(/^[A-Za-z0-9-]{1,64}$/);
  });

  it("기존 항목의 라벨이 입력값으로 나온다", () => {
    setup([{ id: "f1", label: "소속", required: false }]);
    expect(screen.getByDisplayValue("소속")).toBeInTheDocument();
  });

  it("필수 체크박스를 누르면 그 항목의 required가 반전된다", async () => {
    const { onFieldsChange } = setup([
      { id: "f1", label: "소속", required: false },
    ]);
    await userEvent.click(screen.getByRole("checkbox", { name: "필수" }));
    expect(onFieldsChange).toHaveBeenCalledWith([
      { id: "f1", label: "소속", required: true },
    ]);
  });

  it("삭제 버튼을 누르면 그 항목이 빠진다", async () => {
    const { onFieldsChange } = setup([
      { id: "f1", label: "소속", required: false },
      { id: "f2", label: "차량", required: false },
    ]);
    const buttons = screen.getAllByRole("button", { name: "항목 삭제" });
    await userEvent.click(buttons[0]!);
    expect(onFieldsChange).toHaveBeenCalledWith([{ id: "f2", label: "차량", required: false }]);
  });

  it("10개가 차면 추가 버튼이 비활성된다", () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({
      id: `f${i}`, label: `항목${i}`, required: false,
    }));
    setup(ten);
    expect(screen.getByRole("button", { name: "+ 항목 추가" })).toBeDisabled();
  });

  it("라벨이 비어 있으면 안내를 보여준다", () => {
    setup([{ id: "f1", label: "", required: false }]);
    expect(screen.getByText("항목 이름을 입력해주세요")).toBeInTheDocument();
  });
});
