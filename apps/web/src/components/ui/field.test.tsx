import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("label을 control과 연결한다", () => {
    render(
      <Field label="이름" htmlFor="n">
        <Input id="n" />
      </Field>
    );
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
  });

  it("error가 없으면 hint를 보여준다", () => {
    render(
      <Field label="연락처" htmlFor="p" hint="숫자만 입력">
        <Input id="p" />
      </Field>
    );
    expect(screen.getByText("숫자만 입력")).toBeInTheDocument();
  });

  it("error가 있으면 hint 대신 error를 danger 색으로 보여준다", () => {
    render(
      <Field label="연락처" htmlFor="p" hint="숫자만 입력" error="형식이 올바르지 않습니다">
        <Input id="p" />
      </Field>
    );
    expect(screen.queryByText("숫자만 입력")).not.toBeInTheDocument();
    expect(screen.getByText("형식이 올바르지 않습니다")).toHaveClass("text-danger");
  });

  it("error가 있으면 control에 aria-invalid를 붙인다", () => {
    render(
      <Field label="연락처" htmlFor="p" error="오류">
        <Input id="p" />
      </Field>
    );
    expect(screen.getByLabelText("연락처")).toHaveAttribute("aria-invalid", "true");
  });
});
