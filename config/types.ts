export type TestEnv = "local" | "qa" | "prod";

export interface AppConfig {
  env: TestEnv;
  frontBaseUrl: string;
  frontUsername: string;
  frontPassword: string;
  frontHeadless: boolean;
  frontSlowMoMs: number;
  apiBaseUrl: string;
  apiTimeout: number;
  apiToken?: string;
  e2eUsername: string;
  e2ePassword: string;
}
