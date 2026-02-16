# Automation Framework: Playwright + Cucumber + TypeScript

Framework de automatizacion con dos modulos separados:

- `front`: pruebas E2E UI con Playwright + Cucumber + TypeScript usando POM.
- `api`: pruebas de API con Playwright Test + TypeScript usando Service Model (sin Cucumber).

## Requisitos

- Node.js LTS (18+ recomendado)
- npm

## Instalacion

```bash
npm install
npx playwright install
```

## Estructura

```txt
config/                 # Configuracion centralizada de ambientes
shared/                 # Logger, utilidades y tipos compartidos
front/                  # Modulo front (Cucumber + POM)
api/                    # Modulo API (Playwright Test + Service Model)
```

## Configuracion de ambientes

El framework carga variables en este orden:

1. `.env`
2. `.env.{TEST_ENV}` (`local`, `qa`, `prod`)
3. `.env.local`

Variables obligatorias:

- `FRONT_BASE_URL`
- `API_BASE_URL`
- `API_TIMEOUT`
- `E2E_USERNAME`
- `E2E_PASSWORD`

## Scripts

```bash
npm run test:front
npm run test:front:qa
npm run test:front:prod

npm run test:api
npm run test:api:qa
npm run test:api:prod

npm run test:all
```

## Patrones implementados

### Front (POM)

- `BasePage` para acciones comunes.
- Paginas concretas (`LoginPage`, `HomePage`) para encapsular locators y comportamiento.
- Steps de Cucumber sin logica UI compleja.

### API (Service Model)

- `ApiClient` encapsula `APIRequestContext`.
- `BaseService` y servicios por dominio (`AuthService`, `UsersService`).
- Tests consumen servicios, no llamadas HTTP directas.

## Hooks y capas

- Front:
  - `front/src/hooks/global.hooks.ts`
  - `front/src/hooks/scenario.hooks.ts`
- API:
  - `api/src/hooks/api.hooks.ts` (integrado via fixture)

## Notas

- El modulo API no usa Cucumber por diseno.
- Los ejemplos de test requieren endpoints y credenciales validas para cada ambiente.

## Guias por modulo

- Front: `docs/guia-front.md`
- API: `docs/guia-api.md`
