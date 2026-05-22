/*
 * Slash Highlight Plugin for Obsidian
 * - Símbolos disparadores configurables (/, @, etc.) con color de fondo propio
 * - Palabras clave configurables con color de texto propio
 */

const { Plugin, PluginSettingTab, Setting } = require('obsidian');
const { ViewPlugin, Decoration } = require('@codemirror/view');
const { RangeSetBuilder } = require('@codemirror/state');

// ─── Ajustes por defecto ───────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  triggers: [
    { symbol: '/',  bgColor: '#ff00ff', textColor: '#ffffff' },
    { symbol: '@',  bgColor: '#f97316', textColor: '#ffffff' },
  ],
  keywords: [
    { word: 'claude',   color: '#a78bfa' },
    { word: 'obsidian', color: '#38bdf8' },
    { word: 'nota',     color: '#fb923c' },
  ]
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cssClass(str) {
  return str.replace(/[^a-zA-Z0-9]/g, c => '_' + c.charCodeAt(0) + '_');
}

const WORD_CHARS = '[\\w\\-\\.áéíóúüñÁÉÍÓÚÜÑ]+';
// Lookbehind: el símbolo debe estar precedido por espacio, inicio de línea o inicio de string
const LOOKBEHIND = '(?<=\\s|^)';

// ─── Construye decoraciones para el editor ────────────────────────────────
function buildDecorations(view, settings) {
  const builder = new RangeSetBuilder();
  const { triggers, keywords } = settings;

  // Patrón combinado: símbolos disparadores + palabras clave
  const triggerParts = triggers
    .filter(t => t.symbol)
    .map(t => `${LOOKBEHIND}${escapeRegex(t.symbol)}${WORD_CHARS}`);

  const kwParts = keywords.length
    ? [`\\b(?:${keywords.map(k => escapeRegex(k.word)).join('|')})\\b`]
    : [];

  const allParts = [...triggerParts, ...kwParts];
  if (!allParts.length) return builder.finish();

  const combinedRegex = new RegExp(`(${allParts.join('|')})`, 'gi');

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    combinedRegex.lastIndex = 0;
    let m;
    while ((m = combinedRegex.exec(text)) !== null) {
      const start = from + m.index;
      const end = start + m[0].length;
      const matched = m[0];

      // ¿Es un símbolo disparador?
      const trigger = triggers.find(t => t.symbol && matched.startsWith(t.symbol));
      if (trigger) {
        builder.add(start, end, Decoration.mark({ class: `trigger-${cssClass(trigger.symbol)}` }));
        continue;
      }

      // ¿Es una palabra clave?
      const kw = keywords.find(k => k.word.toLowerCase() === matched.toLowerCase());
      if (kw) {
        builder.add(start, end, Decoration.mark({ class: `kw-${cssClass(kw.word)}` }));
      }
    }
  }
  return builder.finish();
}

// ─── Plugin principal ──────────────────────────────────────────────────────
class SlashHighlightPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.styleEl = document.createElement('style');
    this.styleEl.id = 'slash-highlight-styles';
    document.head.appendChild(this.styleEl);
    this.refreshStyles();

    // Extensión CodeMirror (editor en vivo)
    const plugin = this;
    const editorExt = ViewPlugin.fromClass(
      class {
        constructor(view) {
          this.decorations = buildDecorations(view, plugin.settings);
        }
        update(update) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = buildDecorations(update.view, plugin.settings);
          }
        }
      },
      { decorations: v => v.decorations }
    );
    this.registerEditorExtension(editorExt);

    // Post-procesador para Reading View
    this.registerMarkdownPostProcessor((el) => this.processReadingView(el));

    // Panel de ajustes
    this.addSettingTab(new SlashHighlightSettingTab(this.app, this));

    console.log('Slash Highlight: cargado ✓');
  }

  onunload() {
    this.styleEl?.remove();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Asegurar que existen ambas claves aunque los datos guardados sean viejos
    if (!this.settings.triggers) this.settings.triggers = DEFAULT_SETTINGS.triggers;
    if (!this.settings.keywords) this.settings.keywords = DEFAULT_SETTINGS.keywords;
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.refreshStyles();
  }

  refreshStyles() {
    const { triggers, keywords } = this.settings;

    const triggerStyles = triggers.map(t => `
      .trigger-${cssClass(t.symbol)} {
        background-color: ${t.bgColor};
        color: ${t.textColor} !important;
        border-radius: 3px;
        padding: 0 2px;
        font-weight: 500;
      }
      .markdown-reading-view .trigger-read-${cssClass(t.symbol)} {
        background-color: ${t.bgColor};
        color: ${t.textColor};
        border-radius: 3px;
        padding: 0 2px;
        font-weight: 500;
      }
    `).join('\n');

    const kwStyles = keywords.map(kw => `
      .kw-${cssClass(kw.word)} {
        color: ${kw.color} !important;
        font-weight: 600;
      }
      .markdown-reading-view .kw-read-${cssClass(kw.word)} {
        color: ${kw.color};
        font-weight: 600;
      }
    `).join('\n');

    this.styleEl.textContent = triggerStyles + '\n' + kwStyles;
  }

  processReadingView(el) {
    const { triggers, keywords } = this.settings;
    if (!triggers.length && !keywords.length) return;

    const triggerParts = triggers
      .filter(t => t.symbol)
      .map(t => `${LOOKBEHIND}${escapeRegex(t.symbol)}${WORD_CHARS}`);

    const kwParts = keywords.length
      ? [`\\b(?:${keywords.map(k => escapeRegex(k.word)).join('|')})\\b`]
      : [];

    const allParts = [...triggerParts, ...kwParts];
    if (!allParts.length) return;

    const splitRegex = new RegExp(`(${allParts.join('|')})`, 'gi');

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    for (const textNode of nodes) {
      const text = textNode.textContent;
      if (!splitRegex.test(text)) continue;

      const frag = document.createDocumentFragment();
      const parts = text.split(splitRegex);

      for (const part of parts) {
        if (!part) continue;

        const trigger = triggers.find(t => t.symbol && part.startsWith(t.symbol));
        if (trigger) {
          const span = document.createElement('span');
          span.className = `trigger-read-${cssClass(trigger.symbol)}`;
          span.textContent = part;
          frag.appendChild(span);
          continue;
        }

        const kw = keywords.find(k => k.word.toLowerCase() === part.toLowerCase());
        if (kw) {
          const span = document.createElement('span');
          span.className = `kw-read-${cssClass(kw.word)}`;
          span.style.color = kw.color;
          span.style.fontWeight = '600';
          span.textContent = part;
          frag.appendChild(span);
          continue;
        }

        frag.appendChild(document.createTextNode(part));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }
}

// ─── Panel de ajustes ─────────────────────────────────────────────────────
class SlashHighlightSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // ── Sección: Símbolos disparadores ──
    containerEl.createEl('h2', { text: 'Slash Highlight — Ajustes' });
    containerEl.createEl('h3', { text: '🔣 Símbolos disparadores' });
    containerEl.createEl('p', {
      text: 'La palabra que siga a estos símbolos recibirá el color de fondo configurado.',
      cls: 'setting-item-description'
    });

    const triggers = this.plugin.settings.triggers;

    triggers.forEach((t, i) => {
      const setting = new Setting(containerEl)
        .setName(`Símbolo: ${t.symbol || '(vacío)'}`)
        .addText(text => text
          .setPlaceholder('símbolo (ej: / @ # !)')
          .setValue(t.symbol)
          .onChange(async val => {
            triggers[i].symbol = val.trim().charAt(0) || '';
            setting.setName(`Símbolo: ${triggers[i].symbol || '(vacío)'}`);
            await this.plugin.saveSettings();
          })
        )
        .addColorPicker(picker => picker
          .setValue(t.bgColor)
          .onChange(async val => {
            triggers[i].bgColor = val;
            await this.plugin.saveSettings();
          })
        )
        .addColorPicker(picker => picker
          .setValue(t.textColor)
          .onChange(async val => {
            triggers[i].textColor = val;
            await this.plugin.saveSettings();
          })
        )
        .addButton(btn => btn
          .setIcon('trash')
          .setTooltip('Eliminar')
          .setClass('mod-warning')
          .onClick(async () => {
            triggers.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
          })
        );

      // Etiquetas bajo los color pickers
      const desc = setting.descEl;
      desc.createSpan({ text: '🎨 fondo   🖊️ texto', cls: 'setting-item-description' });
    });

    new Setting(containerEl)
      .addButton(btn => btn
        .setButtonText('+ Añadir símbolo')
        .setCta()
        .onClick(async () => {
          triggers.push({ symbol: '', bgColor: '#ff00ff', textColor: '#ffffff' });
          await this.plugin.saveSettings();
          this.display();
        })
      );

    // ── Sección: Palabras clave ──
    containerEl.createEl('h3', { text: '🔤 Palabras clave' });
    containerEl.createEl('p', {
      text: 'Estas palabras se colorearán en cualquier parte del texto (sin importar mayúsculas).',
      cls: 'setting-item-description'
    });

    const keywords = this.plugin.settings.keywords;

    keywords.forEach((kw, i) => {
      new Setting(containerEl)
        .setName(kw.word || '(vacía)')
        .addText(text => text
          .setPlaceholder('palabra')
          .setValue(kw.word)
          .onChange(async val => {
            keywords[i].word = val.trim();
            await this.plugin.saveSettings();
          })
        )
        .addColorPicker(picker => picker
          .setValue(kw.color)
          .onChange(async val => {
            keywords[i].color = val;
            await this.plugin.saveSettings();
          })
        )
        .addButton(btn => btn
          .setIcon('trash')
          .setTooltip('Eliminar')
          .setClass('mod-warning')
          .onClick(async () => {
            keywords.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
          })
        );
    });

    new Setting(containerEl)
      .addButton(btn => btn
        .setButtonText('+ Añadir palabra clave')
        .setCta()
        .onClick(async () => {
          keywords.push({ word: '', color: '#f472b6' });
          await this.plugin.saveSettings();
          this.display();
        })
      );
  }
}

module.exports = SlashHighlightPlugin;
