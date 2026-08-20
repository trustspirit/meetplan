import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./tabs";

const ITEMS = [
  { value: "matrix", label: "응답 현황" },
  { value: "matching", label: "자동 배정" },
] as const;

describe("Tabs", () => {
  it("선택된 탭에 aria-selected를 준다", () => {
    render(<Tabs items={ITEMS} value="matrix" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "응답 현황" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "자동 배정" })).toHaveAttribute("aria-selected", "false");
  });

  it("클릭하면 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    render(<Tabs items={ITEMS} value="matrix" onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "자동 배정" }));
    expect(onChange).toHaveBeenCalledWith("matching");
  });

  it("오른쪽 화살표로 다음 탭으로 이동한다", async () => {
    const onChange = vi.fn();
    render(<Tabs items={ITEMS} value="matrix" onChange={onChange} />);
    screen.getByRole("tab", { name: "응답 현황" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("matching");
  });

  it("마지막 탭에서 오른쪽 화살표를 누르면 처음으로 순환한다", async () => {
    const onChange = vi.fn();
    render(<Tabs items={ITEMS} value="matching" onChange={onChange} />);
    screen.getByRole("tab", { name: "자동 배정" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("matrix");
  });
});
