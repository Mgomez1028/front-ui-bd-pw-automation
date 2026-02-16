import type { PlaywrightTestConfig } from "@playwright/test";
import path from "node:path";

const config: PlaywrightTestConfig = {
  timeout: 30_000,
  use: {
    headless: false,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  outputDir: path.resolve(process.cwd(), "reports/front/artifacts")
};

export default config;
