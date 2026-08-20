import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Card } from "./card";
import { Badge } from "./badge";

describe("Button", () => {
  it("기본 variant는 primary다", () => {
    render(<Button>확인</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");
  });

  it("danger variant는 danger 배경을 쓴다", () => {
    render(<Button variant="danger">삭제</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-danger");
  });

  it("size lg는 터치 타깃 44px를 만족한다", () => {
    render(<Button size="lg">제출</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");
  });

  it("className을 병합한다", () => {
    render(<Button className="w-full">전체</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });
});

describe("Badge", () => {
  it("tone success는 success 색을 쓴다", () => {
    render(<Badge tone="success">진행 중</Badge>);
    expect(screen.getByText("진행 중")).toHaveClass("text-success");
  });

  it("기본 tone은 neutral이다", () => {
    render(<Badge>마감됨</Badge>);
    expect(screen.getByText("마감됨")).toHaveClass("text-text-muted");
  });
});

describe("Card", () => {
  it("surface 배경과 테두리를 갖는다", () => {
    render(<Card data-testid="card">내용</Card>);
    const el = screen.getByTestId("card");
    expect(el).toHaveClass("bg-surface");
    expect(el).toHaveClass("border");
  });
});
