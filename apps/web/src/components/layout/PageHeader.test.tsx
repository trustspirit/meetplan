import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { PageHeader } from "./PageHeader";

function renderHeader(props: Parameters<typeof PageHeader>[0]) {
  return render(<MemoryRouter><PageHeader {...props} /></MemoryRouter>);
}

describe("PageHeader", () => {
  it("제목을 heading으로 렌더한다", () => {
    renderHeader({ title: "주간 1:1 미팅" });
    expect(screen.getByRole("heading", { name: "주간 1:1 미팅" })).toBeInTheDocument();
  });

  it("제목은 화면 크기와 무관하게 한 번만 렌더된다", () => {
    // 데스크탑/모바일 두 트리로 중복 렌더하던 회귀를 막는다 (스펙 §1 P2).
    renderHeader({ title: "주간 1:1 미팅", subtitle: "30분" });
    expect(screen.getAllByText("주간 1:1 미팅")).toHaveLength(1);
    expect(screen.getAllByText("30분")).toHaveLength(1);
  });

  it("backTo가 없으면 뒤로가기 링크가 없다", () => {
    renderHeader({ title: "새 이벤트" });
    expect(screen.queryByRole("link", { name: /돌아가기|내 이벤트/ })).not.toBeInTheDocument();
  });

  it("backTo가 있으면 그 경로로 가는 링크를 그린다", () => {
    renderHeader({ title: "결과", backTo: "/dashboard", backLabel: "내 이벤트" });
    expect(screen.getByRole("link", { name: "내 이벤트" })).toHaveAttribute("href", "/dashboard");
  });

  it("overflowActions를 열어 항목을 실행한다", async () => {
    const onClick = vi.fn();
    renderHeader({ title: "결과", overflowActions: [{ label: "삭제", onClick, tone: "danger" }] });
    await userEvent.click(screen.getByRole("button", { name: "더보기" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
