import { APIRequestContext, APIResponse, request } from "@playwright/test";
import { config } from "../../../config";

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  data?: unknown;
}

export class ApiClient {
  private context?: APIRequestContext;

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      extraHTTPHeaders: {
        Accept: "application/json",
        ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {})
      }
    });
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
  }

  private ensureContext(): APIRequestContext {
    if (!this.context) {
      throw new Error("ApiClient not initialized. Call init() first.");
    }

    return this.context;
  }

  async get(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().get(url, { headers: options?.headers, params: options?.query });
  }

  async post(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().post(url, {
      headers: options?.headers,
      params: options?.query,
      data: options?.data
    });
  }

  async put(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().put(url, {
      headers: options?.headers,
      params: options?.query,
      data: options?.data
    });
  }

  async delete(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().delete(url, {
      headers: options?.headers,
      params: options?.query,
      data: options?.data
    });
  }
}
