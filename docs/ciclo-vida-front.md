# Ciclo de Vida del Driver - Módulo Front

Este documento detalla el ciclo de vida completo del browser/driver en el módulo Front, desde la inicialización hasta el cierre.

## Visión General

```mermaid
flowchart TB
    subgraph suite["Suite de Tests"]
        subgraph init["Inicialización (1 vez)"]
            beforeAll["BeforeAll<br/>Launch Browser"]
        end

        subgraph scenarios["Por cada Scenario"]
            before["Before<br/>New Context + Page"]
            steps["Steps<br/>Interacción UI"]
            after["After<br/>Screenshot + Close"]
        end

        subgraph cleanup["Limpieza (1 vez)"]
            afterAll["AfterAll<br/>Close Browser"]
        end
    end

    beforeAll --> scenarios
    scenarios --> afterAll
    before --> steps --> after
```

## Diagrama de Secuencia Completo

```mermaid
sequenceDiagram
    participant Runner as Cucumber Runner
    participant Global as global.hooks.ts
    participant Scenario as scenario.hooks.ts
    participant World as CustomWorld
    participant Context as testContext
    participant PW as Playwright
    participant Browser as Browser
    participant Ctx as BrowserContext
    participant Page as Page

    Note over Runner: Inicio de Suite

    %% BeforeAll
    Runner->>Global: BeforeAll()
    Global->>PW: chromium.launch(options)
    PW->>Browser: Crear instancia
    Browser-->>PW: browser
    PW-->>Global: browser
    Global->>Context: uiContext.browser = browser
    Note over Context: Browser almacenado globalmente

    %% Scenario 1
    rect rgb(200, 230, 200)
        Note over Runner: Scenario 1
        Runner->>Scenario: Before()
        Scenario->>World: this.clearData()
        Scenario->>Context: uiContext.browser
        Context-->>Scenario: browser
        Scenario->>Browser: newContext()
        Browser->>Ctx: Crear contexto aislado
        Ctx-->>Browser: context
        Browser-->>Scenario: context
        Scenario->>World: this.context = context
        Scenario->>Ctx: newPage()
        Ctx->>Page: Crear tab
        Page-->>Ctx: page
        Ctx-->>Scenario: page
        Scenario->>World: this.page = page

        Runner->>Runner: Ejecutar Steps (Given/When/Then)
        Note over Page: Interacciones UI

        Runner->>Scenario: After(scenarioResult)
        alt Scenario FAILED
            Scenario->>Page: screenshot()
            Page-->>Scenario: imagen
            Scenario->>Scenario: Guardar en reports/
        end
        Scenario->>Ctx: close()
        Note over Ctx: Contexto cerrado
    end

    %% Scenario 2
    rect rgb(200, 220, 240)
        Note over Runner: Scenario 2
        Runner->>Scenario: Before()
        Note over Scenario: Mismo flujo: clearData, newContext, newPage
        Runner->>Runner: Ejecutar Steps
        Runner->>Scenario: After()
        Note over Scenario: Screenshot si falla, close context
    end

    %% AfterAll
    Note over Runner: Fin de Suite
    Runner->>Global: AfterAll()
    Global->>Context: uiContext.browser
    Context-->>Global: browser
    Global->>Browser: close()
    Note over Browser: Browser cerrado
```

## Fases del Ciclo de Vida

### Fase 1: BeforeAll - Inicialización del Browser

**Archivo**: `front/src/hooks/global.hooks.ts`

**Cuándo**: Una vez al inicio de la suite, antes de cualquier scenario.

**Qué hace**:
1. Lee configuración de entorno (headless, slowMo)
2. Lanza instancia de Chromium
3. Almacena referencia en contexto global

```typescript
BeforeAll(async () => {
  uiContext.browser = await chromium.launch({
    headless: config.frontHeadless,  // true por defecto
    slowMo: config.frontSlowMoMs     // 0 por defecto
  });
});
```

**Diagrama de estado**:

```mermaid
stateDiagram-v2
    [*] --> SinBrowser: Suite inicia
    SinBrowser --> BrowserLanzado: chromium.launch()
    BrowserLanzado --> BrowserLanzado: Scenarios ejecutan

    state BrowserLanzado {
        [*] --> Idle
        Idle --> EnUso: newContext()
        EnUso --> Idle: context.close()
    }
```

---

### Fase 2: Before - Setup del Scenario

**Archivo**: `front/src/hooks/scenario.hooks.ts`

**Cuándo**: Antes de cada scenario, después de parsear el feature.

**Qué hace**:
1. Valida que el browser existe
2. Limpia datos del scenario anterior
3. Crea nuevo `BrowserContext` (sesión aislada)
4. Crea nueva `Page` (tab del navegador)
5. Asigna referencias al World

```typescript
Before(async function (this: CustomWorld) {
  if (!uiContext.browser) {
    throw new Error("Browser is not initialized.");
  }

  this.clearData();  // Limpiar store de datos
  this.context = await uiContext.browser.newContext();
  this.page = await this.context.newPage();
});
```

**¿Por qué nuevo Context por scenario?**

```mermaid
flowchart LR
    subgraph isolation["Aislamiento por Scenario"]
        sc1["Scenario 1<br/>Context A"]
        sc2["Scenario 2<br/>Context B"]
        sc3["Scenario 3<br/>Context C"]
    end

    subgraph benefits["Beneficios"]
        cookies["Cookies independientes"]
        storage["LocalStorage separado"]
        session["Sesiones aisladas"]
        parallel["Paralelizable"]
    end

    sc1 --> cookies
    sc2 --> storage
    sc3 --> session
    isolation --> parallel
```

---

### Fase 3: Steps - Ejecución del Scenario

**Archivos**: `front/src/steps/*.ts` + `front/src/pages/*.ts`

**Cuándo**: Durante la ejecución de Given/When/Then.

**Flujo de interacción**:

```mermaid
sequenceDiagram
    participant Step as login.steps.ts
    participant World as CustomWorld
    participant PageObj as LoginPage
    participant Page as Playwright Page
    participant DOM as DOM del Browser

    Step->>World: this.page
    World-->>Step: page
    Step->>PageObj: new LoginPage(page)
    Step->>PageObj: open()
    PageObj->>Page: goto(url)
    Page->>DOM: Navegar
    DOM-->>Page: Cargado
    Step->>PageObj: login(user, pass)
    PageObj->>Page: locator("#user").fill(user)
    Page->>DOM: Escribir
    PageObj->>Page: locator("#login").click()
    Page->>DOM: Click
    DOM-->>Page: Evento procesado
```

**Ciclo de vida de datos compartidos**:

```mermaid
flowchart TB
    subgraph scenario["Scenario"]
        given["Given Step"]
        when["When Step"]
        then["Then Step"]
    end

    subgraph world["CustomWorld.scenarioData"]
        data["{ }<br/>vacío"]
        data2["{ loginPage: ... }"]
        data3["{ loginPage: ...,<br/>  userData: ... }"]
    end

    given -->|"setData('loginPage', page)"| data2
    when -->|"getData('loginPage')"| data2
    when -->|"setData('userData', user)"| data3
    then -->|"getData('userData')"| data3
```

---

### Fase 4: After - Cleanup del Scenario

**Archivo**: `front/src/hooks/scenario.hooks.ts`

**Cuándo**: Después de cada scenario, incluso si falla.

**Qué hace**:
1. Verifica si el scenario falló
2. Si falló: captura screenshot de pantalla completa
3. Cierra el BrowserContext (y todas sus pages)

```typescript
After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  // Screenshot en fallo
  if (this.page && scenario.result?.status === Status.FAILED) {
    const reportDir = path.resolve(process.cwd(), "reports/front/screenshots");
    fs.mkdirSync(reportDir, { recursive: true });

    const fileName = `${scenario.pickle.name.replace(/\s+/g, "_")}-${Date.now()}.png`;
    await this.page.screenshot({
      path: path.join(reportDir, fileName),
      fullPage: true
    });
  }

  // Cerrar contexto
  await this.context?.close();
});
```

**Diagrama de decisión**:

```mermaid
flowchart TB
    start["After Hook inicia"]
    check{"scenario.result.status<br/>== FAILED?"}
    screenshot["Capturar screenshot<br/>fullPage: true"]
    save["Guardar en<br/>reports/front/screenshots/"]
    close["context.close()"]
    finish["Hook termina"]

    start --> check
    check -->|Sí| screenshot
    screenshot --> save
    save --> close
    check -->|No| close
    close --> finish
```

---

### Fase 5: AfterAll - Cierre del Browser

**Archivo**: `front/src/hooks/global.hooks.ts`

**Cuándo**: Una vez al final de la suite, después de todos los scenarios.

**Qué hace**:
1. Cierra la instancia del browser
2. Libera todos los recursos del proceso

```typescript
AfterAll(async () => {
  await uiContext.browser?.close();
});
```

**Estado final**:

```mermaid
stateDiagram-v2
    BrowserActivo --> Cerrando: AfterAll
    Cerrando --> Cerrado: browser.close()
    Cerrado --> [*]: Recursos liberados
```

---

## Diagrama de Tiempo Completo

```mermaid
gantt
    title Ciclo de Vida del Browser
    dateFormat X
    axisFormat %s

    section Suite
    BeforeAll (launch)       :a1, 0, 1
    AfterAll (close)         :a2, 10, 1

    section Scenario 1
    Before (newContext)      :b1, 1, 1
    Given Step               :b2, 2, 1
    When Step                :b3, 3, 1
    Then Step                :b4, 4, 1
    After (close context)    :b5, 5, 1

    section Scenario 2
    Before (newContext)      :c1, 6, 1
    Steps                    :c2, 7, 2
    After (close context)    :c3, 9, 1
```

## Objetos y sus Ciclos de Vida

| Objeto | Creación | Destrucción | Alcance |
|--------|----------|-------------|---------|
| `Browser` | BeforeAll | AfterAll | Suite completa |
| `BrowserContext` | Before | After | Un scenario |
| `Page` | Before | After (implícito) | Un scenario |
| `CustomWorld` | Cucumber | Cucumber | Un scenario |
| `scenarioData` | Before (clear) | After (descartado) | Un scenario |

## Manejo de Errores

### Error: Browser no inicializado

```mermaid
flowchart TB
    before["Before Hook"]
    check{"uiContext.browser<br/>existe?"}
    error["throw Error<br/>'Browser is not initialized'"]
    continue["Continuar setup"]

    before --> check
    check -->|No| error
    check -->|Sí| continue
```

**Causas comunes**:
- BeforeAll no se ejecutó (error en import)
- Error previo en BeforeAll
- Orden incorrecto de hooks

### Error durante Step

```mermaid
flowchart TB
    step["Step ejecutando"]
    error["Error en step"]
    cucumber["Cucumber marca<br/>scenario como FAILED"]
    after["After hook ejecuta"]
    screenshot["Screenshot capturado"]
    close["Context cerrado"]

    step --> error
    error --> cucumber
    cucumber --> after
    after --> screenshot
    screenshot --> close
```

## Configuración del Browser

Variables de entorno que afectan el ciclo de vida:

| Variable | Efecto | Valor por defecto |
|----------|--------|-------------------|
| `FRONT_HEADLESS` | Browser visible/invisible | `true` |
| `FRONT_SLOWMO_MS` | Delay entre acciones (ms) | `0` |

**Para debugging visual**:

```env
# .env.local
FRONT_HEADLESS=false
FRONT_SLOWMO_MS=250
```

## Próximos Pasos

- [Capas del Módulo Front](./capas-front.md) - Detalle de cada capa
- [Guía de Contribución](./guia-contribucion.md) - Cómo añadir tests
- [Troubleshooting](./troubleshooting.md) - Problemas comunes
