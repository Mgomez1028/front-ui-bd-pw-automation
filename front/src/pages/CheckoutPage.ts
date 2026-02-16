import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckoutPage extends BasePage {
  private readonly firstNameInput = "#first-name";
  private readonly lastNameInput = "#last-name";
  private readonly postalCodeInput = "#postal-code";
  private readonly continueButton = "#continue";
  private readonly finishButton = "#finish";
  private readonly successTitle = ".complete-header";

  async fillInformation(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.type(this.firstNameInput, firstName);
    await this.type(this.lastNameInput, lastName);
    await this.type(this.postalCodeInput, postalCode);
    await this.click(this.continueButton);
  }

  async finishOrder(): Promise<void> {
    await this.click(this.finishButton);
  }

  async validateOrderCompleted(): Promise<void> {
    await expect(this.page.locator(this.successTitle)).toHaveText("Thank you for your order!");
  }
}
