# Implementation Plan: Cuota Pactada Parcial y Auditoría Financiera

## Overview
Implementación de la funcionalidad para pactar cuotas con pagos menores y darlas por cumplidas sin generar alertas de mora, junto con la corrección y auditoría de coherencia financiera en todas las vistas de Prestalo.

## Architecture Decisions
- Extender el modelo `Installment` con campos opcionales `isPactada?: boolean` y `waivedAmount?: number`.
- Integrar la opción de pacto en `PaymentModal.tsx` al ingresar montos inferiores a la cuota.
- Actualizar la lógica de negocio en `storageService.ts` y `loanCalculator.ts` para saldar la cuota a \$0 y registrar los desgloses exactos en la caja.
- Unificar en `Reports.tsx` los cálculos financieros utilizando `getPaidBreakdownForInstallment()` para solucionar la discrepancia identificada en la auditoría.
- Sincronizar el esquema de Supabase y los mappers TS <-> DB para la persistencia offline/online.

## Task List

### Phase 1: Data Model & Business Logic
- [ ] Task 1: Actualizar tipos e interfaces (`src/types/index.ts`)
- [ ] Task 2: Actualizar servicio de cálculo y almacenamiento (`loanCalculator.ts` y `storageService.ts`)
- [ ] Task 3: Actualizar sincronización con Supabase y esquema SQL (`supabaseSyncService.ts` y `supabase_schema.sql`)

### Checkpoint 1: Business Logic Verified
- [ ] Compilación TypeScript limpia
- [ ] Lógica de pago pactado validada en consola/servicios

### Phase 2: UI Components & Screen Audit
- [ ] Task 4: Agregar control de pacto en `PaymentModal.tsx` y conectar en `App.tsx`
- [ ] Task 5: Actualizar vistas de `Loans.tsx` y `Calendar.tsx` con soporte de insignia `Pactada`
- [ ] Task 6: Corregir auditoría de inconsistencias en `Reports.tsx` y `LoanReceiptModal.tsx`

### Checkpoint 2: Verification & Build
- [ ] `npm run build` sin errores
- [ ] Verificación manual de flujo completo y coincidencia financiera entre pantallas
