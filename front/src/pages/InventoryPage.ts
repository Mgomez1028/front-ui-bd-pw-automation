import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class InventoryPage extends BasePage {
  private readonly title = ".title";
  private readonly cartBadge = ".shopping_cart_badge";
  private readonly cartButton = ".shopping_cart_link";

  async validateLoaded(): Promise<void> {
    await expect(this.page.locator(this.title)).toHaveText("Products");
  }

  async addBackpackToCart(): Promise<void> {
    await this.click("#add-to-cart-sauce-labs-backpack");
  }

  async validateCartCount(expected: string): Promise<void> {
    await expect(this.page.locator(this.cartBadge)).toHaveText(expected);
  }

  async openCart(): Promise<void> {
    await this.click(this.cartButton);
  }
}
