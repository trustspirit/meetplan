import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmitSuccessAnon } from "./SubmitSuccessAnon";
import { SubmitSuccessAuthed } from "./SubmitSuccessAuthed";

const SMS_LINE = "확정되면 등록하신 번호로 문자 알림이 갑니다";
const NO_PHONE_LINE = "확정되면 주최자가 공유한 경로로 안내합니다";

describe("SubmitSuccessAnon", () => {
  it("collectPhone이 true면 문자 안내를, no-phone 문구는 렌더하지 않는다", () => {
    render(
      <SubmitSuccessAnon
        name="김민수"
        editUrl="https://example.com/edit/abc"
        slotCount={2}
        periodMinutes={30}
        collectPhone={true}
      />
    );
    expect(screen.getByText(SMS_LINE)).toBeInTheDocument();
    expect(screen.queryByText(NO_PHONE_LINE)).not.toBeInTheDocument();
  });

  it("collectPhone이 false면 no-phone 문구를, 문자 안내는 렌더하지 않는다", () => {
    render(
      <SubmitSuccessAnon
        name="김민수"
        editUrl="https://example.com/edit/abc"
        slotCount={2}
        periodMinutes={30}
        collectPhone={false}
      />
    );
    expect(screen.getByText(NO_PHONE_LINE)).toBeInTheDocument();
    expect(screen.queryByText(SMS_LINE)).not.toBeInTheDocument();
  });
});

describe("SubmitSuccessAuthed", () => {
  it("collectPhone이 true면 문자 안내를, no-phone 문구는 렌더하지 않는다", () => {
    render(
      <SubmitSuccessAuthed name="김민수" slotCount={2} periodMinutes={30} collectPhone={true} />
    );
    expect(screen.getByText(SMS_LINE)).toBeInTheDocument();
    expect(screen.queryByText(NO_PHONE_LINE)).not.toBeInTheDocument();
  });

  it("collectPhone이 false면 no-phone 문구를, 문자 안내는 렌더하지 않는다", () => {
    render(
      <SubmitSuccessAuthed name="김민수" slotCount={2} periodMinutes={30} collectPhone={false} />
    );
    expect(screen.getByText(NO_PHONE_LINE)).toBeInTheDocument();
    expect(screen.queryByText(SMS_LINE)).not.toBeInTheDocument();
  });
});
