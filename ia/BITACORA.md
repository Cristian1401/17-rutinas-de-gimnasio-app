# Bitácora

## 2026-11-21 — Los ejercicios no son un recurso aparte

- Situación: el plan inicial trataba `ejercicio` como recurso sincronizable independiente, con push y pull propios.
- Corrección del usuario: en la API los ejercicios van dentro del documento `rutina`: `rutina { nombre, ejercicios: [{ nombre, series }] }`.
- Impacto: no existe un endpoint propio de ejercicios en el contrato y un flujo separado habría enviado datos a una ruta inexistente.
- Decisión: sincronizar solo `rutina` y `serie_hecha`. Las tablas locales `ejercicio` y `rutina_ejercicio` siguen siendo un detalle de persistencia offline.
- Ajustes aplicados:
  - Push: `src/api/sync.ts` construye el documento `rutina` con los ejercicios vinculados y hace `PUT /api/rutina/<id>`.
  - Pull: `src/api/syncAplicar.ts` reconstruye ejercicios y vínculos locales desde `ejercicios: [{ nombre, series }]`.
  - No se realizan llamadas a rutas `/api/ejercicio`.
- Verificación: `npm run check` en verde, 78 pruebas y cobertura de lógica del 96,32 %.
- Lección: el contrato de la API manda sobre el modelo relacional local; ante discrepancias, preguntar antes de implementar.
