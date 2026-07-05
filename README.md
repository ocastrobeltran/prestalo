# Préstalo 💸 — Sistema Móvil-Primero de Gestión de Cobros y Préstamos

**Préstalo** es una Aplicación Web Progresiva (PWA) de alto rendimiento diseñada específicamente para dispositivos móviles, orientada a prestamistas y cobradores que gestionan operaciones de crédito diario ("gota a gota", cobros semanales, quincenales o mensuales) en la calle.

La aplicación combina la velocidad y confiabilidad de una experiencia **Offline-First** (funciona al 100% sin conexión a internet en zonas rurales o de señal inestable) con el respaldo y sincronización en la nube en tiempo real a través de **Supabase**.

---

## 🚀 Características Principales

### 1. Panel de Control Financiero (Dashboard)
* **Métricas en tiempo real**: Capital inicial configurado, capital disponible en caja para prestar, saldo total "en la calle" (prestado), capital recuperado e intereses totales cobrados.
* **Caja de Capital**: Monitoreo dinámico del balance general de la operación.
* **Accesos Rápidos**: Botones para el registro rápido de nuevos clientes y préstamos.

### 2. Directorio Completo de Clientes (CRUD)
* Búsqueda instantánea de clientes por nombre, teléfono o documento de identidad.
* Ficha de detalle de cada cliente con su información de contacto, dirección e historial completo de créditos solicitados (activos, finalizados o vencidos).

### 3. Generador de Préstamos Inteligente
* **Calculadora previa en tiempo real**: Ingresa el monto a prestar y la tasa de interés (%) para visualizar al instante la cuota calculada y el total final a cobrar.
* **Frecuencias de Pago Soportadas**: Cobros diarios, semanales, quincenales y mensuales.
* **Salto de Domingos**: La calculadora genera la amortización saltando automáticamente los domingos para cobros diarios, adaptándose a las jornadas operativas reales del cobrador.
* **Historial de transacciones**: Generación automática del egreso en caja por el desembolso del crédito.

### 4. Calendario y Agenda de Cobro Rápido
* Grilla de cobro interactiva con marcas visuales de alerta en los días que tienen cobros agendados.
* **Cobro con 1 Clic**: Registra abonos y pagos de cuotas al instante desde la lista diaria.
* **Comprobantes de Pago para WhatsApp**: Generación instantánea de recibos con formato profesional y botón rápido para compartirlos directamente por WhatsApp al cliente.

### 5. Reportes e Inteligencia de Negocio
* **Métricas de Rendimiento**: Reportes agrupados por períodos (Día de hoy, Semana actual, Mes en curso).
* **Ranking de Clientes**: Identificación de mejores pagadores.
* **Historial de Transacciones**: Auditoría completa de ingresos por cuotas y egresos por préstamos.
* Cierres de caja optimizados para impresión física o guardado en formato PDF.

### 6. Sincronización en la Nube y Login Real
* **Seguridad con Supabase Auth**: Pantalla de Login premium con estética *glassmorphic*, protección de todas las rutas y control de sesiones activas.
* **Sincronización Bidireccional en Segundo Plano**: Todas las lecturas y escrituras se ejecutan en local de forma inmediata (0ms de latencia) y se sincronizan a la nube asíncronamente tan pronto hay conexión.
* **Inicialización Automática (Auto-Seeding)**: Al conectar una base de datos nueva en Supabase, el sistema migra automáticamente los datos locales para inicializar el servidor.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React.js (TypeScript) + Vite
* **Estilos**: Vanilla CSS con variables personalizadas y soporte premium para **Modo Oscuro** (Theme Toggle).
* **Iconografía**: Lucide React.
* **Base de Datos y Nube**: Supabase (PostgreSQL relacional) con soporte de políticas de seguridad **Row Level Security (RLS)**.

---

## 📦 Estructura del Código

```bash
├── public/                     # Iconos estándar para PWA y metadatos
├── src/
│   ├── components/
│   │   ├── auth/               # Componente de Login de Supabase Auth
│   │   ├── clients/            # Modales y formularios de clientes
│   │   ├── common/             # Badges, barra de progreso y modales reutilizables
│   │   ├── layout/             # Barra inferior (BottomNav) y superior (Header)
│   │   └── loans/              # Simulador, recibos y modales de préstamo
│   ├── pages/                  # Secciones de la app (Dashboard, Clientes, Préstamos, Calendario, Reportes)
│   ├── services/
│   │   ├── loanCalculator.ts   # Motor matemático para generación de cuotas
│   │   ├── storageService.ts   # Persistencia local con localStorage
│   │   ├── supabaseClient.ts   # Inicializador del cliente de Supabase
│   │   └── supabaseSyncService.ts # Motor de sincronización Offline-First
│   ├── types/
│   │   └── index.ts            # Definiciones de tipo e interfaces TS
│   ├── App.tsx                 # Orquestador del estado de sesión y rutas
│   └── main.tsx
├── .env.example                # Plantilla de variables de entorno
├── supabase_schema.sql         # Script SQL para el esquema inicial de base de datos
├── supabase_auth_policies.sql  # Script SQL para activar políticas RLS de seguridad
└── README.md
```

---

## 🚀 Guía de Configuración y Despliegue

### 1. Requisitos Previos
* Tener instalado **Node.js** (versión 18 o superior).
* Una cuenta activa y un proyecto creado en **Supabase**.

### 2. Instalación de Dependencias
Ejecuta el siguiente comando en el directorio del proyecto para descargar todas las dependencias requeridas:
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto y añade tus credenciales del panel de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 4. Configuración del Servidor (Base de Datos)
Para crear las tablas y las políticas de seguridad en la nube:
1. Ve al panel de control de tu proyecto en Supabase.
2. Abre la sección de **SQL Editor**.
3. Copia el contenido del archivo `supabase_schema.sql` y ejecútalo para crear las tablas e índices.
4. Copia el contenido del archivo `supabase_auth_policies.sql` y ejecútalo para blindar la seguridad de las tablas con autenticación obligatoria.
5. Ve a **Authentication** -> **Users** en Supabase para registrar los correos y contraseñas de las personas autorizadas para ingresar a la app.

### 5. Ejecución del Servidor Local
Para levantar el servidor de desarrollo en tu computadora:
```bash
npm run dev
```

### 6. Compilación de Producción PWA
Para compilar la aplicación optimizada para producción:
```bash
npm run build
```

---

## 📱 Siguientes Pasos: Despliegue en Android / iOS

La aplicación está completamente optimizada para ser empaquetada como aplicación nativa para tiendas (Google Play Store y Apple App Store) utilizando **Capacitor**:

1. **Instalar Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   ```
2. **Inicializar el proyecto**:
   ```bash
   npx cap init Prestalo com.prestalo.app --web-dir=dist
   ```
3. **Añadir Plataformas Nativas**:
   ```bash
   npm install @capacitor/android @capacitor/ios
   # Añadir soporte para Android
   npx cap add android
   # Añadir soporte para iOS
   npx cap add ios
   ```
4. **Sincronizar y Compilar**:
   Cada vez que compiles el frontend (`npm run build`), sincroniza los archivos con las apps nativas:
   ```bash
   npm run build && npx cap sync
   ```
5. **Abrir en Android Studio / Xcode**:
   ```bash
   npx cap open android
   npx cap open ios
   ```
   Desde el IDE oficial de cada plataforma podrás generar y firmar el instalador `.apk` o subirlo a App Store Connect.
