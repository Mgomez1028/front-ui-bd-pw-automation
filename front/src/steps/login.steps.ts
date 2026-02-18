import { Given, Then, When } from "@cucumber/cucumber";
import { config } from "../../../config";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { HomePage } from "../pages/HomePage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { CustomWorld } from "../support/world";


type CheckoutData = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

Given("the user opens SauceDemo login page", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const loginPage = new LoginPage(this.page);
  await loginPage.open();
});

When("the user logs in to SauceDemo", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const loginPage = new LoginPage(this.page);
  await loginPage.login(config.frontUsername, config.frontPassword);
});

Then("the inventory page is displayed", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const homePage = new HomePage(this.page);
  await homePage.validateProductsTitle();
});

When("the user adds a product to the cart", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  this.setData("selectedProductName", "Sauce Labs Backpack");
  // Example: data shared from this step to the next ones using Cucumber World.
  console.log(`[WORLD][SET] selectedProductName=${this.getData<string>("selectedProductName")}`);

  const inventoryPage = new InventoryPage(this.page);
  await inventoryPage.validateLoaded();
  await inventoryPage.addBackpackToCart();
  await inventoryPage.validateCartCount("1");
  await inventoryPage.openCart();
});

Then("the cart contains the selected product", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }
  const selectedProductName = this.getData<string>("selectedProductName");
  if (!selectedProductName) {
    throw new Error("selectedProductName was not set in previous step");
  }
  // Example: consuming data set in a previous step from Cucumber World.
  console.log(`[WORLD][USE] selectedProductName=${selectedProductName}`);

  const cartPage = new CartPage(this.page);
  await cartPage.validateProductInCart(selectedProductName);
});

When("the user completes checkout", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const checkoutData: CheckoutData = {
    firstName: "QA",
    lastName: "Automation",
    postalCode: "12345"
  };
  this.setData("checkoutData", checkoutData);
  console.log(`[WORLD][SET] checkoutData=${JSON.stringify(this.getData<CheckoutData>("checkoutData"))}`);

  const cartPage = new CartPage(this.page);
  await cartPage.continueToCheckout();

  const checkoutDataFromWorld = this.getData<CheckoutData>("checkoutData");
  if (!checkoutDataFromWorld) {
    throw new Error("checkoutData was not set in previous step");
  }

  const checkoutPage = new CheckoutPage(this.page);
  console.log(`[WORLD][USE] checkoutData=${JSON.stringify(checkoutDataFromWorld)}`);
  await checkoutPage.fillInformation(
    checkoutDataFromWorld.firstName,
    checkoutDataFromWorld.lastName,
    checkoutDataFromWorld.postalCode
  );
  await checkoutPage.finishOrder();
});

Then("the order confirmation is shown", async function (this: CustomWorld) {
  if (!this.page) {
    throw new Error("Playwright page is not initialized");
  }

  const checkoutPage = new CheckoutPage(this.page);
  await checkoutPage.validateOrderCompleted();
});
