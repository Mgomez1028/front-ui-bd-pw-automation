# Arquitectura General del Framework

## Visión Global

Este framework implementa automatización de pruebas con dos módulos independientes que comparten configuración y utilidades comunes.

```mermaid
flowchart TB
    subgraph root["Raíz del Proyecto"]
        config["config/<br/>Configuración centralizada"]
        shared["shared/<br/>Utilidades compartidas"]
        envfiles[".env, .env.local, .env.qa, .env.prod"]
    end

    subgraph front_module["Módulo Front (UI E2E)"]
        cucumber["Cucumber<br/>(BDD Runner)"]
        playwright_front["Playwright<br/>(Browser Automation)"]
        pom["Page Object Model"]
    end

    subgraph api_module["Módulo API"]
        playwright_test["Playwright Test<br/>(Test Runner)"]
        service_model["Service Model Pattern"]
    end

    envfiles --> config
    config --> front_module
    config --> api_module
    shared --> front_module
    shared --> api_module
```

## Estructura de Directorios

```
automation-playwright/
├── config/                    # Configuración centralizada
│   ├── env.ts                 # Carga y valida variables de entorno
│   ├── types.ts               # Tipos de configuración
│   └── index.ts               # Exporta config
├── shared/                    # Código compartido entre módulos
│   ├── logger/                # Utilidad de logging
│   ├── types/                 # Tipos comunes
│   └── utils/                 # Helpers (dataFactory, wait)
├── front/                     # Módulo UI E2E
│   ├── cucumber.js            # Configuración Cucumber
│   ├── playwright.config.ts   # Config Playwright para screenshots/traces
│   ├── tsconfig.json          # Config TypeScript del módulo
│   └── src/
│       ├── features/          # Archivos .feature (Gherkin)
│       ├── steps/             # Implementación de steps
│       ├── pages/             # Page Objects
│       ├── hooks/             # BeforeAll, Before, After, AfterAll
│       ├── support/           # World y contexto de test
│       ├── fixtures/          # Fixtures adicionales
│       └── data/              # Datos de prueba (JSON)
├── api/                       # Módulo API
│   ├── playwright.config.ts   # Configuración Playwright Test
│   ├── tsconfig.json          # Config TypeScript del módulo
│   └── src/
│       ├── tests/             # Specs de prueba
│       ├── services/          # Servicios por dominio
│       ├── client/            # Cliente HTTP base
│       ├── models/            # Request/Response types
│       ├── fixtures/          # Playwright fixtures
│       └── hooks/             # Hooks de test
├── reports/                   # Reportes generados
│   ├── front/                 # Reportes Cucumber + screenshots
│   └── api/                   # Reportes Playwright Test
├── .env                       # Variables base
├── .env.local                 # Sobrescrituras locales
├── .env.qa                    # Config ambiente QA
├── .env.prod                  # Config ambiente Producción
└── package.json               # Scripts y dependencias
```

## Comparativa de Módulos

| Aspecto | Módulo Front | Módulo API |
|---------|--------------|------------|
| **Runner** | Cucumber | Playwright Test |
| **Sintaxis de Test** | Gherkin (.feature) | TypeScript (.spec.ts) |
| **Patrón Principal** | Page Object Model | Service Model |
| **Driver/Cliente** | Browser (Chromium) | APIRequestContext |
| **Ciclo de Vida** | Hooks Cucumber | Fixtures Playwright |
| **Objetivo** | UI E2E Testing | API Functional Testing |

## Diagrama de Dependencias

```mermaid
flowchart LR
    subgraph externos["Dependencias Externas"]
        pw["@playwright/test"]
        cucumber["@cucumber/cucumber"]
        dotenv["dotenv"]
        tsnode["ts-node"]
    end

    subgraph config_layer["Capa de Configuración"]
        env_ts["config/env.ts"]
        types_ts["config/types.ts"]
    end

    subgraph shared_layer["Capa Compartida"]
        logger["shared/logger"]
        utils["shared/utils"]
    end

    subgraph front_layer["Módulo Front"]
        pages["Pages (POM)"]
        steps["Steps"]
        features["Features"]
        front_hooks["Hooks"]
        world["World"]
    end

    subgraph api_layer["Módulo API"]
        services["Services"]
        client["ApiClient"]
        models["Models"]
        api_fixtures["Fixtures"]
        api_tests["Tests"]
    end

    dotenv --> env_ts
    pw --> client
    pw --> pages
    cucumber --> steps
    cucumber --> front_hooks
    cucumber --> world

    env_ts --> front_layer
    env_ts --> api_layer
    shared_layer --> front_layer
    shared_layer --> api_layer

    features --> steps
    steps --> pages
    steps --> world
    front_hooks --> world

    api_tests --> api_fixtures
    api_fixtures --> services
    services --> client
    services --> models
```

## Flujo de Configuración de Entorno

La configuración se carga en capas, permitiendo sobrescrituras por ambiente:

```mermaid
sequenceDiagram
    participant Script as npm script
    participant CrossEnv as cross-env
    participant Config as config/env.ts
    participant DotEnv as dotenv

    Script->>CrossEnv: TEST_ENV=qa npm run test:front
    CrossEnv->>Config: process.env.TEST_ENV = "qa"
    Config->>DotEnv: Cargar .env (base)
    DotEnv-->>Config: Variables base
    Config->>DotEnv: Cargar .env.qa
    DotEnv-->>Config: Sobrescribir con QA
    Note over Config: Si TEST_ENV=local
    Config->>DotEnv: Cargar .env.local (solo local)
    DotEnv-->>Config: Sobrescrituras finales
    Config-->>Script: AppConfig validado
```

## Principios de Diseño

### 1. Separación de Responsabilidades

Cada capa tiene una responsabilidad única:
- **Config**: Gestión de entornos y variables
- **Pages/Services**: Encapsulación de interacciones
- **Steps/Tests**: Orquestación de flujos
- **Features/Specs**: Definición de comportamiento

### 2. Reutilización

- `BasePage` y `BaseService` proveen funcionalidad común
- `shared/` contiene código agnóstico al módulo
- Fixtures y World evitan duplicación de setup/teardown

### 3. Tipado Fuerte

- Modelos TypeScript para requests/responses
- Interfaces para configuración
- Tipos genéricos en World y Services

### 4. Independencia de Módulos

- Front y API pueden ejecutarse independientemente
- No hay dependencias cruzadas entre módulos
- Comparten solo configuración y utilidades

## Próximos Pasos

- [Capas del Módulo Front](./capas-front.md) - Detalle de cada capa UI
- [Capas del Módulo API](./capas-api.md) - Detalle de cada capa API
- [Ciclo de Vida Front](./ciclo-vida-front.md) - Flujo del browser
- [Ciclo de Vida API](./ciclo-vida-api.md) - Flujo del cliente HTTP
