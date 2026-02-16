import { Browser, BrowserContext, Page } from "playwright";

export interface UiScenarioContext {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
}

export const uiContext: UiScenarioContext = {};
