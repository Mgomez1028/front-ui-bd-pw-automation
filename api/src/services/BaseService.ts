import { APIResponse, expect } from "@playwright/test";
import { ApiClient } from "../client/ApiClient";

export abstract class BaseService {
  protected readonly client: ApiClient;
  protected abstract readonly resource: string;

  constructor(client: ApiClient) {
    this.client = client;
  }

  protected path(suffix = ""): string {
    return `${this.resource}${suffix}`;
  }

  protected async parseJson<T>(response: APIResponse): Promise<T> {
    const body = (await response.json()) as T;
    return body;
  }

  protected assertStatus(response: APIResponse, expectedStatus: number): void {
    expect(response.status(), `Expected status ${expectedStatus} but got ${response.status()}`).toBe(expectedStatus);
  }
}
