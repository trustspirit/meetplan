import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Menu } from "./menu";
import { Sheet } from "./sheet";

const items = [
  { label: "복제", onClick: vi.fn() },
  { label: "삭제", onClick: vi.fn(), tone: "danger" as const },
];

describe("Menu", () => {
  it("처음에는 항목이 보이지 않는다", () => {
    render(<Menu items={items} label="더보기" />);
    expect(screen.queryByRole("menuitem", { name: "복제" })).not.toBeInTheDocument();
  });

  it("트리거를 누르면 항목이 열린다", async () => {
    render(<Menu items={items} label="더보기" />);
    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    expect(screen.getByRole("menuitem", { name: "복제" })).toBeVisible();
  });

  it("항목을 고르면 onClick을 부르고 메뉴를 닫는다", async () => {
    const onClick = vi.fn();
    render(<Menu items={[{ label: "복제", onClick }]} label="더보기" />);
    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "복제" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menuitem", { name: "복제" })).not.toBeInTheDocument();
  });

  it("Escape로 닫힌다", async () => {
    render(<Menu items={items} label="더보기" />);
    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem", { name: "복제" })).not.toBeInTheDocument();
  });
});

describe("Sheet", () => {
  it("open이 false면 렌더되지 않는다", () => {
    render(<Sheet open={false} onClose={() => {}} title="메뉴"><p>내용</p></Sheet>);
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });

  it("open이 true면 dialog로 렌더된다", () => {
    render(<Sheet open onClose={() => {}} title="메뉴"><p>내용</p></Sheet>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeVisible();
  });

  it("배경을 누르면 onClose를 호출한다", async () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="메뉴"><p>내용</p></Sheet>);
    await userEvent.click(screen.getByTestId("sheet-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
