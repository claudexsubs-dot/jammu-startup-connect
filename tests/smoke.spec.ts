import { expect, test } from "@playwright/test";

// Checks that work without signing in.

test("private pages send signed-out visitors to the login page", async ({ page }) => {
  for (const path of ["/dashboard", "/startups/new", "/account"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/[/]/g, "%2F")}`));
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  }
});

test("register form explains what's wrong before contacting the server", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters")).toBeVisible();

  await page.getByLabel("Full name").fill("Asha Sharma");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
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

test("unknown startup ids show not found", async ({ page }) => {
  const response = await page.goto("/startups/not-a-real-id");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("pages fit a phone screen without sideways scrolling", async ({ page }) => {
  for (const path of ["/", "/register", "/login", "/startups"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});
