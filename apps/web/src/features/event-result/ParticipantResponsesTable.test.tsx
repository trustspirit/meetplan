import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParticipantResponsesTable } from "./ParticipantResponsesTable";
import type { ParticipantResponse, ResponseField } from "@meetplan/shared";

const FIELDS: ResponseField[] = [{ id: "team", label: "소속", required: false }];

const RESPONSES: ParticipantResponse[] = [
  {
    id: "r1", name: "김민수", phone: "01012345678", note: "6시 이후",
    answers: { team: "1팀" },
    selectedSlotIds: ["s1"], ownerUid: null, editTokenHash: "x",
    createdAt: "", updatedAt: "",
  },
];

describe("ParticipantResponsesTable", () => {
  it("응답이 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <ParticipantResponsesTable responses={[]} collectPhone fields={FIELDS} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("이름과 커스텀 답변을 보여준다", () => {
    render(<ParticipantResponsesTable responses={RESPONSES} collectPhone fields={FIELDS} />);
    expect(screen.getByText("김민수")).toBeInTheDocument();
    expect(screen.getByText("1팀")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "소속" })).toBeInTheDocument();
  });

  it("전화번호를 하이픈 형식으로 보여준다", () => {
    render(<ParticipantResponsesTable responses={RESPONSES} collectPhone fields={FIELDS} />);
    expect(screen.getByText("010-1234-5678")).toBeInTheDocument();
  });

  it("collectPhone이 false면 전화번호 열이 없다", () => {
    render(
      <ParticipantResponsesTable responses={RESPONSES} collectPhone={false} fields={FIELDS} />
    );
    expect(screen.queryByRole("columnheader", { name: "전화번호" })).not.toBeInTheDocument();
  });

  it("답변이 없는 칸은 대시로 채운다", () => {
    const blank: ParticipantResponse[] = [{ ...RESPONSES[0]!, answers: {} }];
    render(<ParticipantResponsesTable responses={blank} collectPhone fields={FIELDS} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("아무도 기타 사항을 안 남기면 그 열은 없다", () => {
    const { note, ...withoutNote } = RESPONSES[0]!;
    const noNote: ParticipantResponse[] = [withoutNote];
    render(<ParticipantResponsesTable responses={noNote} collectPhone fields={FIELDS} />);
    expect(screen.queryByRole("columnheader", { name: "기타 사항" })).not.toBeInTheDocument();
  });
});
