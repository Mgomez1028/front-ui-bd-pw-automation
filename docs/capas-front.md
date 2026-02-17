# Capas del Módulo Front

El módulo Front implementa pruebas E2E de interfaz de usuario utilizando Cucumber (BDD) con Playwright y el patrón Page Object Model (POM).

## Diagrama de Capas

```mermaid
flowchart TB
    subgraph capa1["Capa 1: Features (Gherkin)"]
        feature["*.feature<br/>Lenguaje de negocio"]
    end

    subgraph capa2["Capa 2: Steps"]
        steps["*steps.ts<br/>Orquestación"]
    end

    subgraph capa3["Capa 3: Pages (POM)"]
        basepage["BasePage.ts<br/>Acciones comunes"]
        pages["*Page.ts<br/>Páginas concretas"]
    end

    subgraph capa4["Capa 4: Support"]
        world["CustomWorld<br/>Contexto de escenario"]
        testctx["testContext<br/>Contexto global"]
    end

    subgraph capa5["Capa 5: Hooks"]
        global["global.hooks.ts<br/>BeforeAll/AfterAll"]
        scenario["scenario.hooks.ts<br/>Before/After"]
    end

    subgraph capa6["Capa 6: Playwright"]
        browser["Browser"]
        context["BrowserContext"]
        page["Page"]
    end

    feature --> steps
    steps --> pages
    pages --> basepage
    steps --> world
    world --> page
    global --> browser
    scenario --> context
    scenario --> world
    context --> page
```

## Capa 1: Features (Gherkin)

**Ubicación**: `front/src/features/`

### Propósito

Definir el comportamiento esperado en lenguaje natural, comprensible para stakeholders no técnicos.

### Estructura de un Feature

```gherkin
# front/src/features/login.feature
Feature: Login de usuario
  Como usuario del sistema
  Quiero poder iniciar sesión
  Para acceder a las funcionalidades

  Scenario: Login exitoso con credenciales válidas
    Given el usuario está en la página de login
    When ingresa credenciales válidas
    And hace clic en el botón de login
    Then debe ver la página de inventario

  Scenario: Login fallido con credenciales inválidas
    Given el usuario está en la página de login
    When ingresa credenciales inválidas
    And hace clic en el botón de login
    Then debe ver un mensaje de error
```

### Reglas de Diseño

| Hacer | No Hacer |
|-------|----------|
| Usar lenguaje de negocio | Mencionar selectores CSS |
| Describir intención del usuario | Incluir detalles técnicos |
| Mantener escenarios independientes | Crear dependencias entre scenarios |
| Usar Background para setup común | Repetir Given en cada scenario |

### Elementos Gherkin Soportados

- `Feature`: Agrupa escenarios relacionados
- `Scenario`: Caso de prueba individual
- `Scenario Outline` + `Examples`: Pruebas parametrizadas
- `Background`: Steps comunes previos a cada scenario
- `Given/When/Then/And/But`: Steps del escenario

---

## Capa 2: Steps

**Ubicación**: `front/src/steps/`

### Propósito

Implementar los steps de Gherkin, orquestando llamadas a Page Objects sin contener lógica de UI directa.

### Anatomía de un Step File

```typescript
// front/src/steps/login.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";
import { LoginPage } from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";
import { config } from "../../../config";

Given("el usuario está en la página de login", async function (this: CustomWorld) {
  // Crear instancia de Page Object con la página del World
  const loginPage = new LoginPage(this.page!);

  // Delegar acción al Page Object
  await loginPage.open();

  // Opcional: guardar referencia para steps posteriores
  this.setData("loginPage", loginPage);
});

When("ingresa credenciales válidas", async function (this: CustomWorld) {
  const loginPage = this.getData<LoginPage>("loginPage")!;

  // Usar configuración centralizada, no hardcodear credenciales
  await loginPage.login(config.frontUsername, config.frontPassword);
});

Then("debe ver la página de inventario", async function (this: CustomWorld) {
  const inventoryPage = new InventoryPage(this.page!);

  // Validación usando expect de Playwright
  const title = await inventoryPage.getTitle();
  expect(title).toContain("Products");
});
```

### Patrón de Comunicación entre Steps

```mermaid
sequenceDiagram
    participant G as Given Step
    participant World as CustomWorld
    participant W as When Step
    participant T as Then Step

    G->>World: setData("loginPage", page)
    G->>World: setData("userData", user)
    World-->>W: getData("loginPage")
    W->>World: setData("response", result)
    World-->>T: getData("response")
    T->>T: Validar resultado
```

### Reglas de Diseño

| Hacer | No Hacer |
|-------|----------|
| Delegar UI a Page Objects | Usar `this.page.locator()` directamente |
| Usar `this.setData()/getData()` para compartir estado | Usar variables globales |
| Tipar `this: CustomWorld` | Omitir el tipo de this |
| Importar config para valores | Hardcodear URLs/credenciales |

---

## Capa 3: Pages (Page Object Model)

**Ubicación**: `front/src/pages/`

### Propósito

Encapsular la interacción con la UI: selectores, acciones y validaciones específicas de cada página.

### BasePage: Clase Base

```typescript
// front/src/pages/BasePage.ts
import { Page } from "playwright";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navegación
  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  // Acciones genéricas
  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  async type(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  async text(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) ?? "";
  }
}
```

### Page Concreta: Ejemplo LoginPage

```typescript
// front/src/pages/LoginPage.ts
import { config } from "../../../config";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Selectores como propiedades privadas
  private readonly usernameInput = "#user-name";
  private readonly passwordInput = "#password";
  private readonly submitButton = "#login-button";
  private readonly errorMessage = "[data-test='error']";

  // Métodos de acción
  async open(): Promise<void> {
    await this.goto(config.frontBaseUrl);
  }

  async login(username: string, password: string): Promise<void> {
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  // Métodos de obtención de datos
  async errorText(): Promise<string> {
    return this.text(this.errorMessage);
  }
}
```

### Diagrama de Herencia

```mermaid
classDiagram
    class BasePage {
        #page: Page
        +goto(url: string)
        +click(selector: string)
        +type(selector: string, value: string)
        +text(selector: string): string
    }

    class LoginPage {
        -usernameInput: string
        -passwordInput: string
        -submitButton: string
        -errorMessage: string
        +open()
        +login(username, password)
        +errorText(): string
    }

    class InventoryPage {
        -title: string
        -addToCartButtons: string
        +getTitle(): string
        +addItemToCart(index: number)
        +getItemCount(): number
    }

    class CartPage {
        -cartItems: string
        -checkoutButton: string
        +getItemsCount(): number
        +checkout()
    }

    BasePage <|-- LoginPage
    BasePage <|-- InventoryPage
    BasePage <|-- CartPage
```

### Reglas de Diseño

| Hacer | No Hacer |
|-------|----------|
| Selectores como propiedades privadas | Exponer selectores públicamente |
| Métodos con nombres de acción de negocio | Métodos genéricos como `clickButton1()` |
| Retornar datos tipados | Retornar elementos de Playwright |
| Heredar de BasePage | Duplicar lógica común |

---

## Capa 4: Support

**Ubicación**: `front/src/support/`

### Propósito

Proveer contexto compartido para los escenarios: referencias a browser/page y almacenamiento de datos entre steps.

### CustomWorld

```typescript
// front/src/support/world.ts
import { IWorldOptions, setWorldConstructor, World } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page } from "playwright";

export class CustomWorld extends World {
  // Referencias de Playwright (inicializadas por hooks)
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;

  // Store de datos por escenario
  private scenarioData: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  // Guardar dato para uso posterior en el escenario
  setData<T>(key: string, value: T): void {
    this.scenarioData[key] = value as unknown;
  }

  // Recuperar dato guardado
  getData<T>(key: string): T | undefined {
    return this.scenarioData[key] as T | undefined;
  }

  // Limpiar datos (llamado en Before hook)
  clearData(): void {
    this.scenarioData = {};
  }
}

setWorldConstructor(CustomWorld);
```

### testContext (Contexto Global)

```typescript
// front/src/support/testContext.ts
import { Browser } from "playwright";

// Singleton para mantener referencia al browser entre scenarios
export const uiContext: { browser?: Browser } = {};
```

### Diagrama de Uso del World

```mermaid
flowchart LR
    subgraph Scenario["Escenario de Test"]
        given["Given Step"]
        when["When Step"]
        then["Then Step"]
    end

    subgraph World["CustomWorld"]
        page["page: Page"]
        context["context: BrowserContext"]
        data["scenarioData: Record"]
    end

    given -->|"this.page"| page
    given -->|"setData()"| data
    when -->|"getData()"| data
    when -->|"this.page"| page
    then -->|"getData()"| data
    then -->|"this.page"| page
```

---

## Capa 5: Hooks

**Ubicación**: `front/src/hooks/`

### Propósito

Gestionar el ciclo de vida del browser, contexto y página, además de tareas transversales como capturas de pantalla.

### global.hooks.ts (Ciclo de Suite)

```typescript
// front/src/hooks/global.hooks.ts
import { config } from "../../../config";
import { AfterAll, BeforeAll } from "@cucumber/cucumber";
import { chromium } from "playwright";
import { uiContext } from "../support/testContext";

BeforeAll(async () => {
  // Lanza browser una vez para toda la suite
  uiContext.browser = await chromium.launch({
    headless: config.frontHeadless,
    slowMo: config.frontSlowMoMs
  });
});

AfterAll(async () => {
  // Cierra browser al finalizar la suite
  await uiContext.browser?.close();
});
```

### scenario.hooks.ts (Ciclo de Escenario)

```typescript
// front/src/hooks/scenario.hooks.ts
import { After, Before, ITestCaseHookParameter, Status } from "@cucumber/cucumber";
import fs from "node:fs";
import path from "node:path";
import { CustomWorld } from "../support/world";
import { uiContext } from "../support/testContext";

Before(async function (this: CustomWorld) {
  if (!uiContext.browser) {
    throw new Error("Browser is not initialized.");
  }

  // Limpiar datos del escenario anterior
  this.clearData();

  // Crear nuevo contexto y página para aislamiento
  this.context = await uiContext.browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  // Capturar screenshot si el escenario falló
  if (this.page && scenario.result?.status === Status.FAILED) {
    const reportDir = path.resolve(process.cwd(), "reports/front/screenshots");
    fs.mkdirSync(reportDir, { recursive: true });

    const fileName = `${scenario.pickle.name.replace(/\s+/g, "_")}-${Date.now()}.png`;
    await this.page.screenshot({
      path: path.join(reportDir, fileName),
      fullPage: true
    });
  }

  // Cerrar contexto (libera recursos)
  await this.context?.close();
});
```

### Orden de Ejecución de Hooks

```mermaid
sequenceDiagram
    participant Suite as Test Suite
    participant BeforeAll as BeforeAll Hook
    participant Before as Before Hook
    participant Scenario as Scenario Steps
    participant After as After Hook
    participant AfterAll as AfterAll Hook

    Suite->>BeforeAll: Ejecutar una vez
    Note over BeforeAll: chromium.launch()

    loop Por cada Scenario
        Suite->>Before: Antes del scenario
        Note over Before: newContext(), newPage()
        Suite->>Scenario: Given → When → Then
        Suite->>After: Después del scenario
        Note over After: screenshot si falla, close()
    end

    Suite->>AfterAll: Ejecutar una vez
    Note over AfterAll: browser.close()
```

---

## Capa 6: Playwright (Driver)

### Propósito

Automatizar el browser. Esta capa es proporcionada por Playwright y es consumida por las capas superiores.

### Jerarquía de Objetos

```mermaid
flowchart TB
    subgraph playwright["Playwright Objects"]
        browser["Browser<br/>(instancia de Chromium)"]
        context1["BrowserContext<br/>(Scenario 1)"]
        context2["BrowserContext<br/>(Scenario 2)"]
        page1["Page<br/>(Tab del Scenario 1)"]
        page2["Page<br/>(Tab del Scenario 2)"]
    end

    browser --> context1
    browser --> context2
    context1 --> page1
    context2 --> page2
```

### Responsabilidades por Objeto

| Objeto | Responsabilidad | Ciclo de Vida |
|--------|-----------------|---------------|
| **Browser** | Instancia del navegador | Suite completa |
| **BrowserContext** | Sesión aislada (cookies, storage) | Por escenario |
| **Page** | Tab del navegador | Por escenario |

---

## Flujo Completo de Datos

```mermaid
flowchart TB
    subgraph input["Entrada"]
        feature[".feature<br/>Gherkin"]
        config["config/<br/>Variables de entorno"]
        data["data/<br/>Datos de prueba"]
    end

    subgraph processing["Procesamiento"]
        cucumber["Cucumber<br/>Parser + Runner"]
        steps["Steps<br/>Orquestación"]
        pages["Pages<br/>Interacción UI"]
        playwright["Playwright<br/>Browser Automation"]
    end

    subgraph output["Salida"]
        browser["Browser<br/>Aplicación bajo prueba"]
        reports["reports/<br/>HTML + JSON + Screenshots"]
    end

    feature --> cucumber
    config --> steps
    data --> steps
    cucumber --> steps
    steps --> pages
    pages --> playwright
    playwright --> browser
    cucumber --> reports
    steps -.->|"screenshot en fallo"| reports
```

## Próximos Pasos

- [Ciclo de Vida Front](./ciclo-vida-front.md) - Diagrama temporal detallado
- [Guía de Contribución](./guia-contribucion.md) - Cómo añadir páginas y features
