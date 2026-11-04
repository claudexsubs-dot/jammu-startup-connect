import { expect, test } from "@playwright/test";

// Checks that work without signing in.

test("private pages send signed-out visitors to the login page", async ({ page }) => {
  for (const path of ["/dashboard", "/venture", "/applications", "/manage", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/[/]/g, "%2F")}`));
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  }
});

test("register form explains what's wrong before contacting the server", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters")).toBeVisible();
  await expect(page.getByText("Confirm that you are domiciled in Jammu to register as a founder")).toBeVisible();

  await page.getByLabel("Full name").fill("Asha Sharma");
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  // The name the person typed is kept, so they don't have to type it again.
  await expect(page.getByLabel("Full name")).toHaveValue("Asha Sharma");
});

test("login and password reset pages link to each other", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
});

test("reset password page refuses visitors who didn't come from an email link", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByText("only works from the link in your reset email")).toBeVisible();
});

test("a broken email link shows a helpful page", async ({ page }) => {
  await page.goto("/auth/callback?code=invalid");
  await expect(page.getByRole("heading", { name: "That link didn't work" })).toBeVisible();
});

test("unknown centres and experts show not found", async ({ page }) => {
  const response = await page.goto("/centres/not-a-real-centre");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  const expert = await page.goto("/experts/not-a-real-id");
  expect(expert?.status()).toBe(404);
});

test("anyone can browse the listed centres, each with its source, and the site says it is independent", async ({ page }) => {
  await page.goto("/centres");
  await expect(page.getByRole("heading", { name: "Incubation centres in Jammu and Kashmir" })).toBeVisible();
  await expect(page.getByText("Sample listing")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "IIM Jammu Incubation Centre" })).toBeVisible();
  await expect(page.getByText("UdyamSetu is an independent platform.")).toBeVisible();
  await expect(page.getByText(/not a government portal/)).toBeVisible();

  await page.getByLabel("Stage supported").selectOption({ label: "Established" });
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("link", { name: "IIT Jammu Incubation Centre" })).toBeVisible();
  await expect(page.getByRole("link", { name: "IIM Jammu Incubation Centre" })).toHaveCount(0);

  await page.goto("/centres/iim-jammu");
  await expect(page.getByText("Listing source:")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mentors and experts" })).toBeVisible();
  await expect(page.getByText("Dr. Asha Verma (Local demo)")).toBeVisible();
});

test("visitors can see open times and pick one before creating an account", async ({ page }) => {
  await page.goto("/experts");
  await expect(page.getByRole("heading", { name: "Book a mentor or expert" })).toBeVisible();
  await page.getByRole("link", { name: "Dr. Asha Verma (Local demo)" }).click();
  await expect(page.getByRole("heading", { name: "Book a session" })).toBeVisible();
  await page.locator(".time-chip").first().click();
  await page.getByRole("link", { name: "Continue to book" }).click();
  await expect(page).toHaveURL(/\/register\?next=%2Fexperts%2F[0-9a-f-]{36}%3Fslot%3D/);
  await expect(page.getByRole("heading", { name: "Create an account to book" })).toBeVisible();
});

test("a filter with no matches suggests broader filters and still shows every centre", async ({ page }) => {
  await page.goto("/centres?q=zzzz-no-such-centre");
  await expect(page.getByText(/No centres match/)).toBeVisible();
  await expect(page.getByRole("link", { name: "IIM Jammu Incubation Centre" }).first()).toBeVisible();
});

test("pages fit a phone screen without sideways scrolling", async ({ page }) => {
  for (const path of ["/", "/register", "/login", "/centres", "/centres/iim-jammu", "/experts", "/about"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});
