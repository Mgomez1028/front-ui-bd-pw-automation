# Capas del Módulo API

El módulo API implementa pruebas funcionales de servicios HTTP utilizando Playwright Test con el patrón Service Model.

## Diagrama de Capas

```mermaid
flowchart TB
    subgraph capa1["Capa 1: Tests"]
        specs["*.spec.ts<br/>Casos de prueba"]
    end

    subgraph capa2["Capa 2: Fixtures"]
        fixtures["api.fixture.ts<br/>Inyección de dependencias"]
    end

    subgraph capa3["Capa 3: Services"]
        baseservice["BaseService.ts<br/>Funcionalidad común"]
        services["*Service.ts<br/>Servicios por dominio"]
    end

    subgraph capa4["Capa 4: Client"]
        client["ApiClient.ts<br/>Wrapper HTTP"]
    end

    subgraph capa5["Capa 5: Models"]
        requests["requests/<br/>Contratos de entrada"]
        responses["responses/<br/>Contratos de salida"]
    end

    subgraph capa6["Capa 6: Playwright"]
        apicontext["APIRequestContext<br/>Cliente HTTP nativo"]
    end

    specs --> fixtures
    fixtures --> services
    services --> baseservice
    services --> client
    services --> requests
    services --> responses
    client --> apicontext
```

## Capa 1: Tests

**Ubicación**: `api/src/tests/`

### Propósito

Definir casos de prueba que validan el comportamiento de los endpoints API. Los tests no realizan llamadas HTTP directas, sino que consumen servicios.

### Anatomía de un Test File

```typescript
// api/src/tests/auth.spec.ts
import { config } from "../../../config";
import { expect, test } from "../fixtures/api.fixture";

test.describe("Auth service", () => {

  test("should login with valid credentials", async ({ authService }) => {
    // Arrange: preparar datos (desde config)
    const credentials = {
      username: config.e2eUsername,
      password: config.e2ePassword
    };

    // Act: ejecutar acción via servicio
    const body = await authService.loginAndParse(credentials);

    // Assert: validar resultado
    expect(body.accessToken).toBeTruthy();
  });

  test("should fail login with invalid credentials", async ({ authService }) => {
    // Act: ejecutar con datos inválidos
    const response = await authService.login({
      username: "invalid-user",
      password: "wrong-password"
    });

    // Assert: validar status de error
    expect([400, 401]).toContain(response.status());
  });

});
```

### Patrón AAA (Arrange-Act-Assert)

```mermaid
flowchart LR
    subgraph test["Test Case"]
        arrange["Arrange<br/>Preparar datos"]
        act["Act<br/>Ejecutar servicio"]
        assert["Assert<br/>Validar resultado"]
    end

    arrange --> act --> assert
```

### Reglas de Diseño

| Hacer | No Hacer |
|-------|----------|
| Importar `test` y `expect` desde fixture | Importar directamente de `@playwright/test` |
| Usar servicios para llamadas HTTP | Usar `request.get()` directamente |
| Agrupar tests relacionados en `describe` | Tests sueltos sin agrupación |
| Nombres descriptivos del comportamiento | Nombres técnicos (`test1`, `testEndpoint`) |

---

## Capa 2: Fixtures

**Ubicación**: `api/src/fixtures/`

### Propósito

Proveer inyección de dependencias para los tests. Centraliza la creación y destrucción de instancias reutilizables.

### api.fixture.ts

```typescript
// api/src/fixtures/api.fixture.ts
import { test as base } from "@playwright/test";
import { ApiClient } from "../client/ApiClient";
import { AuthService } from "../services/AuthService";
import { UsersService } from "../services/UsersService";
import "../hooks/api.hooks";

// Definir tipos de fixtures disponibles
type ApiFixtures = {
  apiClient: ApiClient;
  authService: AuthService;
  usersService: UsersService;
};

// Extender test base con nuestros fixtures
export const test = base.extend<ApiFixtures>({

  // Fixture del cliente API
  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await client.init();      // Setup: inicializar contexto HTTP
    await use(client);        // Proveer al test
    await client.dispose();   // Teardown: liberar recursos
  },

  // Fixture de AuthService (depende de apiClient)
  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },

  // Fixture de UsersService (depende de apiClient)
  usersService: async ({ apiClient }, use) => {
    await use(new UsersService(apiClient));
  }

});

// Re-exportar expect para uso en tests
export { expect } from "@playwright/test";
```

### Diagrama de Dependencias de Fixtures

```mermaid
flowchart TB
    subgraph fixtures["Fixtures"]
        apiClient["apiClient<br/>(base)"]
        authService["authService"]
        usersService["usersService"]
    end

    subgraph lifecycle["Ciclo de Vida"]
        init["init()"]
        use["use()"]
        dispose["dispose()"]
    end

    apiClient --> authService
    apiClient --> usersService

    init --> use --> dispose
```

### Flujo de Ejecución de Fixture

```mermaid
sequenceDiagram
    participant Test as Test Case
    participant Fixture as Fixture System
    participant Client as ApiClient
    participant Service as AuthService

    Test->>Fixture: Solicita authService
    Fixture->>Fixture: Detecta dependencia: apiClient
    Fixture->>Client: new ApiClient()
    Fixture->>Client: init()
    Client-->>Fixture: Cliente inicializado
    Fixture->>Service: new AuthService(apiClient)
    Fixture-->>Test: authService listo
    Test->>Service: loginAndParse(...)
    Service-->>Test: resultado
    Note over Test: Test completa
    Fixture->>Client: dispose()
    Client-->>Fixture: Recursos liberados
```

---

## Capa 3: Services (Service Model)

**Ubicación**: `api/src/services/`

### Propósito

Encapsular la lógica de interacción con endpoints API. Cada servicio representa un dominio o recurso del API.

### BaseService: Clase Base

```typescript
// api/src/services/BaseService.ts
import { APIResponse, expect } from "@playwright/test";
import { ApiClient } from "../client/ApiClient";

export abstract class BaseService {
  protected readonly client: ApiClient;

  // Cada servicio define su recurso base
  protected abstract readonly resource: string;

  constructor(client: ApiClient) {
    this.client = client;
  }

  // Construir path del endpoint
  protected path(suffix = ""): string {
    return `${this.resource}${suffix}`;
  }

  // Parsear respuesta a tipo específico
  protected async parseJson<T>(response: APIResponse): Promise<T> {
    const body = (await response.json()) as T;
    return body;
  }

  // Validar status esperado
  protected assertStatus(response: APIResponse, expectedStatus: number): void {
    expect(
      response.status(),
      `Expected status ${expectedStatus} but got ${response.status()}`
    ).toBe(expectedStatus);
  }
}
```

### Service Concreto: AuthService

```typescript
// api/src/services/AuthService.ts
import { APIResponse } from "@playwright/test";
import { LoginRequest } from "../models/requests/LoginRequest";
import { LoginResponse } from "../models/responses/LoginResponse";
import { BaseService } from "./BaseService";

export class AuthService extends BaseService {
  // Recurso base para este servicio
  protected readonly resource = "/auth/login";

  // Método que retorna respuesta raw (para validar status manualmente)
  async login(payload: LoginRequest): Promise<APIResponse> {
    return this.client.post(this.path(), { data: payload });
  }

  // Método que parsea y valida (happy path)
  async loginAndParse(payload: LoginRequest): Promise<LoginResponse> {
    const response = await this.login(payload);
    this.assertStatus(response, 200);
    return this.parseJson<LoginResponse>(response);
  }
}
```

### Service Concreto: UsersService

```typescript
// api/src/services/UsersService.ts
import { APIResponse } from "@playwright/test";
import { UserResponse } from "../models/responses/UserResponse";
import { BaseService } from "./BaseService";

export class UsersService extends BaseService {
  protected readonly resource = "/users";

  async getUsers(): Promise<APIResponse> {
    return this.client.get(this.path());
  }

  async getUserById(id: number): Promise<APIResponse> {
    return this.client.get(this.path(`/${id}`));
  }

  async getUserByIdAndParse(id: number): Promise<UserResponse> {
    const response = await this.getUserById(id);
    this.assertStatus(response, 200);
    return this.parseJson<UserResponse>(response);
  }
}
```

### Diagrama de Clases

```mermaid
classDiagram
    class BaseService {
        <<abstract>>
        #client: ApiClient
        #resource: string*
        #path(suffix): string
        #parseJson~T~(response): T
        #assertStatus(response, status)
    }

    class AuthService {
        #resource = "/auth/login"
        +login(payload): APIResponse
        +loginAndParse(payload): LoginResponse
    }

    class UsersService {
        #resource = "/users"
        +getUsers(): APIResponse
        +getUserById(id): APIResponse
        +getUserByIdAndParse(id): UserResponse
    }

    class ApiClient {
        +get(url, options): APIResponse
        +post(url, options): APIResponse
        +put(url, options): APIResponse
        +delete(url, options): APIResponse
    }

    BaseService <|-- AuthService
    BaseService <|-- UsersService
    BaseService --> ApiClient
```

### Patrón de Métodos Duales

Cada operación suele tener dos variantes:

```mermaid
flowchart LR
    subgraph raw["Método Raw"]
        login["login()"]
        returns_raw["Retorna APIResponse"]
        use_raw["Para validar errores,<br/>status codes, headers"]
    end

    subgraph parsed["Método Parsed"]
        loginAndParse["loginAndParse()"]
        returns_parsed["Retorna LoginResponse"]
        use_parsed["Para happy paths<br/>con datos tipados"]
    end

    login --> returns_raw --> use_raw
    loginAndParse --> returns_parsed --> use_parsed
```

---

## Capa 4: Client

**Ubicación**: `api/src/client/`

### Propósito

Wrapper sobre `APIRequestContext` de Playwright. Centraliza configuración HTTP común (baseURL, headers, timeout).

### ApiClient.ts

```typescript
// api/src/client/ApiClient.ts
import { APIRequestContext, APIResponse, request } from "@playwright/test";
import { config } from "../../../config";

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  data?: unknown;
}

export class ApiClient {
  private context?: APIRequestContext;

  // Inicializar contexto HTTP
  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      extraHTTPHeaders: {
        Accept: "application/json",
        ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {})
      }
    });
  }

  // Liberar recursos
  async dispose(): Promise<void> {
    await this.context?.dispose();
  }

  // Validar que el contexto está inicializado
  private ensureContext(): APIRequestContext {
    if (!this.context) {
      throw new Error("ApiClient not initialized. Call init() first.");
    }
    return this.context;
  }

  // Métodos HTTP
  async get(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().get(url, {
      headers: options?.headers,
      params: options?.query
    });
  }

  async post(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().post(url, {
      headers: options?.headers,
      params: options?.query,
      data: options?.data
    });
  }

  async put(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().put(url, {
      headers: options?.headers,
      params: options?.query,
      data: options?.data
    });
  }

  async delete(url: string, options?: RequestOptions): Promise<APIResponse> {
    return this.ensureContext().delete(url, {
      headers: options?.headers,
      params: options?.query,
      data: options?.data
    });
  }
}
```

### Estados del Cliente

```mermaid
stateDiagram-v2
    [*] --> Uninitialized: new ApiClient()
    Uninitialized --> Ready: init()
    Ready --> Ready: get/post/put/delete
    Ready --> Disposed: dispose()
    Disposed --> [*]

    Uninitialized --> Error: Llamar método HTTP
    note right of Error: "ApiClient not initialized"
```

---

## Capa 5: Models

**Ubicación**: `api/src/models/`

### Propósito

Definir contratos TypeScript para requests y responses, asegurando tipado fuerte en toda la cadena.

### Estructura

```
api/src/models/
├── requests/
│   └── LoginRequest.ts
└── responses/
    ├── LoginResponse.ts
    └── UserResponse.ts
```

### Ejemplo de Request Model

```typescript
// api/src/models/requests/LoginRequest.ts
export interface LoginRequest {
  username: string;
  password: string;
}
```

### Ejemplo de Response Model

```typescript
// api/src/models/responses/LoginResponse.ts
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

// api/src/models/responses/UserResponse.ts
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}
```

### Flujo de Tipos

```mermaid
flowchart LR
    subgraph test["Test"]
        input["LoginRequest"]
        output["LoginResponse"]
    end

    subgraph service["Service"]
        method["loginAndParse()"]
    end

    subgraph client["Client"]
        post["post()"]
    end

    subgraph api["API Externa"]
        endpoint["/auth/login"]
    end

    input --> method
    method --> post
    post --> endpoint
    endpoint --> post
    post --> method
    method -->|"parseJson<LoginResponse>"| output
```

---

## Capa 6: Playwright (APIRequestContext)

### Propósito

Proveer el cliente HTTP nativo. Esta capa es proporcionada por Playwright y es consumida por `ApiClient`.

### Características

- **Gestión de conexiones**: Pool de conexiones HTTP
- **Timeouts**: Configurables por request
- **Headers**: Aplicados globalmente o por request
- **Serialización**: JSON automático para body
- **Cookies**: Manejo automático de sesión

### Relación con ApiClient

```mermaid
flowchart TB
    subgraph wrapper["ApiClient (Wrapper)"]
        init["init()<br/>Crear contexto"]
        get["get()"]
        post["post()"]
        dispose["dispose()<br/>Liberar"]
    end

    subgraph native["APIRequestContext (Playwright)"]
        newContext["request.newContext()"]
        nativeGet["context.get()"]
        nativePost["context.post()"]
        nativeDispose["context.dispose()"]
    end

    init --> newContext
    get --> nativeGet
    post --> nativePost
    dispose --> nativeDispose
```

---

## Flujo Completo de una Petición

```mermaid
sequenceDiagram
    participant Test as Test Case
    participant Fixture as Fixture
    participant Service as AuthService
    participant Client as ApiClient
    participant Context as APIRequestContext
    participant API as API Externa

    Test->>Fixture: Solicita authService
    Fixture->>Client: init()
    Client->>Context: request.newContext(config)
    Context-->>Client: context
    Fixture->>Service: new AuthService(client)
    Fixture-->>Test: authService

    Test->>Service: loginAndParse(credentials)
    Service->>Client: post("/auth/login", {data})
    Client->>Context: context.post(url, options)
    Context->>API: POST /auth/login
    API-->>Context: 200 {accessToken: "..."}
    Context-->>Client: APIResponse
    Client-->>Service: APIResponse
    Service->>Service: assertStatus(200)
    Service->>Service: parseJson<LoginResponse>()
    Service-->>Test: LoginResponse

    Note over Test: Test completa
    Fixture->>Client: dispose()
    Client->>Context: context.dispose()
```

## Próximos Pasos

- [Ciclo de Vida API](./ciclo-vida-api.md) - Diagrama temporal detallado
- [Guía de Contribución](./guia-contribucion.md) - Cómo añadir servicios y tests
