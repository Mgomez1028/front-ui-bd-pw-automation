import { expect } from "@playwright/test";
import { DataTable, Then, When } from "@cucumber/cucumber";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { CustomWorld } from "../support/world";

// ── Steps con expresiones regulares ──

When(
  /^the user logs in with username "([^"]*)" and password "([^"]*)"$/,
  async function (this: CustomWorld, username: string, password: string) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const loginPage = new LoginPage(this.page);
    await loginPage.login(username, password);
  }
);

Then(
  /^the user should see the "([^"]*)" page title$/,
  async function (this: CustomWorld, expectedTitle: string) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    await expect(this.page.locator(".title")).toHaveText(expectedTitle);
  }
);

Then(
  /^the cart badge should show "(\d+)" items$/,
  async function (this: CustomWorld, expectedCount: string) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    if (expectedCount === "0") {
      await expect(this.page.locator(".shopping_cart_badge")).not.toBeVisible();
    } else {
      await expect(this.page.locator(".shopping_cart_badge")).toHaveText(expectedCount);
    }
  }
);

Then(
  /^the user should see an error containing "([^"]*)"$/,
  async function (this: CustomWorld, expectedError: string) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const loginPage = new LoginPage(this.page);
    const errorText = await loginPage.errorText();
    expect(errorText).toContain(expectedError);
  }
);

// ── Step con DataTable ──

When(
  /^the user proceeds to checkout with the following data:$/,
  async function (this: CustomWorld, dataTable: DataTable) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const data = dataTable.hashes()[0];

    const cartPage = new CartPage(this.page);
    await cartPage.continueToCheckout();

    const checkoutPage = new CheckoutPage(this.page);
    await checkoutPage.fillInformation(
      data.firstName,
      data.lastName,
      data.postalCode
    );
    await checkoutPage.finishOrder();
  }
);

// ── Steps con DataTable de múltiples filas ──

When(
  /^the user adds the following products to the cart:$/,
  async function (this: CustomWorld, dataTable: DataTable) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const inventoryPage = new InventoryPage(this.page);
    await inventoryPage.validateLoaded();

    const products = dataTable.hashes();
    for (const row of products) {
      await inventoryPage.addProductToCartByName(row.productName);
    }
  }
);

Then(
  /^the cart should contain the following products:$/,
  async function (this: CustomWorld, dataTable: DataTable) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const products = dataTable.hashes().map((row) => row.productName);

    const inventoryPage = new InventoryPage(this.page);
    await inventoryPage.openCart();

    const cartPage = new CartPage(this.page);
    await cartPage.validateProductsInCart(products);
  }
);

When(
  /^the user removes "([^"]*)" from the cart$/,
  async function (this: CustomWorld, productName: string) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const cartPage = new CartPage(this.page);
    await cartPage.removeProductFromCartByName(productName);
    //await this.page!.waitForTimeout(500); // Espera para que el DOM se actualice
    //await this.page!.reload(); // Recarga la página para reflejar los cambios
    //await this.page!.pause
  }
);

Then(
  /^the cart should be empty$/,
  async function (this: CustomWorld) {
    if (!this.page) {
      throw new Error("Playwright page is not initialized");
    }

    const cartPage = new CartPage(this.page);
    await cartPage.validateCartIsEmpty();
});
