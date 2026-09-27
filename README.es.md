# Slash Highlight — Plugin de Obsidian

![Slash Highlight](assets/banner.jpg)

> **English:** [Read in English](README.md)

Resalta visualmente palabras en tus notas mediante dos mecanismos: **símbolos disparadores** (como `/` o `@`) y **palabras clave**. Todo configurable desde el panel de ajustes de Obsidian, sin tocar código.

![Obsidian](https://img.shields.io/badge/Obsidian-1.0%2B-7c3aed?logo=obsidian&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ¿Qué hace?

### 🔣 Símbolos disparadores
La palabra que siga a un símbolo configurado recibe un **color de fondo** y **color de texto** propios.

```
Ejecuta /comando en la terminal
Menciona a @usuario en el hilo
```

> Solo se activa cuando el símbolo está precedido por un espacio o inicio de línea, por lo que las URLs (`https://ejemplo.com`) y los emails (`user@dominio.com`) **no se colorean**.

### 🔤 Palabras clave
Palabras concretas que se colorean en cualquier parte del texto con un **color de texto** personalizado, independientemente de las mayúsculas.

```
Hoy usé claude para escribir esta nota en obsidian.
```

Ambas funciones son compatibles y funcionan tanto en **Live Preview** como en **Reading View**.

---

## Instalación

> Obsidian 1.0 o superior. No requiere dependencias externas.

**1. Activa los plugins de comunidad**

`Ajustes → Plugins de comunidad → Desactivar modo seguro`

**2. Copia la carpeta del plugin en tu vault**

```
TuVault/
└── .obsidian/
    └── plugins/
        └── slash-highlight/
            ├── main.js
            └── manifest.json
```

> Si no ves la carpeta `.obsidian`, activa los archivos ocultos:
> - **Mac:** `Cmd + Shift + .`
> - **Windows:** `Ver → Mostrar archivos ocultos`

**3. Actívalo en Obsidian**

`Ajustes → Plugins de comunidad → Slash Highlight → activa el interruptor`

---

## Configuración

Accede al panel en `Ajustes → Slash Highlight`.

### Sección: Símbolos disparadores

Cada símbolo tiene tres controles:

| Campo | Descripción |
|---|---|
| **Símbolo** | El carácter disparador (un solo carácter: `/`, `@`, `#`, `!`…) |
| **Color de fondo** | Color del fondo de la palabra resaltada |
| **Color de texto** | Color del texto encima del fondo |

Por defecto incluye:
- `/` → fondo magenta, texto blanco
- `@` → fondo naranja, texto blanco

### Sección: Palabras clave

Cada entrada tiene dos controles:

| Campo | Descripción |
|---|---|
| **Palabra** | El texto a detectar (sin distinguir mayúsculas) |
| **Color** | Color del texto |

Por defecto incluye: `claude`, `obsidian`, `nota`.

**Los cambios se aplican al instante**, sin necesidad de reiniciar.

---

## Ejemplos de uso

```markdown
## Reunión del lunes

Hablar con @juan sobre el proyecto /alpha.
Revisar la nota de claude sobre la arquitectura.
Subir los cambios a /produccion antes del viernes.
```

- `@juan` → fondo naranja
- `/alpha` y `/produccion` → fondo magenta
- `claude` → texto violeta
- `nota` → texto naranja

---

## Actualizar

Reemplaza el archivo `main.js` dentro de `.obsidian/plugins/slash-highlight/` con la nueva versión y pulsa **Recargar plugins** en el panel de plugins de comunidad. Tu configuración se conserva.

---

## Licencia

MIT — libre para usar, modificar y distribuir.
