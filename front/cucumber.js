module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: [
      "front/src/support/world.ts",
      "front/src/hooks/global.hooks.ts",
      "front/src/hooks/scenario.hooks.ts",
      "front/src/steps/**/*.ts"
    ],
    format: ["progress", "html:reports/front/cucumber-report.html", "json:reports/front/cucumber-report.json"],
    paths: ["front/src/features/**/*.feature"]
  }
};
