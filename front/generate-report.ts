// eslint-disable-next-line @typescript-eslint/no-require-imports
const report = require("multiple-cucumber-html-reporter");
import path from "node:path";

const reportsDir = path.resolve(process.cwd(), "reports/front");

report.generate({
  jsonDir: reportsDir,
  reportPath: path.resolve(reportsDir, "html-report"),
  pageTitle: "SauceDemo - Test Report",
  reportName: "SauceDemo E2E Test Report",
  displayDuration: true,
  displayReportTime: true,
  metadata: {
    browser: { name: "chromium", version: "latest" },
    device: "Desktop",
    platform: { name: "Windows", version: "11" }
  },
  customData: {
    title: "Run Info",
    data: [
      { label: "Project", value: "SauceDemo Automation" },
      { label: "Environment", value: process.env.TEST_ENV ?? "local" },
      { label: "Execution Date", value: new Date().toLocaleString() }
    ]
  }
});

console.log(`Report generated at: ${path.resolve(reportsDir, "html-report/index.html")}`);
