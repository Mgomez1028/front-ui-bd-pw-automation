# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install
npx playwright install

# Build (type-check both modules)
npm run build

# Run frontend E2E tests (Cucumber + Playwright)
npm run test:front                    # local environment
npm run test:front:qa                 # QA environment
npm run test:front:prod               # prod environment

# Run API tests (Playwright Test)
npm run test:api                      # local environment
npm run test:api:qa                   # QA environment
npm run test:api:prod                 # prod environment

# Run a single API test file
npx playwright test --config=api/playwright.config.ts api/src/tests/auth.spec.ts

# Run a single Cucumber scenario by name
cross-env TEST_ENV=local cucumber-js --config front/cucumber.js --name "scenario name"

# Clean reports
npm run clean
```

## Architecture

Two separate test modules sharing common configuration:

- **front/**: UI E2E tests using Cucumber + Playwright with Page Object Model (POM)
- **api/**: API tests using Playwright Test with Service Model pattern (no Cucumber)

### Front Module (POM Pattern)

- `front/src/pages/BasePage.ts`: Common page actions (goto, click, type, text)
- Page classes extend `BasePage` and encapsulate locators as private properties
- `front/src/support/world.ts`: Cucumber World holding browser/context/page references and scenario data
- `front/src/hooks/global.hooks.ts`: BeforeAll/AfterAll for browser lifecycle
- `front/src/hooks/scenario.hooks.ts`: Before/After for context/page per scenario + screenshot on failure
- Steps in `front/src/steps/` should delegate UI logic to page objects

### API Module (Service Model Pattern)

- `api/src/client/ApiClient.ts`: Wrapper around `APIRequestContext` with get/post/put/delete methods
- `api/src/services/BaseService.ts`: Abstract base with `parseJson()` and `assertStatus()` helpers
- Domain services (e.g., `AuthService`, `UsersService`) extend `BaseService` and define endpoints
- `api/src/fixtures/api.fixture.ts`: Playwright fixtures injecting `apiClient` and service instances into tests
- Tests import `test` and `expect` from the fixture file, not directly from `@playwright/test`

### Configuration

- `config/env.ts`: Loads environment variables with layered `.env` files
- Load order: `.env` -> `.env.{TEST_ENV}` -> `.env.local` (local only)
- `TEST_ENV` controls which environment config is used (local, qa, prod)
- Access config values via `import { config } from "../../../config"`

### Shared Utilities

- `shared/logger/`: Simple logger utility
- `shared/utils/`: Data factory and wait helpers
