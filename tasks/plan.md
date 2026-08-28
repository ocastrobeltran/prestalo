# Plan Maestro: Transformación a App Móvil (Google Play / App Store), Multi-Inquilino, Sistema de Diseño Único & SaaS

## 1. Visión General del Proyecto
Transformar **Prestalo** de una aplicación web/PWA a una **aplicación móvil nativa** lista para su publicación en **Google Play Store** (y posteriormente en **Apple App Store**), implementando:
1. Un **Sistema de Diseño Único y Exclusivo ("Aurora Mint & Obsidian Titanium")** que rompa con la estética genérica de plantillas y aplicaciones clonadas.
2. Una arquitectura **Multi-Tenant** con aislamiento estricto de datos por usuario en Supabase (RLS).
3. Un modelo de negocio **SaaS Freemium** con gestión de membresías, periodo de prueba VIP y paywall.
4. Autenticación biométrica, endurecimiento de seguridad y páginas legales requeridas por las tiendas de aplicaciones.

---

## 2. Decisiones de Arquitectura y Estrategia

### A. Sistema de Diseño Único ("Aurora Mint & Obsidian Titanium")
Para evitar parecer una copia o plantilla genérica de IA (evitando degradados violetas y tarjetas genéricas):
- **Paleta de Identidad Exclusiva**:
  - **Firma Primaria (Aurora Mint)**: `#00F29D` (Dark Mode) y `#059669` (Light Mode). Color de crecimiento financiero, alta energía y modernidad.
  - **Superficies Titanium Slate (Dark Mode)**: Lienzo `#090D16`, Tarjetas `#121827`, Capas elevadas `#1A2338` con bordes sutiles de precisión geométrica (`border: 1px solid rgba(255,255,255,0.07)`).
  - **Semáforo Financiero de Alto Contraste**:
    - *Al día / Cobrado*: Mint Aurora (`#00F29D`)
    - *Pactado / Acuerdo parcial*: Solar Amber (`#F59E0B`)
    - *Vencido / En Mora*: Crimson Pulse (`#FF385C`)
- **Tipografía y Legibilidad Financiera**:
  - Números financieros en fuentes modernas tabulares (`Outfit` / `Plus Jakarta Sans`) para que los números siempre alineen perfectamente al centavo.
- **Ergonomía Táctil Mobile-First**:
  - Barra de navegación inferior flotante tipo cápsula con respuesta táctil y botón central de acción rápida ("+ Nuevo Préstamo / Cobrar").
  - Modales tipo *Bottom Sheet* nativos que se despliegan desde la parte inferior de la pantalla.
  - Teclado y selectores de montos con botones de acceso rápido ($20k, $50k, $100k, Saldo Completo).

### B. Plataforma Móvil: Capacitor 6+ (React 19 + TypeScript + Vite)
- Empaquetado nativo a proyectos reales de **Android Studio (`/android`)** y **Xcode (`/ios`)**.
- Soporte nativo para Safe-Area Insets (muesca, barra de gestos), respuesta háptica (`@capacitor/haptics`), protección de pantalla (`@capacitor-community/privacy-screen`) y compartir comprobantes por WhatsApp sin dependencias web frágiles.

### C. Multi-Tenancy y Aislamiento Estricto de Datos (Supabase RLS)
- Columna `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` en todas las tablas (`clients`, `loans`, `installments`, `transactions`, `capital_box`, `user_subscriptions`).
- Políticas RLS donde `auth.uid() = user_id` para todas las operaciones (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- Trigger automático de bienvenida (`handle_new_user`) que crea la caja de capital personal y activa 30-45 días de prueba VIP.
- Purgado de almacenamiento local y caché al cerrar sesión.

### D. Estrategia de Monetización SaaS Freemium
- **Fase 1: Prueba VIP Gratuita (30 a 45 días)** para captación masiva y retención inicial.
- **Fase 2: Freemium Permanente**:
  - *Plan Starter (Gratis)*: Hasta 8 clientes activos y 10 préstamos.
  - *Plan Pro (Suscripción)*: Clientes y préstamos ilimitados, WhatsApp automático, reportes PDF/Excel profesionales con logo, backup en tiempo real.
- Componente `PaywallModal` / `SubscriptionView` con diseño visual persuasivo.

### E. Seguridad y Cumplimiento Legal (Google Play & App Store)
- **Aclaración Financiera Expresa**: Cláusula legal que define a Prestalo como software contable/gestión y no como prestamista o intermediario financiero.
- **Rutas Web Públicas**: `/terms` (Términos de Servicio) y `/privacy` (Política de Privacidad).
- **Eliminación de Cuenta ("Delete Account")**: Botón y modal con confirmación de dos pasos para borrado definitivo de cuenta y datos en cascada.

---

## 3. Hoja de Ruta de Implementación por Fases

### Fase 1: Sistema de Diseño Único, Identidad Visual & Rediseño UI/UX
- [ ] Definir tokens de diseño en CSS y Tailwind/Variables (`src/index.css`, `colors`, `shadows`, `borders`).
- [ ] Diseñar nueva barra de navegación móvil (Floating Bottom Dock con botón de acción rápida).
- [ ] Rediseñar tarjetas de préstamos, clientes y resumen de caja con el estilo *Obsidian & Mint Aurora*.
- [ ] Implementar componentes de feedback móvil (micro-interacciones, badges de estado, bottom sheets).

### Fase 2: Multi-Tenancy y Aislamiento de Datos en Supabase
- [ ] Aplicar script SQL multi-usuario (`supabase_multitenant_migration.sql`) en Supabase.
- [ ] Actualizar mappers en `supabaseSyncService.ts` y aislamiento de almacenamiento local en `storageService.ts`.
- [ ] Validar que dos cuentas independientes no compartan información bajo ninguna circunstancia.

### Fase 3: Módulo de Suscripciones, Límites Freemium y Paywall
- [ ] Crear contexto/hook `useSubscription` para control de características Pro y periodo de prueba.
- [ ] Diseñar modal y pantalla de planes y beneficios Pro (`PaywallModal.tsx`).
- [ ] Conectar bloqueos suaves en creación de clientes/préstamos al superar el plan gratuito.

### Fase 4: Términos Legales, Privacidad y Eliminación de Cuenta
- [ ] Crear componentes y rutas para Términos de Servicio (`/terms`) y Política de Privacidad (`/privacy`).
- [ ] Implementar modal de configuración con botón "Eliminar Cuenta y Datos" (Cumplimiento Google Play).

### Fase 5: Integración Nativa con Capacitor para Android
- [ ] Instalar y configurar `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/haptics`.
- [ ] Configurar `capacitor.config.ts` (App ID `com.prestalo.app`, App Name, Splash Screen).
- [ ] Generar carpeta `/android` y verificar sincronización.

---

## 4. Matriz de Riesgos y Mitigaciones

| Riesgo | Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| **Diseño genérico o saturado** | Medio | Seguir el sistema de diseño *Aurora Mint & Obsidian Slate*, con foco en legibilidad numérica y ergonomía táctil con el pulgar. |
| **Rechazo en Google Play por categoría financiera** | Alto | Etiquetar la app estrictamente como "Herramienta de Gestión Contable / Productividad", con disclaimers legales claros. |
| **Fuga de datos entre usuarios en el mismo teléfono** | Crítico | Vaciar el almacenamiento local en `signOut()` y RLS en backend con `auth.uid() = user_id`. |
