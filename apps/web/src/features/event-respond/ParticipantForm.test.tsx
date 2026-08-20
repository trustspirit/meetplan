import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParticipantForm } from "./ParticipantForm";
import type { ResponseField } from "@meetplan/shared";

function setup(opts: { collectPhone?: boolean; fields?: ResponseField[] } = {}) {
  const onAnswerChange = vi.fn();
  render(
    <ParticipantForm
      name="" phone="" note=""
      onNameChange={() => {}}
      onPhoneChange={() => {}}
      onNoteChange={() => {}}
      collectPhone={opts.collectPhone ?? true}
      fields={opts.fields ?? []}
      answers={{}}
      onAnswerChange={onAnswerChange}
    />
  );
  return { onAnswerChange };
}

describe("ParticipantForm", () => {
  it("이름과 기타 사항은 항상 렌더된다", () => {
    setup();
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("기타 사항")).toBeInTheDocument();
  });

  it("collectPhone이 true면 전화번호를 렌더한다", () => {
    setup({ collectPhone: true });
    expect(screen.getByLabelText("전화번호")).toBeInTheDocument();
  });

  it("collectPhone이 false면 전화번호를 렌더하지 않는다", () => {
    setup({ collectPhone: false });
    expect(screen.queryByLabelText("전화번호")).not.toBeInTheDocument();
  });

  it("커스텀 항목을 라벨과 함께 렌더한다", () => {
    setup({ fields: [{ id: "team", label: "소속", required: false }] });
    expect(screen.getByLabelText("소속")).toBeInTheDocument();
  });

  it("필수 항목의 라벨에는 *가 붙는다", () => {
    setup({ fields: [{ id: "team", label: "소속", required: true }] });
    expect(screen.getByLabelText("소속 *")).toBeInTheDocument();
  });

  it("커스텀 항목에 입력하면 onAnswerChange를 호출한다", async () => {
    const { onAnswerChange } = setup({ fields: [{ id: "team", label: "소속", required: false }] });
    await userEvent.type(screen.getByLabelText("소속"), "1");
    expect(onAnswerChange).toHaveBeenCalledWith("team", "1");
  });
});
