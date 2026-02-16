import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CartPage extends BasePage {
  private readonly cartItemNames = ".inventory_item_name";
  private readonly checkoutButton = "#checkout";

  async validateProductInCart(productName: string): Promise<void> {
    await expect(this.page.locator(this.cartItemNames)).toContainText([productName]);
  }

  async continueToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }
}
