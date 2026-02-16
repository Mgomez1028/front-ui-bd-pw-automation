import { config } from "../../../config";
import { AfterAll, BeforeAll } from "@cucumber/cucumber";
import { chromium } from "playwright";
import { uiContext } from "../support/testContext";

BeforeAll(async () => {
  uiContext.browser = await chromium.launch({
    headless: config.frontHeadless,
    slowMo: config.frontSlowMoMs
  });
});

AfterAll(async () => {
  await uiContext.browser?.close();
});
