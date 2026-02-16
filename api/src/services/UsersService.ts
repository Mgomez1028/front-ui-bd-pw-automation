import { APIResponse } from "@playwright/test";
import { UsersListResponse } from "../models/responses/UserResponse";
import { BaseService } from "./BaseService";

export class UsersService extends BaseService {
  protected readonly resource = "/users";

  async listUsers(limit = 10, skip = 0): Promise<APIResponse> {
    return this.client.get(this.path(), { query: { limit, skip } });
  }

  async listUsersAndParse(limit = 10, skip = 0): Promise<UsersListResponse> {
    const response = await this.listUsers(limit, skip);
    this.assertStatus(response, 200);
    return this.parseJson<UsersListResponse>(response);
  }
}
