import { expect, test, type Page } from "@playwright/test";

// Full journey against the real Supabase project. Needs two confirmed test accounts:
// E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD and E2E_OTHER_EMAIL / E2E_OTHER_PASSWORD.
const owner = { email: process.env.E2E_OWNER_EMAIL, password: process.env.E2E_OWNER_PASSWORD };
const other = { email: process.env.E2E_OTHER_EMAIL, password: process.env.E2E_OTHER_PASSWORD };

test.skip(!owner.email || !owner.password || !other.email || !other.password, "Set the E2E_* test account variables to run this.");
test.describe.configure({ mode: "serial" });

async function logIn(page: Page, account: { email?: string; password?: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email!);
  await page.getByLabel("Password").fill(account.password!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

const name = `E2E Test Startup ${Date.now()}`;
let startupUrl = "";

test("a founder creates, publishes and adds financials to a startup", async ({ page }) => {
  await logIn(page, owner);
  await page.getByRole("link", { name: "Add a startup" }).click();
  await page.getByLabel("Startup name").fill(name);
  await page.getByLabel("Stage").selectOption("early_traction");
  await page.getByLabel("District").selectOption("Jammu");
  await page.getByRole("button", { name: "Create startup profile" }).click();

  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("Draft")).toBeVisible();
  startupUrl = page.url().split("?")[0];

  await page.getByRole("button", { name: "Publish profile" }).click();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Team" }).click();
  await page.getByLabel("Name").fill("Co Founder");
  await page.getByLabel("This person is a founder or co-founder").check();
  await page.getByRole("button", { name: "Add to team" }).click();
  await expect(page.getByText("Co Founder was added to the team.")).toBeVisible();

  await page.getByRole("link", { name: "Financials (private)" }).click();
  await page.getByLabel("Cash balance (₹)").fill("600000");
  await page.getByLabel("Monthly burn rate (₹)").fill("50000");
  await page.getByRole("button", { name: "Save figures" }).click();
  await expect(page.getByRole("cell", { name: "12 months" })).toBeVisible();
});

test("another user can see the published profile but not its private pages", async ({ page }) => {
  await logIn(page, other);
  await page.goto(startupUrl);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("link", { name: "Financials (private)" })).toHaveCount(0);

  for (const suffix of ["/financials", "/team", "/edit"]) {
    const response = await page.goto(`${startupUrl}${suffix}`);
    expect(response?.status(), suffix).toBe(404);
  }
});

test("a signed-out visitor sees the profile but nothing private", async ({ page }) => {
  await page.goto(startupUrl);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("600,000")).toHaveCount(0);
});

test("the founder deletes the test startup", async ({ page }) => {
  await logIn(page, owner);
  await page.goto(`${startupUrl}/edit`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete startup" }).click();
  await expect(page.getByText("The startup was deleted.")).toBeVisible();
});
