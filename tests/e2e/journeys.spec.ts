import { expect, test, type Browser, type Page } from "@playwright/test";
import { DEMO_PASSWORD, IS_LOCAL, newFounder, signIn, taxonomyIds, unique } from "../support/supabase";

// Full journeys in the browser, using the demo accounts from supabase/seed/02_local_accounts.sql.
test.skip(!IS_LOCAL, "Needs the local Supabase stack with the demo accounts (supabase db reset).");
test.describe.configure({ mode: "serial" });

async function logIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function asUser(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page, email);
  return { page, close: () => context.close() };
}

test("a founder registers, builds a profile, applies, and answers the centre's request for more information", async ({ page, browser }) => {
  const email = `${unique("e2e")}@udyamsetu.test`;
  const startupName = `Kahwa Trails ${email.slice(4, 10)}`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Ritu Sharma");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByLabel("Your district").selectOption("Udhampur");
  await page.getByLabel(/I'm domiciled in Jammu/).check();
  await page.getByRole("button", { name: "Create free account" }).click();
  await expect(page).toHaveURL(/\/venture/);

  // Trying to apply before the profile is complete explains what's missing.
  await page.goto("/centres/iim-jammu/apply");
  await expect(page.getByRole("link", { name: "Create your venture profile" })).toBeVisible();

  // Phone is asked for later, in "About you", rather than at sign-up.
  await page.goto("/venture/edit/founder");
  await page.getByRole("textbox", { name: "Phone" }).fill("9000000123");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/venture\/edit\/basics/);
  await page.getByLabel("Startup name").fill(startupName);
  await page.getByLabel("Short description").fill("Guided heritage walks with local tea makers.");
  await page.getByLabel("Stage", { exact: true }).selectOption({ label: "Early stage" });
  await page.getByLabel("Tourism and Hospitality", { exact: true }).check();
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/venture\/edit\/problem/);
  await page.getByLabel("What problem are you solving?").fill("Visitors miss the local food culture.");
  await page.getByLabel("Your solution").fill("Small-group walks booked online.");
  await page.getByLabel("Target customers").fill("Pilgrims and weekend visitors in Katra.");
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/venture\/edit\/traction/);
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/venture\/edit\/support/);
  await page.getByLabel(/^Mentorship/).check();
  await page.getByLabel(/^Market access/).check();
  await page.getByRole("button", { name: "Save and finish" }).click();
  await expect(page.getByText("Ready to apply")).toBeVisible();

  // Recommendations explain themselves; the founder still chooses.
  await page.goto("/centres");
  await expect(page.getByText(/Recommended because this centre/).first()).toBeVisible();

  await page.goto("/centres/iim-jammu/apply");
  await page.getByRole("button", { name: "Start application" }).click();
  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]{36}/);
  const applicationUrl = page.url();
  await page.getByLabel(/Why IIM Jammu Incubation Centre/).fill("We need help with pricing and partnerships.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Your application was submitted.")).toBeVisible();

  // Applying again resumes the same application instead of creating a duplicate.
  await page.goto("/centres/iim-jammu/apply");
  await expect(page).toHaveURL(applicationUrl);

  // Centre staff review it and ask for more information.
  const staff = await asUser(browser, "staff@udyamsetu.local");
  await staff.page.goto("/manage/iim-jammu/applications");
  await staff.page.getByRole("link", { name: startupName }).click();
  await expect(staff.page.getByText("Guided heritage walks with local tea makers.")).toBeVisible();
  await staff.page.getByLabel("Change status to").selectOption({ label: "More information needed" });
  await staff.page.getByLabel("Note to the founder").fill("How many walks have you run so far?");
  await staff.page.getByRole("button", { name: "Update status" }).click();
  await expect(staff.page.getByText("The application status was updated")).toBeVisible();

  // The founder sees the request, with the note, and replies.
  await page.goto(applicationUrl);
  await expect(page.getByText("How many walks have you run so far?").first()).toBeVisible();
  await page.getByLabel("Your reply").fill("Twelve walks since August.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Your reply was sent to the centre.")).toBeVisible();
  await expect(page.getByText("Under review").first()).toBeVisible();

  // The centre starts a conversation; the founder gets it in the inbox.
  await staff.page.reload();
  await staff.page.getByText(/^Message /).click();
  await staff.page.getByLabel("Message", { exact: true }).fill("Thanks! Could you visit us next week?");
  await staff.page.getByRole("button", { name: "Send message" }).click();
  await expect(staff.page.getByText("Message sent.")).toBeVisible();
  await staff.close();

  await page.goto("/messages");
  await page.getByRole("link", { name: /IIM Jammu Incubation Centre/ }).first().click();
  await expect(page.getByText("Could you visit us next week?")).toBeVisible();
  await page.getByLabel("Reply").fill("Yes, Tuesday works.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Yes, Tuesday works.")).toBeVisible();
});

test("a paid session stays pending until the expert sends payment instructions and confirms", async ({ page, browser }) => {
  const admin = await signIn("admin@udyamsetu.local");
  const founder = await newFounder(await taxonomyIds(admin.client), { name: "Imran" });

  await logIn(page, founder.email);
  await page.goto("/experts");
  await page.getByRole("link", { name: "Dr. Asha Verma (Local demo)" }).click();
  await expect(page.getByText(/UdyamSetu never takes payments/).first()).toBeVisible();
  await page.locator(".day-chip").nth(1).click();
  await page.locator(".time-chip").last().click();
  await page.locator(".segmented label", { hasText: "Online" }).click();
  await page.getByText("Add a note for the expert (optional)").click();
  await page.getByLabel("What would you like to discuss?").fill("Choosing a cloud provider.");
  await page.getByRole("button", { name: /^Request / }).click();
  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]{36}/);
  await expect(page.getByText("Pending").first()).toBeVisible();
  const bookingUrl = page.url();

  const expert = await asUser(browser, "expert@udyamsetu.local");
  await expert.page.goto("/expert");
  await expert.page.getByRole("link", { name: "Imran's venture" }).first().click();
  await expect(expert.page.getByText("Choosing a cloud provider.").first()).toBeVisible();
  await expert.page.getByLabel("How the founder should pay you").fill("Pay at the incubation centre front desk before the session.");
  await expert.page.getByRole("button", { name: "Send instructions" }).click();
  await expect(expert.page.getByText("The booking was updated")).toBeVisible();

  await page.goto(bookingUrl);
  await expect(page.getByText("Pay at the incubation centre front desk before the session.").first()).toBeVisible();
  await expect(page.getByText("How to join")).toHaveCount(0);

  await expert.page.getByLabel("Meeting link").fill("https://meet.example.com/asha-imran");
  await expert.page.getByRole("button", { name: "Confirm session" }).click();
  await expect(expert.page.getByText("The booking was updated")).toBeVisible();
  await expert.close();

  await page.goto(bookingUrl);
  await expect(page.getByText("Confirmed").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "https://meet.example.com/asha-imran" })).toBeVisible();
  await expect(page.getByText(/Reminder:/)).toBeVisible();

  // Cancelling frees the time for someone else.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Cancel session" }).click();
  await expect(page.getByText("The request was cancelled.")).toBeVisible();
});

test("people can't open other roles' pages, and the master admin can see the attempt", async ({ page, browser }) => {
  await logIn(page, "founder@udyamsetu.local");
  for (const path of ["/admin", "/manage/iim-jammu", "/expert"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "You don't have access to that page" })).toBeVisible();
  }

  const staff = await asUser(browser, "staff@udyamsetu.local");
  await staff.page.goto("/manage/iit-jammu/applications");
  await expect(staff.page.getByRole("heading", { name: "You don't have access to that page" })).toBeVisible();
  await staff.close();

  const admin = await asUser(browser, "admin@udyamsetu.local");
  await admin.page.goto("/admin/audit?group=access");
  await expect(admin.page.getByText("Page: /manage/iit-jammu/applications").first()).toBeVisible();
  await admin.close();
});

test("the master admin adds a centre and creates a staff invitation link", async ({ page }) => {
  const name = `Ramban Valley Hub ${unique("x").slice(-5)}`;
  await logIn(page, "admin@udyamsetu.local");
  await page.goto("/admin/centres/new");
  await page.getByLabel("Centre name").fill(name);
  await page.getByLabel("District").selectOption("Ramban");
  await page.getByLabel(/^Early stage/).check();
  await page.getByLabel(/^Mentorship/).check();
  await page.getByRole("button", { name: "Create centre" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.getByLabel("Invite staff by email").fill(`${unique("staff")}@udyamsetu.test`);
  await page.getByRole("button", { name: "Create invitation link" }).click();
  await expect(page.getByText(/\/invite\/[0-9a-f-]{36}/)).toBeVisible();

  await page.goto("/centres");
  await expect(page.getByRole("link", { name }).first()).toBeVisible();
});
