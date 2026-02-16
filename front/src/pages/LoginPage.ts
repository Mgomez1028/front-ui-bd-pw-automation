import { config } from "../../../config";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  private readonly usernameInput = "#user-name";
  private readonly passwordInput = "#password";
  private readonly submitButton = "#login-button";
  private readonly errorMessage = "[data-test='error']";

  async open(): Promise<void> {
    await this.goto(config.frontBaseUrl);
  }

  async login(username: string, password: string): Promise<void> {
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  async errorText(): Promise<string> {
    return this.text(this.errorMessage);
  }
}
