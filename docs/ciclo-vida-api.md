# Ciclo de Vida del Cliente HTTP - Módulo API

Este documento detalla el ciclo de vida completo del cliente HTTP en el módulo API, desde la inicialización del contexto hasta la liberación de recursos.

## Visión General

```mermaid
flowchart TB
    subgraph test["Test Case"]
        subgraph fixture["Fixture Setup"]
            init["ApiClient.init()<br/>Crear contexto HTTP"]
        end

        subgraph execution["Ejecución"]
            inject["Inyectar services"]
            run["Ejecutar test"]
        end

        subgraph teardown["Fixture Teardown"]
            dispose["ApiClient.dispose()<br/>Liberar recursos"]
        end
    end

    init --> inject --> run --> dispose
```

## Diagrama de Secuencia Completo

```mermaid
sequenceDiagram
    participant Runner as Playwright Test
    participant Fixture as api.fixture.ts
    participant Client as ApiClient
    participant PW as Playwright
    participant Context as APIRequestContext
    participant Service as AuthService
    participant Test as Test Case
    participant API as API Externa

    Note over Runner: Test inicia

    %% Fixture Setup
    rect rgb(200, 230, 200)
        Note over Fixture: Fixture Setup
        Runner->>Fixture: Resolver apiClient fixture
        Fixture->>Client: new ApiClient()
        Fixture->>Client: init()
        Client->>PW: request.newContext(config)
        PW->>Context: Crear pool de conexiones
        Context-->>PW: context
        PW-->>Client: context
        Note over Client: context almacenado internamente

        Runner->>Fixture: Resolver authService fixture
        Note over Fixture: Detecta dependencia: apiClient
        Fixture->>Service: new AuthService(apiClient)
        Service-->>Fixture: authService

        Fixture-->>Runner: { authService }
    end

    %% Test Execution
    rect rgb(200, 220, 240)
        Note over Test: Test Execution
        Runner->>Test: test("login", async ({ authService }))

        Test->>Service: loginAndParse(credentials)
        Service->>Client: post("/auth/login", {data})
        Client->>Client: ensureContext()
        Client->>Context: context.post(url, options)
        Context->>API: HTTP POST
        API-->>Context: 200 JSON
        Context-->>Client: APIResponse
        Client-->>Service: APIResponse
        Service->>Service: assertStatus(200)
        Service->>Service: parseJson<LoginResponse>()
        Service-->>Test: LoginResponse

        Test->>Test: expect(body.accessToken).toBeTruthy()
    end

    %% Fixture Teardown
    rect rgb(240, 200, 200)
        Note over Fixture: Fixture Teardown
        Runner->>Fixture: Liberar authService
        Note over Fixture: No-op (no tiene teardown)

        Runner->>Fixture: Liberar apiClient
        Fixture->>Client: dispose()
        Client->>Context: context.dispose()
        Context->>Context: Cerrar conexiones
        Note over Context: Recursos liberados
    end

    Note over Runner: Test completo
```

## Fases del Ciclo de Vida

### Fase 1: Creación del ApiClient

**Archivo**: `api/src/fixtures/api.fixture.ts`

**Cuándo**: Cuando un test solicita un fixture que depende de `apiClient`.

**Qué hace**:
1. Crea instancia de ApiClient
2. Llama a `init()` para crear el contexto HTTP
3. Provee el cliente al test

```typescript
apiClient: async ({}, use) => {
  const client = new ApiClient();
  await client.init();      // Setup
  await use(client);        // Proveer al test
  await client.dispose();   // Teardown
}
```

**Diagrama de estados del ApiClient**:

```mermaid
stateDiagram-v2
    [*] --> Uninitialized: new ApiClient()
    Uninitialized --> Initializing: init() llamado
    Initializing --> Ready: context creado
    Ready --> Ready: get/post/put/delete
    Ready --> Disposing: dispose() llamado
    Disposing --> Disposed: context cerrado
    Disposed --> [*]

    Uninitialized --> Error: Método HTTP sin init
    note right of Error: "ApiClient not initialized"
```

---

### Fase 2: Inicialización del Contexto HTTP

**Archivo**: `api/src/client/ApiClient.ts`

**Cuándo**: Durante `client.init()`.

**Qué hace**:
1. Lee configuración (baseURL, timeout, token)
2. Crea `APIRequestContext` con headers comunes
3. Almacena referencia internamente

```typescript
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
```

**Configuración aplicada**:

```mermaid
flowchart LR
    subgraph config["config/env.ts"]
        baseUrl["apiBaseUrl"]
        timeout["apiTimeout"]
        token["apiToken"]
    end

    subgraph context["APIRequestContext"]
        url["baseURL"]
        time["timeout"]
        headers["extraHTTPHeaders"]
    end

    baseUrl --> url
    timeout --> time
    token --> headers
```

---

### Fase 3: Creación de Services

**Archivo**: `api/src/fixtures/api.fixture.ts`

**Cuándo**: Cuando el test solicita un service específico.

**Flujo de dependencias**:

```mermaid
flowchart TB
    test["Test solicita authService"]
    fixture["Fixture System"]
    dep["Detecta dependencia: apiClient"]
    client["Crea ApiClient"]
    init["ApiClient.init()"]
    service["new AuthService(apiClient)"]
    provide["Provee authService al test"]

    test --> fixture
    fixture --> dep
    dep --> client
    client --> init
    init --> service
    service --> provide
```

**Código del fixture**:

```typescript
authService: async ({ apiClient }, use) => {
  // apiClient ya está inicializado por su propio fixture
  await use(new AuthService(apiClient));
  // No hay teardown específico para el service
}
```

---

### Fase 4: Ejecución de Requests HTTP

**Archivos**: `api/src/services/*.ts` + `api/src/client/ApiClient.ts`

**Cuándo**: Durante la ejecución del test.

**Flujo de una petición POST**:

```mermaid
sequenceDiagram
    participant Test as Test
    participant Service as AuthService
    participant Base as BaseService
    participant Client as ApiClient
    participant Context as APIRequestContext
    participant Net as Red

    Test->>Service: loginAndParse(credentials)
    Service->>Client: post("/auth/login", {data})
    Client->>Client: ensureContext()
    alt Context no existe
        Client-->>Client: throw Error
    end
    Client->>Context: context.post(url, options)
    Context->>Net: HTTP POST
    Net-->>Context: Response
    Context-->>Client: APIResponse
    Client-->>Service: APIResponse
    Service->>Base: assertStatus(response, 200)
    Service->>Base: parseJson<LoginResponse>(response)
    Base-->>Service: LoginResponse
    Service-->>Test: LoginResponse
```

**Validación de contexto**:

```typescript
private ensureContext(): APIRequestContext {
  if (!this.context) {
    throw new Error("ApiClient not initialized. Call init() first.");
  }
  return this.context;
}
```

---

### Fase 5: Dispose del Cliente

**Archivo**: `api/src/client/ApiClient.ts`

**Cuándo**: Después de que el test termina (fixture teardown).

**Qué hace**:
1. Cierra todas las conexiones HTTP activas
2. Libera memoria del pool de conexiones
3. Marca el contexto como no disponible

```typescript
async dispose(): Promise<void> {
  await this.context?.dispose();
}
```

**Diagrama de recursos**:

```mermaid
flowchart TB
    subgraph before["Antes de dispose()"]
        ctx1["APIRequestContext"]
        conn1["Conexiones HTTP activas"]
        pool1["Pool de conexiones"]
    end

    subgraph after["Después de dispose()"]
        ctx2["context = undefined"]
        conn2["Conexiones cerradas"]
        pool2["Pool liberado"]
    end

    before -->|"dispose()"| after
```

---

## Diagrama de Tiempo por Test

```mermaid
gantt
    title Ciclo de Vida del ApiClient
    dateFormat X
    axisFormat %s

    section Fixture Setup
    new ApiClient()          :a1, 0, 1
    ApiClient.init()         :a2, 1, 1

    section Service Setup
    new AuthService()        :b1, 2, 1

    section Test Execution
    loginAndParse()          :c1, 3, 2
    expect assertions        :c2, 5, 1

    section Fixture Teardown
    ApiClient.dispose()      :d1, 6, 1
```

## Comparación: Test Individual vs Múltiples Tests

### Test Individual

```mermaid
flowchart LR
    subgraph test1["Test 1"]
        init1["init()"]
        run1["test code"]
        dispose1["dispose()"]
    end

    init1 --> run1 --> dispose1
```

### Múltiples Tests (mismo describe)

```mermaid
flowchart TB
    subgraph suite["describe('Auth')"]
        subgraph test1["test 1"]
            init1["init()"]
            run1["test code"]
            dispose1["dispose()"]
        end

        subgraph test2["test 2"]
            init2["init()"]
            run2["test code"]
            dispose2["dispose()"]
        end
    end

    init1 --> run1 --> dispose1
    dispose1 -.->|"Nuevo ApiClient"| init2
    init2 --> run2 --> dispose2
```

> **Nota**: Cada test obtiene su propia instancia de `ApiClient`. No hay estado compartido entre tests.

---

## Manejo de Errores

### Error: Cliente no inicializado

```mermaid
flowchart TB
    call["client.post()"]
    ensure["ensureContext()"]
    check{"this.context<br/>existe?"}
    error["throw Error<br/>'ApiClient not initialized'"]
    continue["Continuar request"]

    call --> ensure
    ensure --> check
    check -->|No| error
    check -->|Sí| continue
```

### Error: Request falla

```mermaid
flowchart TB
    request["client.post()"]
    network["Red / API"]
    response["APIResponse"]
    assert["assertStatus(200)"]
    check{"status === 200?"}
    error["expect().toBe() falla"]
    success["parseJson()"]

    request --> network
    network --> response
    response --> assert
    assert --> check
    check -->|No| error
    check -->|Sí| success
```

### Error: Timeout

```mermaid
sequenceDiagram
    participant Client as ApiClient
    participant Context as APIRequestContext
    participant API as API Externa

    Client->>Context: post(url, {timeout})
    Context->>API: HTTP POST
    Note over API: Sin respuesta...
    Context-->>Context: Timeout alcanzado
    Context-->>Client: TimeoutError
    Client-->>Client: Propagar error
```

---

## Ciclo de Vida del APIRequestContext

El `APIRequestContext` de Playwright maneja internamente:

```mermaid
flowchart TB
    subgraph context["APIRequestContext"]
        subgraph pool["Connection Pool"]
            conn1["Conexión 1"]
            conn2["Conexión 2"]
            connN["Conexión N"]
        end

        subgraph state["Estado"]
            cookies["Cookies"]
            headers["Headers por defecto"]
            base["Base URL"]
        end
    end

    subgraph lifecycle["Ciclo de Vida"]
        create["newContext()"]
        use["get/post/put/delete"]
        destroy["dispose()"]
    end

    create --> context
    context --> use
    use --> context
    context --> destroy
```

---

## Objetos y sus Ciclos de Vida

| Objeto | Creación | Destrucción | Alcance |
|--------|----------|-------------|---------|
| `ApiClient` | Fixture setup | Fixture teardown | Un test |
| `APIRequestContext` | `init()` | `dispose()` | Un test |
| `AuthService` | Fixture setup | - | Un test |
| `APIResponse` | Por request | GC | Un request |

---

## Configuración del Cliente

Variables de entorno que afectan el ciclo de vida:

| Variable | Efecto | Ejemplo |
|----------|--------|---------|
| `API_BASE_URL` | URL base para requests | `https://api.example.com` |
| `API_TIMEOUT` | Timeout en ms | `30000` |
| `API_TOKEN` | Token de autorización | `eyJhbG...` |

**Ejemplo de configuración**:

```env
# .env.qa
API_BASE_URL=https://api-qa.example.com
API_TIMEOUT=30000
API_TOKEN=your-qa-token
```

---

## Flujo Completo con Múltiples Requests

```mermaid
sequenceDiagram
    participant Test as Test
    participant Auth as AuthService
    participant Users as UsersService
    participant Client as ApiClient
    participant API as API

    Note over Test: Setup
    Test->>Client: init()

    Note over Test: Request 1 - Login
    Test->>Auth: loginAndParse()
    Auth->>Client: post("/auth/login")
    Client->>API: POST
    API-->>Client: 200 {token}
    Client-->>Auth: response
    Auth-->>Test: LoginResponse

    Note over Test: Request 2 - Get Users
    Test->>Users: getUserByIdAndParse(1)
    Users->>Client: get("/users/1")
    Client->>API: GET
    API-->>Client: 200 {user}
    Client-->>Users: response
    Users-->>Test: UserResponse

    Note over Test: Teardown
    Test->>Client: dispose()
```

## Próximos Pasos

- [Capas del Módulo API](./capas-api.md) - Detalle de cada capa
- [Guía de Contribución](./guia-contribucion.md) - Cómo añadir services
- [Troubleshooting](./troubleshooting.md) - Problemas comunes
