# Guia del Modulo API (`api`)

## Objetivo

El modulo `api` valida servicios HTTP usando:

- Playwright Test (runner)
- TypeScript
- Patron Service Model (sin Cucumber)

## Capas del modulo

### 1. Tests

Ruta: `api/src/tests`

- Casos funcionales API por dominio.
- Los tests no deben llamar HTTP directo.
- Deben consumir servicios (`AuthService`, `UsersService`, etc.).

### 2. Fixtures

Ruta: `api/src/fixtures`

- `api.fixture.ts` centraliza instancias reutilizables:
  - `ApiClient`
  - Servicios de dominio
- Evita repetir setup/teardown en cada spec.

### 3. Hooks

Ruta: `api/src/hooks`

- `api.hooks.ts` define acciones transversales por test:
  - logging
  - trazabilidad
- Se importa desde fixtures para aplicarse globalmente.

### 4. Client

Ruta: `api/src/client`

- `ApiClient.ts` encapsula `APIRequestContext`.
- Expone metodos HTTP genericos (`get/post/put/delete`).
- Gestiona baseURL, timeout y headers comunes.

### 5. Services (Service Model)

Ruta: `api/src/services`

- Cada servicio representa un dominio API.
- `BaseService` concentra utilidades comunes:
  - construir paths
  - parse JSON
  - validar status
- Servicios concretos implementan operaciones de negocio.

Ejemplos:
- `AuthService`
- `UsersService`

### 6. Models

Ruta: `api/src/models`

- `requests/`: contratos de entrada
- `responses/`: contratos esperados de salida
- Mantiene tipado fuerte y claridad de datos.

## Flujo de trabajo: crear un nuevo escenario API

1. Identifica el endpoint y comportamiento esperado
- Define caso de exito y error.
- Ejemplo: `POST /orders` crea orden.

2. Crea/ajusta modelos
- Agrega request/response en `api/src/models`.

3. Implementa o amplía un servicio
- Agrega metodo en servicio de dominio.
- Si es dominio nuevo, crea nuevo `XService.ts`.

4. Exponlo por fixture (si aplica)
- Registra servicio en `api/src/fixtures/api.fixture.ts` para DI simple.

5. Escribe tests
- Crea spec en `api/src/tests`.
- Usa servicios + `expect` para validar:
  - status code
  - shape de respuesta
  - reglas funcionales

6. Ejecuta pruebas

```bash
npm run test:api
```

## Patrones recomendados

- Test corto: Arrange -> Act -> Assert.
- Nada de rutas hardcode en tests (van en services).
- Evita `any`; usa modelos tipados.
- Reutiliza `BaseService` para validaciones comunes.

## Ejemplo de estructura para nuevo dominio `orders`

```txt
api/src/models/requests/CreateOrderRequest.ts
api/src/models/responses/CreateOrderResponse.ts
api/src/services/OrdersService.ts
api/src/tests/orders.spec.ts
```

## Checklist rapido para API

- Modelo request/response definido.
- Metodo de servicio implementado y reutilizable.
- Test cubre exito + error relevante.
- Fixture actualizada si se requiere nuevo servicio.
- Pruebas pasan con entorno configurado (`.env.local`).
