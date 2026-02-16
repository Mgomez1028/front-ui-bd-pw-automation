import { config } from "../../../config";
import { expect, test } from "../fixtures/api.fixture";

test.describe("Auth service", () => {
  test("should login with valid credentials", async ({ authService }) => {
    const body = await authService.loginAndParse({
      username: config.e2eUsername,
      password: config.e2ePassword
    });

    expect(body.accessToken).toBeTruthy();
  });

  test("should fail login with invalid credentials", async ({ authService }) => {
    const response = await authService.login({
      username: "invalid-user",
      password: "wrong-password"
    });

    expect([400, 401]).toContain(response.status());
  });
});
