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

# Run both modules
npm run test:all

# Run a single API test file
npx playwright test --config=api/playwright.config.ts api/src/tests/auth.spec.ts

# Run a single Cucumber scenario by name
cross-env TEST_ENV=local cucumber-js --config front/cucumber.js --name "scenario name"

# Generate front HTML report
npm run report:front

# Clean reports
npm run clean
```

## Environment Variables

Required in `.env`, `.env.local`, `.env.qa`, or `.env.prod`:

| Variable | Description |
|---|---|
| `FRONT_BASE_URL` | Base URL for the UI under test |
| `FRONT_USERNAME` | Login username for front E2E |
| `FRONT_PASSWORD` | Login password for front E2E |
| `API_BASE_URL` | Base URL for the API under test |
| `API_TIMEOUT` | HTTP timeout in ms for API requests |
| `E2E_USERNAME` | Username shared across both modules |
| `E2E_PASSWORD` | Password shared across both modules |
| `FRONT_HEADLESS` | `true`/`false` to control headed mode (default: `true`) |
| `FRONT_SLOWMO_MS` | Slow-motion delay in ms (default: `0`) |
| `API_TOKEN` | Optional bearer token for Authorization header |

Load order: `.env` → `.env.{TEST_ENV}` → `.env.local` (local only). Values set later override earlier ones.

## Architecture

Two separate test modules sharing common configuration:

- **front/**: UI E2E tests using Cucumber + Playwright with Page Object Model (POM)
- **api/**: API tests using Playwright Test with Service Model pattern (no Cucumber)

### Front Module (POM Pattern)

- `front/src/pages/BasePage.ts`: Common page actions (`goto`, `click`, `type`, `text`)
- Page classes extend `BasePage` and encapsulate locators as private properties
- `front/src/support/world.ts`: Cucumber `CustomWorld` holding `browser`/`context`/`page` references and per-scenario data via `setData(key, value)` / `getData<T>(key)` — use these to share state between steps instead of globals
- `front/src/hooks/global.hooks.ts`: `BeforeAll`/`AfterAll` for browser lifecycle
- `front/src/hooks/scenario.hooks.ts`: `Before`/`After` for context/page per scenario + screenshot on failure
- `front/src/steps/`: Step definitions — delegate all UI logic to page objects, no direct locator usage
- `front/src/data/`: JSON test fixtures (e.g., `users.json`) for static test data

### API Module (Service Model Pattern)

- `api/src/client/ApiClient.ts`: Wrapper around `APIRequestContext` with `get`/`post`/`put`/`delete` methods; initialized with `baseURL`, `timeout`, and optional `Authorization: Bearer` header from config
- `api/src/services/BaseService.ts`: Abstract base with `parseJson<T>()` and `assertStatus()` helpers; subclasses declare `abstract readonly resource: string` and use `path(suffix)` to build endpoints
- Domain services (e.g., `AuthService`, `UsersService`) extend `BaseService` and define typed endpoint methods
- `api/src/fixtures/api.fixture.ts`: Playwright fixtures injecting `apiClient`, `authService`, and `usersService` into tests
- Tests import `test` and `expect` from the fixture file (`api/src/fixtures/api.fixture.ts`), not directly from `@playwright/test`

### Configuration

- `config/env.ts`: Loads environment variables with layered `.env` files
- `config/types.ts`: `AppConfig` interface — reference this to see all available config fields
- Access config values via `import { config } from "../../../config"` (path relative to the consuming file)

### Shared Utilities

- `shared/logger/logger.ts`: Simple logger utility
- `shared/utils/dataFactory.ts`: `uniqueEmail(prefix?)` for generating unique test emails
- `shared/utils/wait.ts`: Wait helpers

### Documentation

Detailed guides live in `docs/`:
- `guia-front.md` / `capas-front.md` / `ciclo-vida-front.md` — front module deep-dives
- `guia-api.md` / `capas-api.md` / `ciclo-vida-api.md` — API module deep-dives
- `guia-contribucion.md` — contribution guide
- `troubleshooting.md` — common issues
