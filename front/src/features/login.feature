Feature: SauceDemo checkout
  As a SauceDemo user
  I want to login and buy a product
  So that I can validate the end to end purchase flow

  Scenario: Successful login
    Given the user opens SauceDemo login page
    When the user logs in to SauceDemo
    Then the inventory page is displayed

  Scenario: Successful product purchase
    Given the user opens SauceDemo login page
    When the user logs in to SauceDemo
    And the user adds a product to the cart
    Then the cart contains the selected product
    When the user completes checkout
    Then the order confirmation is shown
