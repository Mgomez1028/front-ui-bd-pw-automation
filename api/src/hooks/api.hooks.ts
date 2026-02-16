import { test } from "@playwright/test";
import { logger } from "../../../shared/logger/logger";

test.beforeEach(async ({}, testInfo) => {
  logger.info(`Starting API test: ${testInfo.title}`);
});

test.afterEach(async ({}, testInfo) => {
  logger.info(`Finished API test: ${testInfo.title} (${testInfo.status})`);
});
