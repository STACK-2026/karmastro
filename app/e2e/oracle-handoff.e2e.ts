import { expect, test } from "@playwright/test";

test("transfers a calculator profile without leaking it and waits for the missing first name", async ({ page }) => {
  const analyticsBodies: string[] = [];
  const chatBodies: Array<Record<string, unknown>> = [];

  await page.route("https://nkjbmbdrvejemzrggxvr.supabase.co/rest/v1/**", async (route) => {
    analyticsBodies.push(route.request().postData() || "");
    await route.fulfill({ status: 201, body: "" });
  });
  await page.route("https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat", async (route) => {
    chatBodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `data: ${JSON.stringify({ choices: [{ delta: { content: "Ton chemin est prêt." } }], conversation_id: "11111111-1111-4111-8111-111111111111" })}\n\ndata: [DONE]\n\n`,
    });
  });

  await page.goto("/outils/chemin-de-vie/");
  await page.locator("#birth-date").fill("1990-02-14");
  await page.locator("#life-path-form button[type=submit]").click();
  await expect(page.locator("#result")).toBeVisible();
  await page.locator("#km-oracle").click();

  await expect(page).toHaveURL(/\/oracle\/\?src=chemin-de-vie$/);
  await expect(page.locator("#oracle-birth-date")).toHaveValue("1990-02-14");
  await expect(page.locator("#oracle-first-name")).toBeFocused();
  expect(chatBodies).toHaveLength(0);
  expect(await page.evaluate(() => sessionStorage.getItem("km_oracle_handoff"))).toBeNull();

  await page.locator("#oracle-first-name").fill("Testeur");
  await page.locator("#oracle-profile-form button[type=submit]").click();
  await expect(page.getByText("Ton chemin est prêt.")).toBeVisible();

  expect(chatBodies).toHaveLength(1);
  expect(chatBodies[0]).toMatchObject({
    profile: { firstName: "Testeur", birthDate: "1990-02-14" },
  });
  expect(JSON.stringify(chatBodies[0])).toContain("Que révèle mon chemin de vie");

  const analytics = analyticsBodies.join("\n");
  expect(analytics).toContain("oracle_cta_click");
  expect(analytics).toContain("oracle_entry_viewed");
  expect(analytics).not.toContain("1990-02-14");
  expect(analytics).not.toContain("Testeur");
  expect(analytics).not.toContain("Que révèle mon chemin de vie");
});

test("scrubs a legacy private question before analytics observes the page", async ({ page }) => {
  const analyticsBodies: string[] = [];
  let chatQuestion = "";

  await page.route("https://nkjbmbdrvejemzrggxvr.supabase.co/rest/v1/**", async (route) => {
    analyticsBodies.push(route.request().postData() || "");
    await route.fulfill({ status: 201, body: "" });
  });
  await page.route("https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat", async (route) => {
    const body = route.request().postDataJSON();
    chatQuestion = body.messages?.[0]?.content || "";
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `data: ${JSON.stringify({ choices: [{ delta: { content: "Réponse test." } }] })}\n\ndata: [DONE]\n\n`,
    });
  });

  await page.goto("/oracle/?q=Question%20tr%C3%A8s%20priv%C3%A9e%20sur%20Alice&birthDate=1990-02-14");
  await expect(page).toHaveURL(/\/oracle\/$/);
  await expect(page.getByText("Réponse test.")).toBeVisible();
  expect(chatQuestion).toBe("Question très privée sur Alice");

  const analytics = analyticsBodies.join("\n");
  expect(analytics).not.toContain("Alice");
  expect(analytics).not.toContain("1990-02-14");
  expect(analytics).not.toContain("Question très privée");
});
