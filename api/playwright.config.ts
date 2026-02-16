import type { PlaywrightTestConfig } from "@playwright/test";
import path from "node:path";
import { config } from "../config";

const apiConfig: PlaywrightTestConfig = {
  testDir: path.resolve(process.cwd(), "api/src/tests"),
  timeout: config.apiTimeout,
  use: {
    baseURL: config.apiBaseUrl,
    extraHTTPHeaders: {
      Accept: "application/json"
    }
  },
  reporter: [["list"], ["html", { outputFolder: "reports/api/html", open: "never" }]],
  outputDir: path.resolve(process.cwd(), "reports/api/artifacts")
};

export default apiConfig;
