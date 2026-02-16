import { APIResponse } from "@playwright/test";
import { LoginRequest } from "../models/requests/LoginRequest";
import { LoginResponse } from "../models/responses/LoginResponse";
import { BaseService } from "./BaseService";

export class AuthService extends BaseService {
  protected readonly resource = "/auth/login";

  async login(payload: LoginRequest): Promise<APIResponse> {
    return this.client.post(this.path(), { data: payload });
  }

  async loginAndParse(payload: LoginRequest): Promise<LoginResponse> {
    const response = await this.login(payload);
    this.assertStatus(response, 200);
    return this.parseJson<LoginResponse>(response);
  }
}
