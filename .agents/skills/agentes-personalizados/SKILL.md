---
name: agentes-personalizados
description: Guía completa y referencia para diseñar, configurar e invocar Agentes Personalizados (Custom Agents) en Antigravity. Explica el formato de archivo Markdown/YAML, rutas de guardado en el proyecto (.agents/agents/), campos de frontmatter, políticas de seguridad y ejecución, y modos de invocación en CLI, IDE y subagentes.
---

# Guía de Agentes Personalizados (Custom Agents) en Antigravity

Los **Agentes Personalizados** (Custom Agents) permiten crear asistentes con roles altamente especializados, configuraciones de herramientas acotadas, modelos dedicados y políticas de ejecución a medida, evitando la saturación del contexto (context window bloat) y eliminando la falta de especialización de los asistentes de propósito general.

---

## 1. Dónde se Guardan (Ubicación de Archivos)

Los agentes se definen en archivos individuales con extensión `.md`. Existen dos niveles de alcance:

### Nivel de Proyecto (Workspace / Recomendado)
* **Ruta:** `.agents/agents/<nombre-agente>.md`
* **Ámbito:** Disponible exclusivamente para este proyecto.
* **Ventaja:** Al confirmarse en el control de versiones (Git), cualquier miembro del equipo que clone el repositorio tiene acceso inmediato al agente sin configuración manual previa.

### Nivel Global (Machine-Local)
* **Ruta:** `~/.gemini/config/agents/<nombre-agente>.md`
* **Ámbito:** Disponible en todos los proyectos y sesiones ejecutadas en la máquina del usuario.

> [!NOTE]
> Esta habilidad está instalada a nivel de proyecto en `.agents/skills/agentes-personalizados/` y enseña a crear agentes específicos para el repositorio en `.agents/agents/`.

---

## 2. Formato del Archivo de Agente

Cada agente personalizado es un único archivo Markdown (`.md`) compuesto por dos partes principales:

1. **Cabecera YAML Frontmatter** (delimitada entre `---`): Define los metadatos, modelo, herramientas permitidas, habilidades asociadas y políticas de ejecución.
2. **Cuerpo Markdown**: Constituye las **Instrucciones Principales** (System Prompt / Core Instructions) que gobernarán el comportamiento, restricciones y flujo de trabajo del agente.

```markdown
---
name: mi-agente
description: Descripción concisa de la función del agente.
model: flash
tools:
  - view_file
  - replace_file_content
skills:
  - skills/mi-habilidad
mainAgent: true
subagent: true
permissionMode: acceptEdits
commandExecutionPolicy: auto
---

# Instrucciones Principales
Eres un agente especializado en...
```

---

## 3. Campos Soportados en el Frontmatter YAML

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Sí | Identificador único del agente (convención: kebab-case, ej. `dependency-modernizer`). |
| `description` | `string` | Sí | Resumen claro del propósito del agente. Crucial para que agentes coordinadores sepan cuándo delegarle tareas y para que se muestre en los menús de la interfaz. |
| `model` | `string` | No | Modelo a emplear para el bucle del agente (ej. `flash`, `pro`, `auto`). |
| `tools` | `array` | No | Lista explícita de herramientas (`tools`) permitidas. Si se especifica, el agente solo tendrá acceso a esas herramientas (Principio de Mínimo Privilegio). |
| `skills` | `array` | No | Lista de habilidades (skills) de dominio precargadas o accesibles para el agente (ej. `skills/package-upgrade-rules`). |
| `mainAgent` | `boolean` | No | Si es `true`, permite que el agente sea seleccionado y ejecutado directamente como la sesión primaria en la interfaz o CLI. Por defecto: `true`. |
| `subagent` | `boolean` | No | Si es `true`, permite que el agente sea invocado dinámicamente como un subagente / herramienta delegada por un agente coordinador. |
| `permissionMode` | `string` | No | Control de permisos para modificaciones (ej. `acceptEdits` para aplicar cambios de archivos sin confirmación interactiva continua, o `bypassPermissions`). |
| `commandExecutionPolicy` | `string` | No | Política de seguridad para comandos. Configurado en `auto`, permite que comandos estándar de compilación, construcción y pruebas se ejecuten de forma autónoma en segundo plano, solicitando aprobación humana únicamente ante operaciones de alto riesgo (ej. borrado de archivos, git push forzado). |

---

## 4. Cómo se Invocan los Agentes

Existen tres mecanismos de invocación principales:

### 1. Vía CLI (Línea de Comandos)
Se utiliza el flag `--agent` al iniciar Antigravity:
```bash
agy --agent <nombre-agente>
```
*Ejemplo:*
```bash
agy --agent dependency-modernizer
```

### 2. Vía Antigravity IDE / Desktop GUI
* En el selector desplegable de agentes (Agent Selector Dropdown) ubicado en la barra de chat / sesión de Antigravity.
* Todos los agentes con `mainAgent: true` definidos en `.agents/agents/` o `~/.gemini/config/agents/` aparecen automáticamente listados con su nombre y descripción.

### 3. Vía Delegación de Subagentes
* Si un agente tiene configurado `subagent: true`, el agente coordinador principal puede invocarlo dinámicamente para delegarle subtareas concretas y recopilar el resultado sin contaminar su propio contexto principal.

---

## 5. Ejemplos de Implementación

### Ejemplo A: Blueprint Básico (`.agents/agents/dependency-modernizer.md`)

```markdown
---
name: dependency-modernizer
description: Ayuda a actualizar dependencias locales y verifica que las pruebas pasen satisfactoriamente.
model: flash
tools:
  - view_file
  - replace_file_content
  - manage_task
  - run_command
---

# Instrucciones Principales
Eres un agente modernizador de dependencias. Tu objetivo es revisar archivos de configuración (package.json, lockfiles), actualizar paquetes de destino, ejecutar suites de pruebas y validar que la compilación sea exitosa.
```

### Ejemplo B: Blueprint Completo con Seguridad, Permisos y Skills Curadas

```markdown
---
name: test-runner-specialist
description: Especialista en ejecución autónoma de pruebas y diagnóstico de fallos en el proyecto.
model: flash
mainAgent: true
subagent: true
permissionMode: acceptEdits
commandExecutionPolicy: auto
tools:
  - view_file
  - replace_file_content
  - run_command
  - manage_task
skills:
  - skills/browser-testing-with-devtools
---

# Instrucciones Principales
Eres un especialista en pruebas y control de calidad.

## Responsabilidades
1. Ejecuta suites de tests unitarios y de integración usando `run_command`.
2. Analiza trazas de error y fallos de aserción.
3. Aplica correcciones quirúrgicas en el código afectado.
4. Vuelve a ejecutar las pruebas hasta asegurar 100% de éxito.

## Restricciones
- No modifiques archivos de configuración de entorno (.env).
- Mantén los cambios acotados exclusivamente a la causa raíz del fallo.
```

---

## 6. Buenas Prácticas al Crear Agentes

1. **Simetría de Ejecución (`mainAgent` y `subagent`):** Habilita ambos en `true` si el agente puede operar tanto como asistente de sesión individual como subagente llamado por un coordinador.
2. **Minimizar Herramientas (`tools`):** Concede únicamente las herramientas estrictamente necesarias para el rol (ej. si es un revisor de código, solo necesita `view_file` y `grep_search`, no `replace_file_content` ni `run_command`).
3. **Sinergia con Skills (`skills`):** No satures las instrucciones del agente con reglas extensas. Enlaza `skills/` específicas para que el agente acceda a flujos detallados de manera progresiva.
4. **Política de Comandos (`commandExecutionPolicy: auto`):** Útil para roles de integración continua, compilación o refactorización donde la ejecución continua de linters y tests es parte del ciclo de trabajo habitual.
