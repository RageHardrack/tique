# Tique — Plataforma de Gestión Patrimonial & Finanzas Personales

**Tique** (nombrada en honor a la deidad griega de la fortuna, la prosperidad y el destino) es la aplicación web SPA/PWA para el control patrimonial, cuentas multimoneda y seguimiento financiero dentro del ecosistema **Lascar**.

Se conecta a la API backend **Guilliman** mediante cliente HTTP centralizado (`ApiClient`) y utiliza **Nuxt UI v4** con la paleta de identidad visual de **Lascar Blog** (Deep Navy `#0B0F19`, Steel Blue `#4D7EA8`, Soft Gold `#E0DDCF`, Antique Ivory `#FAF7F2`) con soporte completo para modo claro y oscuro.

---

## 🌟 Módulos y Capacidades

- **Cuentas Multimoneda**: Gestión de cuentas bancarias, billeteras digitales y efectivo con conversión en tiempo real a moneda base (USD, PEN, VES) y tasas configurables.
- **Conciliación & Ajuste de Saldos Reales**: Comparación directa entre saldo contable y saldo real de banco/billetera con generación atómica de movimientos de ajuste y cálculo de discrepancias.
- **Analítica Visual**: Gráfico Donut interactivo SVG para distribución de gastos por categoría y tarjeta de Flujo de Caja Neto con cálculo automático de tasa de ahorro mensual.
- **Registro Rápido Diario (Mobile Quick-Add & FAB)**: Botón flotante ergonómico para una sola mano, bottom sheet con input numérico táctil grande, detección automática de gastos frecuentes y PWA Web App Shortcuts (`Nuevo Gasto`, `Nuevo Ingreso`).
- **Presupuestos Mensuales**: Definición de metas y límites de gasto por categoría con barras de progreso dinámicas (Verde `< 75%`, Amarillo `75% - 99%`, Rojo `>= 100%`) y disponible restante.
- **Metas de Ahorro (Sinking Funds)**: Fondos especiales y objetivos a mediano/largo plazo con progreso visual, cálculo de faltante, fechas límite y depósitos/retiros directos contra cuentas bancarias.
- **Suscripciones y Pagos Fijos**: Gestión de pagos recurrentes con badges de urgencia (`Vence hoy`, `Vence en X días`), alertas y ejecución atómica de cobro con avance automático de fecha.
- **Deudas a Cuotas & Esquema Cashea (14 días)**: Motor de financiamiento quincenal (`BIWEEKLY_14_DAYS`), semanal y mensual con amortización sin interés (0%) o tasa pactada, desglose cronológico de cuotas y fechas límites de pago automáticas.
- **Inteligencia para Tarjetas de Crédito**: Gestión de límites crediticios, porcentaje dinámico de utilización, cálculo de línea disponible, días de corte, fechas límite de pago y estimación de pago mínimo mensual.
- **Dashboard de Patrimonio Neto Real & Desglose de Activos/Pasivos**: Consolidación ejecutiva del patrimonio total descontando deudas y líneas de crédito consumidas, con visibilidad de liquidez operativa disponible.
- **Calendario Financiero Unificado**: Vista mensual y semanal interactiva de compromisos de pago agrupando suscripciones, cuotas de préstamos/Cashea y fechas de corte y pago de tarjetas con totales proyectados.
- **Motor de Sugerencias Predictivas de Categorías & Alertas Presupuestarias**: Autocompletado inteligente de categorías al tipear notas basado en historial y reglas semánticas, junto con alertas proactivas en tiempo real al superar el 80% (Warning) o 100% (Exceeded) del presupuesto de la categoría.
- **Préstamos & Deudas (Loans & Debts Engine)**: Control de dinero prestado (*Me Deben / Activo*) y deudas pendientes (*Debo / Pasivo*), amortizaciones parciales y totales con conciliación bancaria atómica, barras de progreso y cálculo de saldos pendientes.
- **Módulo Tributario & Impuestos SUNAT (Perú - 4ta y 5ta Categoría)**: Motor de proyección en vivo para rentas de trabajo (independientes con Recibos por Honorarios y dependientes en planilla). Incluye deducción automática del 20% en 4ta, deducción legal de 7 UIT, tracking de gastos deducibles de hasta 3 UIT (restaurantes, hoteles, alquileres, servicios profesionales), desglose por tramos progresivos (8% a 30%) y cálculo de retenciones del 8% acumuladas contra saldo a pagar o a favor (devolución). *Para más detalle normativo y operativo, consulta la [Guía de Arquitectura Tributaria SUNAT](file:///Users/danielcolmenares/Programming/personal/Lascar/tique/docs/SUNAT_TAX_ARCHITECTURE_GUIDE.md)*.
- **Diálogos de Confirmación Nativos de UI**: Sistema centralizado de confirmación modal (`useConfirm`) sin alertas ni bloqueos nativos del navegador, con soporte para variantes contextuales (`danger`, `warning`, `info`).
- **Control Preciso de Fechas y Zonas Horarias**: Motor (`DateFormatter`) que preserva de forma estricta los días de calendario seleccionados (`YYYY-MM-DD`), inmune a desfases horarios por desfase UTC.
- **Recordatorios Proactivos de Pagos**: Banner destacado en el Dashboard para suscripciones y servicios próximos a vencer o vencidos con acción directa de registro de pago y soporte para notificaciones web.
- **Importación Masiva de Extractos Bancarios (CSV / Excel)**: Importador guiado paso a paso con auto-detección de delimitador y columnas, mapeo interactivo de cabeceras, detector inteligente de duplicados y previsualización con selección múltiple.
- **Reportes Financieros Periódicos**: Análisis multiventana de tiempo con presets (Mensual, Bimestral, Trimestral, Semestral, Año Completo y Rango Manual Personalizado), gráfico de tendencias Ingresos vs Gastos, exportación a PDF oficial y CSV.
- **Búsqueda, Filtros y Exportación CSV**: Búsqueda en tiempo real por texto, filtros combinados por tipo, cuenta, categoría y fechas, y exportación de historial en formato CSV (RFC 4180).

---

## 🛠️ Stack Tecnológico

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`, TypeScript estricto)
- **Componentes UI**: [Nuxt UI (`@nuxt/ui`)](https://ui.nuxt.com/)
- **Estilos & Diseño**: [TailwindCSS v4](https://tailwindcss.com/)
- **Estado Global**: [Pinia](https://pinia.vuejs.org/)
- **Enrutamiento**: [Vue Router 5](https://router.vuejs.org/)
- **Capacidades Offline/PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Build Tool**: [Vite](https://vitejs.dev/) + `@nuxt/ui/vite`
- **Gestor de Paquetes**: [Bun](https://bun.sh/)
- **Gestión de Puertos**: [Portless](https://portless.org/) (`PORTLESS_PORT=1355 PORTLESS_HTTPS=0 portless run ...`)
- **Unit Testing**: [Vitest](https://vitest.dev/) con 100% de pruebas pasando (197/197 tests en 39 suites)
- **E2E Testing**: [Playwright](https://playwright.dev/) con suite multi-dispositivo (16/16 suites, 38 tests pasando en Desktop & Mobile)

---

## 🚦 Comandos de Ejecución

```bash
# Desarrollo con Portless
bun run dev

# Compilación para producción
bun run build

# Pruebas unitarias
bun run test

# Pruebas End-to-End (E2E)
bun run test:e2e
bun run test:e2e:ui
```

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Instalación de dependencias
```bash
bun install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

| Variable | Descripción | Valor Local Recomendado |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Endpoint base de la API Guilliman | `http://guilliman.localhost:1355/api/v1` |

### 3. Ejecutar en desarrollo
```bash
bun run dev
```
La aplicación estará disponible en `http://financiapp.localhost:1355`.

### 4. Calidad y Pruebas
```bash
# Ejecutar suite de pruebas unitarias
bun run test

# Verificar tipos y compilar para producción
bun run build
```

---

## 🐳 Ejecución con Docker

```bash
# Desde la raíz del repositorio
docker compose up -d financiapp
```
