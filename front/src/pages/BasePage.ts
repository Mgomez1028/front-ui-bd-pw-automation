import { Page } from "playwright";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  async type(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  async text(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) ?? "";
  }
}
