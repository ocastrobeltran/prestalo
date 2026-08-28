# Lista de Tareas: Transformación Móvil, Multi-Tenant, Sistema de Diseño & SaaS

## Fase 1: Sistema de Diseño Único & Rediseño UI/UX ("Aurora Mint & Obsidian")

- [x] **Tarea 1.1: Tokens de Diseño y Variables Globales**
  - **Descripción:** Definir la nueva paleta de colores exclusiva (`--primary` `#00F29D`, `--bg-app` `#070A12`, `--bg-card` `#111828`, `--bg-elevated` `#1A243C`), tipografía tabular para finanzas, gradientes de borde y variables de safe-area móvil en `src/index.css`.
  - **Criterios de aceptación:**
    - Paleta consistente en modo claro y modo oscuro.
    - Eliminación de colores genéricos de plantilla.
  - **Archivos:** `src/index.css`

- [x] **Tarea 1.2: Rediseño de Navegación Móvil (Floating Dock / Bottom Nav)**
  - **Descripción:** Crear una barra de navegación inferior moderna tipo cápsula flotante ergonómica con efecto frosted glass (`src/components/layout/BottomNav.tsx`) e indicadores activos de luz.
  - **Criterios de aceptación:**
    - Totalmente accesible con el pulgar en pantallas de teléfono.
    - Soporte visual para Safe Area Insets (barras de navegación gestuales de Android/iOS).
  - **Archivos:** `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`

- [x] **Tarea 1.3: Rediseño de Tarjetas y Vistas Principales (Home, Préstamos, Clientes, Calendario)**
  - **Descripción:** Modernizar `Home.tsx` con las nuevas tarjetas *Titanium Slate*, métricas de alto contraste y pantalla de Login/Registro generativa.
  - **Criterios de aceptación:**
    - Jerarquía visual nítida y moderna que no se parece a ninguna otra app genérica.
  - **Archivos:** `src/pages/Home.tsx`, `src/components/auth/Login.tsx`

---

## Checkpoint 1: Identidad Visual y UI/UX Validada
- [x] Aplicación visualmente distintiva, pulida y 100% responsiva en celular.
- [x] `npm run build` sin errores de compilación.

---

## Fase 2: Multi-Tenancy & Aislamiento Estricto en Supabase

- [x] **Tarea 2.1: Esquema SQL Multi-Inquilino y RLS**
  - **Descripción:** Crear script de migración SQL `supabase_multitenant_migration.sql` que añade la columna `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` a todas las tablas. Crear trigger `on_auth_user_created` para inicializar automáticamente la `capital_box` y la suscripción de prueba para cada usuario nuevo.
  - **Criterios de aceptación:**
    - Políticas RLS creadas con `auth.uid() = user_id` para SELECT, INSERT, UPDATE, DELETE en todas las tablas.
    - Clave primaria de `capital_box` asociada a `user_id`.
  - **Archivos:** `supabase_multitenant_migration.sql`

- [x] **Tarea 2.2: Actualización de Servicios y Mappers TS**
  - **Descripción:** Modificar `src/types/index.ts`, `src/services/supabaseSyncService.ts` y `src/services/storageService.ts` para asociar todas las operaciones con el `user_id` de la sesión actual de Supabase Auth.
  - **Criterios de aceptación:**
    - Los registros guardados llevan el `user_id` del usuario autenticado.
    - Sincronización bidireccional descarga únicamente los datos del usuario logueado.
    - Limpieza total de `localStorage` al cerrar sesión (`logout`) para evitar fuga entre cuentas.
  - **Archivos:** `src/types/index.ts`, `src/services/supabaseSyncService.ts`, `src/services/storageService.ts`

---

## Checkpoint 2: Aislamiento de Datos Validado
- [x] Código adaptado para aislar datos locales por `user_id` y RLS en backend.

---

## Fase 3: Modelo de Membresías, Freemium & Paywall

- [x] **Tarea 3.1: Modelo de Suscripciones y Hook `useSubscription`**
  - **Descripción:** Crear contexto `src/contexts/SubscriptionContext.tsx` con helpers `isPro`, `isTrialActive`, `daysRemainingInTrial`, `canCreateClient()`, `canCreateLoan()`.
  - **Criterios de aceptación:**
    - 30 días de prueba VIP ilimitada (`trialing`) para nuevos registros.
  - **Archivos:** `src/contexts/SubscriptionContext.tsx`, `src/types/index.ts`

- [x] **Tarea 3.2: Modal de Planes y Beneficios Pro (`PaywallModal.tsx`)**
  - **Descripción:** Diseñar una interfaz atractiva y persuasiva con el nuevo sistema de diseño para la oferta Pro: tabla comparativa, beneficios clave, contador de días de prueba y botón de suscripción.
  - **Criterios de aceptación:**
    - Modal accesible desde el header y activado automáticamente al alcanzar límites del plan gratuito.
  - **Archivos:** `src/components/subscription/PaywallModal.tsx`

---

## Fase 4: Términos Legales, Privacidad y Cumplimiento de Tiendas

- [x] **Tarea 4.1: Páginas de Términos y Condiciones y Política de Privacidad**
  - **Descripción:** Crear vistas `/terms` y `/privacy` con cláusulas específicas para Google Play y App Store (aclarando que Prestalo es una herramienta de software contable/gestión, exención de intermediación financiera, derechos ARCO/Habeas Data).
  - **Criterios de aceptación:**
    - Vistas públicas accesibles dentro de la app o enlace web.
  - **Archivos:** `src/pages/TermsAndConditions.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/App.tsx`

- [x] **Tarea 4.2: Requisito de Eliminación de Cuenta ("Delete Account")**
  - **Descripción:** Implementar modal "Eliminar mi cuenta y todos mis datos", ejecutando borrado en cascada en Supabase y cierre de sesión. Requisito obligatorio para aprobación en Google Play y App Store.
  - **Criterios de aceptación:**
    - Confirmación de seguridad en dos pasos y borrado definitivo.
  - **Archivos:** `src/components/auth/DeleteAccountModal.tsx`

---

## Fase 5: Integración Móvil Nativa con Capacitor

- [x] **Tarea 5.1: Instalación y Configuración de Capacitor**
  - **Descripción:** Instalar `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/keyboard`. Configurar `capacitor.config.ts` con ID `com.prestalo.app`.
  - **Criterios de aceptación:**
    - Ejecutar `npx cap init` y `npx cap add android`.
    - Generación exitosa de la carpeta `/android`.
  - **Archivos:** `capacitor.config.ts`, `package.json`

- [x] **Tarea 5.2: Optimización Móvil y Sincronización**
  - **Descripción:** Adaptar CSS, scripts npm (`cap:sync`, `cap:open`, `cap:build`) y sincronizar build con Android Studio.
  - **Archivos:** `src/index.css`, `package.json`, `android/`

---

## Checkpoint Final: Build Nativo & Lanzamiento
- [x] `npm run build` y `npx cap sync android` ejecutados con éxito.
- [x] Proyecto de Android Studio listo para abrir y generar APK/AAB firmado.
