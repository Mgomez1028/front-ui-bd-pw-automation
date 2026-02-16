import { expect, test } from "../fixtures/api.fixture";

test.describe("Users service", () => {
  test("should list users", async ({ usersService }) => {
    const body = await usersService.listUsersAndParse(10, 0);

    expect(body.users.length).toBeGreaterThan(0);
    expect(body.users[0].email).toContain("@");
  });

  test("should return users endpoint response structure", async ({ usersService }) => {
    const response = await usersService.listUsers(5, 5);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { users: unknown[]; total: number; skip: number; limit: number };
    expect(Array.isArray(body.users)).toBeTruthy();
    expect(body.limit).toBe(5);
    expect(body.skip).toBe(5);
    expect(body.total).toBeGreaterThan(0);
  });
});
