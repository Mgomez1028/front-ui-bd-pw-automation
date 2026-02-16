import { IWorldOptions, setWorldConstructor, World } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page } from "playwright";

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  private scenarioData: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  setData<T>(key: string, value: T): void {
    this.scenarioData[key] = value as unknown;
  }

  getData<T>(key: string): T | undefined {
    return this.scenarioData[key] as T | undefined;
  }

  clearData(): void {
    this.scenarioData = {};
  }
}

setWorldConstructor(CustomWorld);
