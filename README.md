# Slash Highlight — Obsidian Plugin

![Slash Highlight](assets/banner.jpg)

> **Español:** [Leer en español](README.es.md)

Visually highlight words in your notes with two mechanisms: **trigger symbols** (such as `/` or `@`) and **keywords**. Everything is configurable from Obsidian’s settings panel—no code required.

![Obsidian](https://img.shields.io/badge/Obsidian-1.0%2B-7c3aed?logo=obsidian&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What it does

### 🔣 Trigger symbols
The word that follows a configured symbol gets its own **background** and **text** colors.

```
Run /command in the terminal
Mention @user in the thread
```

> Only activates when the symbol is preceded by a space or the start of a line, so URLs (`https://example.com`) and emails (`user@domain.com`) are **not** colored.

### 🔤 Keywords
Specific words colored anywhere in the text with a custom **text color**, case-insensitive.

```
Today I used claude to write this note in obsidian.
```

Both features work together in **Live Preview** and **Reading View**.

---

## Installation

> Obsidian 1.0 or later. No external dependencies.

**1. Enable community plugins**

`Settings → Community plugins → Turn off restricted mode`

**2. Copy the plugin folder into your vault**

```
YourVault/
└── .obsidian/
    └── plugins/
        └── slash-highlight/
            ├── main.js
            └── manifest.json
```

> If you don’t see the `.obsidian` folder, show hidden files:
> - **Mac:** `Cmd + Shift + .`
> - **Windows:** `View → Show hidden files`

**3. Enable it in Obsidian**

`Settings → Community plugins → Slash Highlight → toggle on`

---

## Configuration

Open the panel at `Settings → Slash Highlight`.

### Section: Trigger symbols

Each symbol has three controls:

| Field | Description |
|---|---|
| **Symbol** | The trigger character (single character: `/`, `@`, `#`, `!`, …) |
| **Background color** | Background color of the highlighted word |
| **Text color** | Text color on top of the background |

Defaults:
- `/` → magenta background, white text
- `@` → orange background, white text

### Section: Keywords

Each entry has two controls:

| Field | Description |
|---|---|
| **Word** | Text to match (case-insensitive) |
| **Color** | Text color |

Defaults: `claude`, `obsidian`, `nota`.

**Changes apply instantly**—no restart needed.

---

## Usage examples

```markdown
## Monday meeting

Talk to @juan about the /alpha project.
Review claude’s note on the architecture.
Push changes to /production before Friday.
```

- `@juan` → orange background
- `/alpha` and `/production` → magenta background
- `claude` → violet text
- `nota` → orange text

---

## Updating

Replace `main.js` inside `.obsidian/plugins/slash-highlight/` with the new version and click **Reload plugins** in the community plugins panel. Your settings are preserved.

---

## License

MIT — free to use, modify, and distribute.
