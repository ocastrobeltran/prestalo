# Task List: Cuota Pactada Parcial y Auditoría Financiera

## Phase 1: Data Model & Business Logic

### Task 1: Actualizar tipos e interfaces
**Description:** Agregar los campos opcionales `isPactada?: boolean` y `waivedAmount?: number` a la interfaz `Installment`.
**Acceptance criteria:**
- [x] `Installment` soporta de manera segura campos opcionales de pacto.
**Verification:** `npx tsc --noEmit` pasa sin errores.
**Dependencies:** None
**Files likely touched:** `src/types/index.ts`
**Estimated scope:** Small

### Task 2: Lógica de Abono Pactado en almacenamiento y cálculos
**Description:** Modificar `payInstallment` en `storageService.ts` para soportar `isPactada`. Cuando sea verdadero, salda la cuota a 0, la marca como 'paid', registra los importes cobrados exactos y calcula el valor condonado.
**Acceptance criteria:**
- [x] Si `isPactada` es verdadero, `amount` pasa a 0 y `status` a 'paid'.
- [x] `calculateFinancialSummary` excluye las cuotas pactadas de la lista de mora/vencidos.
- [x] La caja de capital refleja el efectivo cobrado real.
**Verification:** `npx tsc --noEmit` pasa sin errores.
**Dependencies:** Task 1
**Files likely touched:** `src/services/storageService.ts`, `src/services/loanCalculator.ts`
**Estimated scope:** Medium

### Task 3: Actualizar Sincronización Supabase
**Description:** Actualizar mappers `toDbInstallment` y `fromDbInstallment` en `supabaseSyncService.ts` y documentar cambios en `supabase_schema.sql`.
**Acceptance criteria:**
- [x] Los campos de cuota pactada y desglose pagado se mapean correctamente entre IndexedDB/LocalStorage y Supabase.
**Verification:** `npx tsc --noEmit` pasa sin errores.
**Dependencies:** Task 1, Task 2
**Files likely touched:** `src/services/supabaseSyncService.ts`, `supabase_schema.sql`
**Estimated scope:** Small

---

## Checkpoint 1: Business Logic & Model Verification
- [x] Compilación TypeScript limpia (`npx tsc --noEmit`)
- [x] Modelos de datos listos para consumo UI

---

## Phase 2: UI Components & Screen Audit

### Task 4: Control de Pago Pactado en Modal de Pagos
**Description:** Añadir la opción/checkbox `☑ Pactar cuota como cumplida` en `PaymentModal.tsx` cuando se ingrese un monto menor al sugerido. Conectar con `App.tsx`.
**Acceptance criteria:**
- [x] Al escribir un monto menor, la casilla es visible e interactiva.
- [x] Al confirmar el pago con la casilla activa, el handler ejecuta el pago pactado.
**Verification:** Probar en UI y validar que el pago pactado se registra.
**Dependencies:** Task 2
**Files likely touched:** `src/components/loans/PaymentModal.tsx`, `src/App.tsx`
**Estimated scope:** Medium

### Task 5: Actualizar vistas de Préstamos y Calendario
**Description:** Mostrar la insignia `Pagada (Pactada)` o `Pactada` en `Loans.tsx` y `Calendar.tsx`.
**Acceptance criteria:**
- [x] Las cuotas pactadas se muestran con su estado distintivo sin disparar alertas de mora en Calendario ni Préstamos.
**Verification:** Visualización en UI en ambas pantallas.
**Dependencies:** Task 4
**Files likely touched:** `src/pages/Loans.tsx`, `src/pages/Calendar.tsx`
**Estimated scope:** Medium

### Task 6: Auditoría y Corrección de Coherencia Financiera en Reportes y Comprobantes
**Description:** Actualizar `Reports.tsx` para usar `getPaidBreakdownForInstallment()` e incluir `PAGADA (PACTADA)` en `LoanReceiptModal.tsx`.
**Acceptance criteria:**
- [x] Los totales cobrados en `Reports.tsx` coinciden 100% con `Home.tsx`.
- [x] El comprobante en PDF/WhatsApp refleja adecuadamente la cuota pactada.
**Verification:** `npm run build` pasa sin errores y prueba visual.
**Dependencies:** Task 4, Task 5
**Files likely touched:** `src/pages/Reports.tsx`, `src/components/loans/LoanReceiptModal.tsx`
**Estimated scope:** Medium

---

## Checkpoint 2: Final Verification
- [x] All TypeScript types compile (`npx tsc --noEmit`)
- [x] `npm run build` succeeds
- [x] Verification of flow end-to-end
