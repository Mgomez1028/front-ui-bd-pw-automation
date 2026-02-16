import { After, Before, ITestCaseHookParameter, Status } from "@cucumber/cucumber";
import fs from "node:fs";
import path from "node:path";
import { CustomWorld } from "../support/world";
import { uiContext } from "../support/testContext";

Before(async function (this: CustomWorld) {
  if (!uiContext.browser) {
    throw new Error("Browser is not initialized. Ensure BeforeAll hook has run.");
  }

  this.clearData();
  this.context = await uiContext.browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  if (this.page && scenario.result?.status === Status.FAILED) {
    const reportDir = path.resolve(process.cwd(), "reports/front/screenshots");
    fs.mkdirSync(reportDir, { recursive: true });

    const fileName = `${scenario.pickle.name.replace(/\s+/g, "_")}-${Date.now()}.png`;
    const screenshotPath = path.join(reportDir, fileName);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
  }

  await this.context?.close();
});
