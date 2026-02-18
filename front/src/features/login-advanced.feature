Feature: SauceDemo login scenarios
  As a SauceDemo user
  I want to validate different login scenarios
  So that I can ensure the authentication works correctly

  # ── Scenario con expresiones regulares (Cucumber Expressions) ──
  Scenario: Login with valid credentials shows inventory with 6 products
    Given the user opens SauceDemo login page
    When the user logs in with username "standard_user" and password "secret_sauce"
    Then the user should see the "Products" page title
    And the cart badge should show "0" items

  Scenario: Login with invalid credentials shows error message
    Given the user opens SauceDemo login page
    When the user logs in with username "locked_out_user" and password "secret_sauce"
    Then the user should see an error containing "Sorry, this user has been locked out"

  # ── Scenario Outline con Examples ──
  Scenario Outline: Login attempt with different credentials
    Given the user opens SauceDemo login page
    When the user logs in with username "<username>" and password "<password>"
    Then the user should see an error containing "<expected_error>"

    Examples:
      | username        | password       | expected_error                              |
      | locked_out_user | secret_sauce   | Sorry, this user has been locked out        |
      |                 | secret_sauce   | Username is required                        |
      | standard_user   |                | Password is required                        |
      |                 |                | Username is required                        |

  # ── Scenario con DataTable ──
  Scenario: Complete checkout with customer data from table
    Given the user opens SauceDemo login page
    When the user logs in with username "standard_user" and password "secret_sauce"
    And the user adds a product to the cart
    And the user proceeds to checkout with the following data:
      | firstName | lastName   | postalCode |
      | QA        | Automation | 12345      |
    Then the order confirmation is shown

  # ── Scenario con DataTable de múltiples filas ──
  Scenario: Add multiple products and validate cart
    Given the user opens SauceDemo login page
    When the user logs in with username "standard_user" and password "secret_sauce"
    And the user adds the following products to the cart:
      | productName              |
      | Sauce Labs Backpack      |
      | Sauce Labs Bike Light    |
      | Sauce Labs Bolt T-Shirt  |
    Then the cart badge should show "3" items
    And the cart should contain the following products:
      | productName              |
      | Sauce Labs Backpack      |
      | Sauce Labs Bike Light    |
      | Sauce Labs Bolt T-Shirt  |
