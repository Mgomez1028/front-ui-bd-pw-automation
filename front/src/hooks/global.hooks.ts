import { config } from "../../../config";
import { AfterAll, BeforeAll } from "@cucumber/cucumber";
import { chromium, firefox, webkit } from "playwright";
import { uiContext } from "../support/testContext";

const browsers = { chromium, firefox, webkit };

BeforeAll(async () => {
  uiContext.browser = await browsers[config.frontBrowser].launch({
    headless: config.frontHeadless,
    slowMo: config.frontSlowMoMs
  });
});

AfterAll(async () => {
  await uiContext.browser?.close();
});
