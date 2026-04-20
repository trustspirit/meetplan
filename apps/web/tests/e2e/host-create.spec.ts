import { test, expect } from "@playwright/test";

// 이 smoke는 로그인 없이 접근 가능한 상태만 확인.
// 실제 로그인 흐름/Firestore 저장 e2e는 Plan 4에서 에뮬레이터 연동 포함해 추가.

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "MeetPlan" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Google로 계속하기/ })).toBeVisible();
});

test("event create page redirects unauth users to login", async ({ page }) => {
  await page.goto("/events/new");
  await expect(page).toHaveURL(/\/login/);
});
