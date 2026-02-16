import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  private readonly title = ".title";

  async validateProductsTitle(): Promise<void> {
    await expect(this.page.locator(this.title)).toHaveText("Products");
  }
}
