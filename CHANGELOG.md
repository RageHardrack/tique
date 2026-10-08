# Changelog - Tique (Frontend SPA)

Todos los cambios notables en este proyecto serán documentados en este archivo siguiendo [Conventional Commits](https://www.conventionalcommits.org/).

## [v0.5.0] - 2026-10-08

### Características
- **budgets**: el mes en curso pasa a ser reactivo, de modo que los presupuestos siguen el cambio de mes sin recargar la aplicación (`feat(budgets)`).

### Correcciones
- **budgets**: el gasto por categoría y las alertas de sobregasto se acotan al mes del movimiento, en lugar de sumar el historial completo (`fix(budgets)`).

---

## [v0.2.0] - 2026-09-17

### Características
- **analytics**: contenedor acotado para distribución de gastos, agrupación Top 5 + Otras y hoja modal responsiva (`feat(analytics)`).
- **transactions**: soporte de filtro y búsqueda para movimientos generales o sin categoría (`feat(transactions)`).
- **goals**: clasificación de prioridad, badges y ordenamiento en metas de ahorro (`feat(goals)`).
- **transactions**: soporte de tasas de cambio a nivel de movimiento y vista previa en vivo en USD para VES (`feat(transactions)`).

### Correcciones
- **reports**: uso de tasa de cambio propia de la transacción en reportes, métricas y exportaciones (`fix(reports)`).
- **date-formatter**: uso de fecha fija en tests para prevenir colisiones de UTC con fecha actual (`test(date-formatter)`).

---

## [v0.1.0] - 2026-08-28

### Características
- Gestión patrimonial y finanzas personales con Vue 3, Nuxt UI y Tailwind CSS.
- Tablero de control financiero: Flujo de caja neto, regla 50/30/20 y calendario de vencimientos.
- Importador inteligente de extractos bancarios en CSV.
- PWA instalable con soporte offline y diseño Mobile-First.
