import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CartPage extends BasePage {
  private readonly cartItemNames = ".inventory_item_name";
  private readonly checkoutButton = "#checkout";
  private readonly continueShoppingButton = "#continue-shopping";
  private readonly cartItem = ".cart_item";

  async validateProductInCart(productName: string): Promise<void> {
    await expect(this.page.locator(this.cartItemNames)).toContainText([productName]);
  }

  async validateProductsInCart(productNames: string[]): Promise<void> {
    await expect(this.page.locator(this.cartItemNames)).toContainText(productNames);
  }

  async continueToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  async removeProductFromCartByName(productName: string): Promise<void> {
    const buttonId = productName.toLowerCase().replace(/ /g, "-");
    await this.click(`#remove-${buttonId}`);
  }

  async validateCartIsEmpty(): Promise<void> {
    await expect(this.page.locator(this.cartItem)).toHaveCount(0);
  }
}