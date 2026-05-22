/*
 * Slash Highlight Plugin for Obsidian
 * - Configurable trigger symbols (/, @, etc.) with their own background color
 * - Configurable keywords with their own text color
 */

const { Plugin, PluginSettingTab, Setting } = require('obsidian');
const { ViewPlugin, Decoration } = require('@codemirror/view');
const { RangeSetBuilder } = require('@codemirror/state');

// ─── Default settings ─────────────────────────────────────────────────────
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
// Lookbehind: symbol must be preceded by a space, line start, or string start
const LOOKBEHIND = '(?<=\\s|^)';

// ─── Build editor decorations ─────────────────────────────────────────────
function buildDecorations(view, settings) {
  const builder = new RangeSetBuilder();
  const { triggers, keywords } = settings;

  // Combined pattern: trigger symbols + keywords
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

      // Is it a trigger symbol?
      const trigger = triggers.find(t => t.symbol && matched.startsWith(t.symbol));
      if (trigger) {
        builder.add(start, end, Decoration.mark({ class: `trigger-${cssClass(trigger.symbol)}` }));
        continue;
      }

      // Is it a keyword?
      const kw = keywords.find(k => k.word.toLowerCase() === matched.toLowerCase());
      if (kw) {
        builder.add(start, end, Decoration.mark({ class: `kw-${cssClass(kw.word)}` }));
      }
    }
  }
  return builder.finish();
}

// ─── Main plugin ──────────────────────────────────────────────────────────
class SlashHighlightPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.styleEl = document.createElement('style');
    this.styleEl.id = 'slash-highlight-styles';
    document.head.appendChild(this.styleEl);
    this.refreshStyles();

    // CodeMirror extension (live editor)
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

    // Post-processor for Reading View
    this.registerMarkdownPostProcessor((el) => this.processReadingView(el));

    // Settings panel
    this.addSettingTab(new SlashHighlightSettingTab(this.app, this));

    console.log('Slash Highlight: loaded ✓');
  }

  onunload() {
    this.styleEl?.remove();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Ensure both keys exist even if saved data is from an older version
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

// ─── Settings panel ───────────────────────────────────────────────────────
class SlashHighlightSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // ── Section: Trigger symbols ──
    containerEl.createEl('h2', { text: 'Slash Highlight — Settings' });
    containerEl.createEl('h3', { text: '🔣 Trigger symbols' });
    containerEl.createEl('p', {
      text: 'The word following these symbols will receive the configured background color.',
      cls: 'setting-item-description'
    });

    const triggers = this.plugin.settings.triggers;

    triggers.forEach((t, i) => {
      const setting = new Setting(containerEl)
        .setName(`Symbol: ${t.symbol || '(empty)'}`)
        .addText(text => text
          .setPlaceholder('symbol (e.g. / @ # !)')
          .setValue(t.symbol)
          .onChange(async val => {
            triggers[i].symbol = val.trim().charAt(0) || '';
            setting.setName(`Symbol: ${triggers[i].symbol || '(empty)'}`);
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
          .setTooltip('Remove')
          .setClass('mod-warning')
          .onClick(async () => {
            triggers.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
          })
        );

      // Labels below the color pickers
      const desc = setting.descEl;
      desc.createSpan({ text: '🎨 background   🖊️ text', cls: 'setting-item-description' });
    });

    new Setting(containerEl)
      .addButton(btn => btn
        .setButtonText('+ Add symbol')
        .setCta()
        .onClick(async () => {
          triggers.push({ symbol: '', bgColor: '#ff00ff', textColor: '#ffffff' });
          await this.plugin.saveSettings();
          this.display();
        })
      );

    // ── Section: Keywords ──
    containerEl.createEl('h3', { text: '🔤 Keywords' });
    containerEl.createEl('p', {
      text: 'These words will be colored anywhere in the text (case-insensitive).',
      cls: 'setting-item-description'
    });

    const keywords = this.plugin.settings.keywords;

    keywords.forEach((kw, i) => {
      new Setting(containerEl)
        .setName(kw.word || '(empty)')
        .addText(text => text
          .setPlaceholder('word')
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
          .setTooltip('Remove')
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
        .setButtonText('+ Add keyword')
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
