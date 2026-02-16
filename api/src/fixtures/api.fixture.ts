import { test as base } from "@playwright/test";
import { ApiClient } from "../client/ApiClient";
import { AuthService } from "../services/AuthService";
import { UsersService } from "../services/UsersService";
import "../hooks/api.hooks";

type ApiFixtures = {
  apiClient: ApiClient;
  authService: AuthService;
  usersService: UsersService;
};

export const test = base.extend<ApiFixtures>({
  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await client.init();
    await use(client);
    await client.dispose();
  },
  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
  usersService: async ({ apiClient }, use) => {
    await use(new UsersService(apiClient));
  }
});

export { expect } from "@playwright/test";
