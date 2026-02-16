import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { AppConfig, TestEnv } from "./types";

const VALID_ENVS: TestEnv[] = ["local", "qa", "prod"];

function loadEnvFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
}

function parseEnv(): TestEnv {
  const rawEnv = (process.env.TEST_ENV ?? "local") as TestEnv;
  if (!VALID_ENVS.includes(rawEnv)) {
    throw new Error(`Invalid TEST_ENV: ${rawEnv}. Valid values are: ${VALID_ENVS.join(", ")}`);
  }

  return rawEnv;
}

function required(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: keyof NodeJS.ProcessEnv, fallback: string): string {
  return process.env[name] ?? fallback;
}

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function loadConfig(): AppConfig {
  const cwd = process.cwd();
  const baseEnvPath = path.resolve(cwd, ".env");

  loadEnvFile(baseEnvPath);

  const env = parseEnv();
  const envPath = path.resolve(cwd, `.env.${env}`);
  const localPath = path.resolve(cwd, ".env.local");

  loadEnvFile(envPath);
  if (env === "local") {
    loadEnvFile(localPath);
  }

  return {
    env,
    frontBaseUrl: required("FRONT_BASE_URL"),
    frontUsername: required("FRONT_USERNAME"),
    frontPassword: required("FRONT_PASSWORD"),
    frontHeadless: parseBoolean(optional("FRONT_HEADLESS", "true")),
    frontSlowMoMs: Number(optional("FRONT_SLOWMO_MS", "0")),
    apiBaseUrl: required("API_BASE_URL"),
    apiTimeout: Number(required("API_TIMEOUT")),
    apiToken: process.env.API_TOKEN,
    e2eUsername: required("E2E_USERNAME"),
    e2ePassword: required("E2E_PASSWORD")
  };
}

export const config: AppConfig = loadConfig();
