import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function sample(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Try a sample day" }).click();
  await expect(page.getByRole("heading", { name: "Plan your day." })).toBeVisible();
  await expect(page.getByText("Synthetic demonstration values are not real pollution readings.")).toBeVisible();
  await expect(page).toHaveURL(/\/planner$/);
}

async function compare(page: Page) {
  await page.getByRole("button", { name: "Compare my day" }).click();
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole("heading", { name: "Decision Twin." })).toBeVisible();
}

test("explores the landing sample by time, through chapters, and with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = page.getByRole("group", { name: "Sample forecast times" });
  await scene.getByRole("button", { name: "Midday 11:00" }).click();
  await expect(scene.getByRole("button", { name: "Midday 11:00" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".scene-picture")).toHaveAttribute("data-moment", "midday");
  await expect(page.locator(".scene-reading")).toContainText("80 µg/m³");
  await expect(page.locator(".scene-wash-midday")).toHaveCSS("transition-duration", "0s");

  const chapters = page.getByRole("navigation", { name: "On this page" });
  await chapters.getByRole("link", { name: "Forecast" }).click();
  const scrubber = page.getByRole("slider", { name: "Forecast hour" });
  await scrubber.focus();
  await scrubber.press("ArrowRight");
  await expect(scrubber).toHaveAttribute("aria-valuetext", /07:30 IST.*142 micrograms/);

  const twin = chapters.getByRole("link", { name: "Decision Twin" });
  await twin.click();
  await expect(twin).toHaveAttribute("aria-current", "location");
  await page.getByRole("button", { name: "Proposed plan" }).click();
  await expect(page.locator(".decision-value")).toHaveText("40 µg·h/m³");
  await expect(page.locator(".decision-rows")).toContainText("11:00");
  await expect(page.locator(".decision-rows")).toContainText("08:00");
});

test("compares the sample, shows reproducible evidence and recomputes a locked walk", async ({ page }) => {
  await sample(page);
  const forecast = page.getByRole("slider", { name: "Forecast hour" });
  await forecast.focus();
  await forecast.press("End");
  await expect(forecast).toHaveAttribute("aria-valuetext", /23:30 IST.*158 micrograms/);
  await page.getByText("View hourly values and timestamps").click();
  await expect(page.getByRole("table", { name: "Forecast hour starts in India Standard Time" })).toBeVisible();
  await page.getByText("View hourly values and timestamps").click();
  await compare(page);
  await expect(page.getByText("55.56% lower")).toBeVisible();
  await expect(page.getByText("School drop-off")).toHaveCount(2);
  await expect(page.locator(".timeline li", { hasText: "School drop-off" }).filter({ hasText: "08:00" })).toHaveCount(2);
  await page.getByText("How was this calculated?").click();
  const inputs = page.getByRole("table", { name: "Outdoor concentration-time inputs" });
  await expect(inputs.getByRole("cell", { name: "180" })).toBeVisible();
  await expect(inputs.getByRole("cell", { name: "80", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lock Morning walk" }).click();
  await expect(page.getByRole("heading", { name: "Keep your original plan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Original day" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proposed day" })).toHaveCount(0);
});

test("edits activities and persists an accepted, restorable routine only by choice", async ({ page }) => {
  await sample(page);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("saansai:v1:householdPlan"))).toBeNull();
  await page.getByRole("button", { name: "Add activity" }).click();
  await page.getByRole("textbox", { name: "Activity 5 name" }).fill("Read outside");
  await page.getByRole("button", { name: "Remove Read outside" }).click();
  await page.getByRole("checkbox", { name: "Save this routine on this device" }).check();
  await compare(page);
  await page.getByRole("button", { name: "Accept this alternative" }).click();
  await expect(page.getByText("Alternative accepted and saved on this device.")).toBeVisible();
  await expect(page).toHaveURL(/\/planner$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("saansai:v1:householdPlan"))).toContain("2026-12-01T05:30:00.000Z");
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Save this routine on this device" })).toBeChecked();
  await expect(page.getByLabel("Start time", { exact: true }).first()).toHaveValue("11:00");
  await page.getByRole("button", { name: "Restore original routine" }).click();
  await expect(page.getByLabel("Start time", { exact: true }).first()).toHaveValue("07:00");
  await page.getByRole("button", { name: "Delete saved routine" }).click();
  await expect(page.getByText("Saved routine deleted.", { exact: false })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("saansai:")))).toEqual([]);
});

test("provides a usable 320px keyboard path and explicitly handles a live outage", async ({ page }) => {
  async function tabTo(name: string) {
    const control = page.getByRole("button", { name, exact: true });
    for (let step = 0; step < 100; step++) {
      await page.keyboard.press("Tab");
      if (await control.evaluate(element => element === document.activeElement)) return;
    }
    await expect(control).toBeFocused();
  }

  await page.setViewportSize({ width: 320, height: 750 });
  await page.goto("/planner");
  await expect(page.getByText("Forecast unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic demonstration values are not real pollution readings.")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await tabTo("Use synthetic demo");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Synthetic demonstration values are not real pollution readings.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await tabTo("Compare my day");
  await page.keyboard.press("Enter");
  await expect(page.getByText("55.56% lower")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("publishes only aggregate synthetic event counts and applies the attendance threshold", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByText("Lowest modeled value among eligible slots at")).toBeVisible();
  await expect(page.getByText("Below minimum")).toHaveCount(2);
  await page.getByLabel("Minimum attendees").fill("20");
  await page.getByRole("button", { name: "Compare event times" }).click();
  await expect(page.getByText("No event time meets the attendance threshold.")).toBeVisible();
  await expect(page.getByText("Below minimum")).toHaveCount(4);
});

test("shows a recoverable event error and retries the same attendance threshold", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/community/simulate", async route => {
    expect(route.request().postDataJSON()).toEqual({ minimumAttendees: 10 });
    if (++calls === 1) {
      await route.fulfill({ status: 503, json: { error: { code: "TEMPORARILY_UNAVAILABLE", message: "Comparison temporarily unavailable." } } });
    } else {
      await route.continue();
    }
  });
  await page.goto("/community");
  await expect(page.getByText("Event times unavailable", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry comparison" }).click();
  await expect(page.getByText("Lowest modeled value among eligible slots at")).toBeVisible();
  expect(calls).toBe(2);
});

test("honors the system dark preference and keeps the active forecast controls readable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  const evening = page.getByRole("button", { name: "Evening 17:00" });
  await evening.click();
  await expect(evening).toHaveAttribute("aria-pressed", "true");
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
});

test("has no automated WCAG A/AA violations on the landing, planner and result", async ({ page }) => {
  async function check() {
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
  }
  await page.goto("/");
  await check();
  await sample(page);
  await check();
  await compare(page);
  await check();
});

test("enforces the public API contract and returns a signed fallback explanation", async ({ request }) => {
  const forecast = await request.get("/api/forecast?cityId=delhi&mode=demo");
  expect(await forecast.json()).toMatchObject({ source: { dataKind: "demo" } });
  expect((await request.get("/api/forecast?cityId=invalid")).status()).toBe(400);
  expect((await request.get("/api/forecast?cityId=delhi")).status()).toBe(503);
  expect((await request.post("/api/plans/optimize", { data: { plan: {}, forecast: {} } })).status()).toBe(422);
  expect((await request.post("/api/community/simulate", { data: { minimumAttendees: 10, participants: [] } })).status()).toBe(422);
  const original = { cityId: "delhi", dateLocal: "2026-12-01", timezone: "Asia/Kolkata", preference: "balanced",
    activities: [{ id: "walk", label: "Morning walk", environment: "outdoor", startAt: "2026-12-01T07:00:00+05:30",
      durationMinutes: 30, fixed: false, candidateStarts: ["2026-12-01T07:00:00+05:30", "2026-12-01T11:00:00+05:30"] }] };
  const optimization = await request.post("/api/plans/optimize", { data: { plan: original, mode: "demo" } });
  expect(optimization.ok()).toBe(true);
  const result = await optimization.json();
  expect(result).toMatchObject({ status: "ALTERNATIVES_FOUND", explanationToken: expect.any(String) });
  const explanation = await request.post("/api/explain", { data: { token: result.explanationToken } });
  expect(await explanation.json()).toMatchObject({ provider: "fallback" });
  expect((await request.post("/api/explain", { data: { token: "invalid" } })).status()).toBe(422);
});
