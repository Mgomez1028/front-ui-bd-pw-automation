# Guia del Modulo Front (`front`)

## Objetivo

El modulo `front` automatiza flujos UI E2E usando:

- Playwright (browser automation)
- Cucumber (Gherkin + steps)
- TypeScript
- Patron POM (Page Object Model)

## Capas del modulo

### 1. Features (Gherkin)

Ruta: `front/src/features`

- Define comportamiento de negocio en lenguaje legible.
- Cada `Scenario` describe un flujo funcional.
- No debe tener detalles tecnicos (locators, selectors, waits).

Ejemplo de responsabilidad:
- Login exitoso
- Compra de producto

### 2. Steps

Ruta: `front/src/steps`

- Implementa Given/When/Then.
- Orquesta el flujo llamando Page Objects.
- Debe mantenerse delgado: sin logica de selectors compleja.
- Aqui puedes compartir datos por escenario via `CustomWorld`:
  - `setData("key", value)`
  - `getData<T>("key")`

### 3. Pages (POM)

Ruta: `front/src/pages`

- Encapsula locators, acciones y validaciones UI.
- Regla clave: los selectors viven aqui, no en steps.
- `BasePage.ts` contiene utilidades comunes (click, type, text, goto).

Ejemplo de clases:
- `LoginPage`
- `InventoryPage`
- `CartPage`
- `CheckoutPage`

### 4. Support / World

Ruta: `front/src/support`

- `world.ts`: contexto por escenario.
- Contiene `page`, `context`, `browser` y store generico de datos.
- Permite compartir informacion dinamica entre steps del mismo escenario.

### 5. Hooks

Ruta: `front/src/hooks`

- `global.hooks.ts`:
  - BeforeAll: lanza browser
  - AfterAll: cierra browser
- `scenario.hooks.ts`:
  - Before: crea contexto/pagina y limpia store
  - After: captura screenshot en fallo y cierra contexto

## Flujo de trabajo: crear un nuevo escenario Front

1. Define el escenario en Gherkin
- Crea/edita un `.feature` en `front/src/features`.
- Escribe pasos orientados a negocio.

2. Crea o reutiliza Page Objects
- Si aparece nueva pantalla, agrega clase en `front/src/pages`.
- Implementa acciones y validaciones en metodos claros.

3. Implementa los steps
- Crea/edita archivo en `front/src/steps`.
- Usa `CustomWorld` y Page Objects.
- Si necesitas estado entre steps, usa:
  - `this.setData("miDato", payload)`
  - `const data = this.getData<T>("miDato")`

4. Agrega validaciones funcionales
- Verifica texto, navegacion, estados de UI, confirmaciones.

5. Ejecuta pruebas

```bash
npm run test:front
```

Para ver ejecucion visual, configura en `.env.local`:

```env
FRONT_HEADLESS=false
FRONT_SLOWMO_MS=250
```

## Convenciones recomendadas

- Nombre de scenario enfocado en resultado de negocio.
- Steps cortos y expresivos.
- Nada de selectors en steps.
- Reusar metodos de POM antes de crear nuevos.
- Logs de datos compartidos con prefijo consistente, por ejemplo:
  - `[WORLD][SET]`
  - `[WORLD][USE]`

## Checklist rapido para Front

- Existe `.feature` con flujo claro.
- Steps implementados y sin logica UI pesada.
- Page Object encapsula locators/acciones.
- Hooks gestionan ciclo de vida y evidencias.
- Prueba ejecuta en `local` sin hardcode de entorno.
