# Dark Amber Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать тему «Dark Amber» для shikimori.io (этап 1 — фундамент всего сайта, этап 2 — профиль) и подключить её к профилю Bonjourchik через `@import` из публичного GitHub-репозитория.

**Architecture:** Модульные CSS-исходники в `src/` склеиваются Node-скриптом в один `dist/theme.css`. Скрипт проверяет код под санитайзер Shikimori и генерирует служебные правила. Локальный предпросмотр подменяет `<style id="custom_css">` в сохранённых снимках страниц сайта на свежую сборку. В поле «Внешний вид сайта» остаются `@import` и две переменные.

**Tech Stack:** CSS (без препроцессоров), Node.js 24 (встроенные `node:test`, `node:http`, `fetch`), git + gh CLI.

**Spec:** `docs/superpowers/specs/2026-09-24-dark-amber-theme-design.md`.
**Эталон вида:** `design/mockup-profile.html`, `design/mockup-design-system.html` (открывать в браузере).
**Справка по платформе:** `docs/SHIKIMORI.md`.

## Global Constraints

- Все токены темы — с префиксом `--bj-`, классы из BB-кода — с префиксом `bj-`, имена `@keyframes` — `bj-*`.
- В CSS запрещены целые слова (без учёта регистра): `eval cookie window parent this javascript vbscript script behavior behaviour expression`; также `moz-binding`, `@charset`, `<`, `&#`, `@import`, `\` вне `content: "…"`.
- Каждый `url(…)` начинается с `//` или `data:image/(svg+xml|png|jpeg|jpg|gif);base64,`.
- Палитра: bg `#0b0d11`, sf `#14171d`, sf2 `#1b1f27`, sf3 `#252a35`, ln `#232833`, ln2 `#343a47`, tx `#eceef2`, tx2 `#c9ccd4`, mu `#878da0`, ac `#f0a845`, ac-h `#ffbe63`, ac2 `#ff7a3d`, ok `#5fbf77`, warn `#e0655a`.
- Шрифты: Onest — текст; Unbounded — ник, заголовки, цифры. **Никакого `-webkit-text-stroke` на Unbounded** (у вариативного шрифта видны внутренние контуры).
- Анимируются только `transform`, `opacity`, `filter`, `background-position`. `prefers-reduced-motion: reduce` отключает всё. На ≤1023px фоновые циклы выключены.
- Мобильная граница: `max-width: 1023px`, дополнительная — `max-width: 480px`.
- Стили профиля — только под `.p-profiles-show` (класс `body`).
- Сообщения в коде, коммитах и доках — на русском, идентификаторы — латиницей.
- Каждый коммит заканчивается строкой `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ничего не пушить в GitHub и не менять настройки профиля на сайте без явного «да» пользователя в чате.

## File Structure

```
package.json                     скрипты npm (type: module)
config/field.css                 текст для поля «Внешний вид сайта»
src/00-fonts.css                 @font-face Onest + Unbounded
src/01-tokens.css                --bj-* токены и переопределение токенов сайта
src/10-base.css                  html/body, текст, ссылки, скроллбар, выделение
src/20-components/layout.css     .l-page, .l-footer, заголовок страницы, фоновое сияние
src/20-components/menu.css       .l-top_menu-v2, подменю, поиск
src/20-components/blocks.css     .subheadline/.headline, .b-topic, списки
src/20-components/controls.css   кнопки, поля, чекбоксы, «добавить в список»
src/20-components/posters.css    .b-catalog_entry и тултип постера
src/20-components/comments.css   .b-comment, цитаты, код, лоадеры комментариев
src/20-components/misc.css       тултипы, модалки, автокомплит, цветные хелперы
src/30-pages/profile/00-layout.css   сетка и карточки профиля, появление блоков
src/30-pages/profile/about.css       карточки «О себе» (bj-*)
src/30-pages/profile/achievements.css достижения, франшизы, авторы
src/30-pages/profile/banner.css      баннер, блик, бегущий текст
src/30-pages/profile/favourites.css  избранное, друзья, клубы
src/30-pages/profile/head.css        аватар, ник, статус, действия, карточка списков
src/30-pages/profile/history.css     последние тайтлы
src/30-pages/profile/stats.css       полосы списков, время, график активности
src/40-motion.css                @keyframes bj-* и prefers-reduced-motion
src/50-mobile.css                ≤1023px и ≤480px
about/about.bb                   BB-код для «О себе»
tools/build.mjs                  CLI и функция build()
tools/lib/check.mjs              проверка под санитайзер
tools/lib/generate.mjs           генерация служебных правил
tools/lib/inject.mjs             подстановка темы в снимок страницы
tools/snapshot.mjs               скачивание снимков страниц
tools/preview.mjs                локальный сервер предпросмотра
tools/audit.js                   сниппет для браузера: поиск светлых фонов и тёмного текста
tools/*.test.mjs, tools/lib/*.test.mjs  тесты node:test
preview/pages.json               список страниц для снимков
dist/theme.css                   собранная тема (коммитится — её тянет @import)
docs/WORKFLOW.md                 команды проекта
```

Порядок склейки — лексикографический по пути (`00-` → `01-` → `10-` → `20-components/…` → `30-pages/…` → `40-` → `50-`). Благодаря этому `prefers-reduced-motion` и мобильные правила идут последними.

---

### Task 1: Сборщик и проверка под санитайзер

**Files:**
- Create: `package.json`
- Create: `tools/lib/check.mjs`, `tools/lib/check.test.mjs`
- Create: `tools/lib/generate.mjs`, `tools/lib/generate.test.mjs`
- Create: `tools/build.mjs`, `tools/build.test.mjs`

**Interfaces:**
- Produces:
  - `checkCss(source: string, file?: string): string[]` — список ошибок `"<file>:<line>: <сообщение>"`, пустой, если всё чисто.
  - `stripComments(css: string): string` — удаляет `/* … */`.
  - `generateRules(): string` — служебные правила (прогресс, уровни, задержки графика).
  - `build({ srcDir: string, outFile?: string }): { css: string, errors: string[], files: string[] }` — файл пишется только при `errors.length === 0`.
  - CLI `node tools/build.mjs` → пишет `dist/theme.css`, при ошибках код выхода 1.

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "shiki-theme",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node tools/build.mjs",
    "test": "node --test \"tools/**/*.test.mjs\"",
    "snapshot": "node tools/snapshot.mjs",
    "preview": "node tools/preview.mjs"
  }
}
```

- [ ] **Step 2: Написать падающие тесты проверки — `tools/lib/check.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCss, stripComments } from './check.mjs';

const ok = (css) => assert.deepEqual(checkCss(css, 't.css'), []);
const bad = (css, part) => {
  const errors = checkCss(css, 't.css');
  assert.ok(errors.length > 0, `ожидалась ошибка для: ${css}`);
  assert.ok(errors.some((e) => e.includes(part)), `нет "${part}" в: ${errors.join(' | ')}`);
};

test('чистый CSS проходит', () => {
  ok('.a { color: #fff; background: var(--bj-art); }');
  ok('.subscription, .windowed, .scripted { color: red; }');
});

test('запрещённые слова целиком ловятся, в комментариях — нет', () => {
  bad('.parent { color: red; }', '"parent"');
  bad('.a::after { content: "this"; }', '"this"');
  bad('@keyframes window-glow { to { opacity: 1; } }', '"window"');
  bad('.a { behavior: url(//x.htc); }', '"behavior"');
  ok('/* window parent this */ .a { color: red; }');
});

test('moz-binding, @charset, <, &# запрещены', () => {
  bad('.a { -moz-binding: none; }', 'moz-binding');
  bad('@charset "UTF-8";', '@charset');
  bad('.a::after { content: "<b>"; }', 'символ <');
  bad('.a::after { content: "&#10;"; }', '&#');
});

test('@import внутри темы запрещён', () => {
  bad('@import url("//x.css");', '@import');
});

test('обратный слэш разрешён только внутри content', () => {
  ok('.a::before { content: "\\f101"; }');
  ok(".a::before { content:'\\2014'; }");
  bad('.a { font-family: \\66 oo; }', 'обратный слэш');
});

test('url только // или data:image;base64', () => {
  ok('.a { background: url(//i.ibb.co/x.jpg); }');
  ok('.a { background: url("//i.ibb.co/x.jpg"); }');
  ok("@font-face { src: url(//fonts.gstatic.com/a.woff2) format('woff2'); }");
  ok('.a { background: url(data:image/png;base64,AAAA); }');
  bad('.a { background: url(https://i.ibb.co/x.jpg); }', 'url должен');
  bad('.a { background: url(data:text/css,x); }', 'url должен');
  bad('.a { background: url(/local.png); }', 'url должен');
});

test('номер строки указывает на место ошибки', () => {
  const errors = checkCss('.a {}\n/* многострочный\nкомментарий */\n.parent {}', 'f.css');
  assert.ok(errors[0].startsWith('f.css:4:'), errors[0]);
});

test('stripComments убирает комментарии', () => {
  assert.equal(stripComments('/* x */.a{}/* y */'), '.a{}');
});
```

- [ ] **Step 3: Запустить и убедиться, что падает**

Run: `node --test tools/lib/check.test.mjs`
Expected: FAIL — `Cannot find module …/tools/lib/check.mjs`.

- [ ] **Step 4: Реализовать `tools/lib/check.mjs`**

```js
// Проверка CSS под санитайзер Shikimori (app/services/misc/sanitize_evil_css.rb).
export const FORBIDDEN_WORDS = [
  'eval', 'cookie', 'window', 'parent', 'this', 'javascript',
  'vbscript', 'script', 'behavior', 'behaviour', 'expression',
];

const COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const WORDS_RE = new RegExp(`\\b(${FORBIDDEN_WORDS.join('|')})\\b`, 'gi');
const PATTERNS = [
  [/moz-binding/gi, 'запрещено: moz-binding'],
  [/@charset/gi, 'запрещено: @charset'],
  [/</g, 'запрещено: символ <'],
  [/&#/g, 'запрещено: последовательность &#'],
  [/@import/gi, 'запрещено: @import внутри темы (вложенные импорты сайт вырезает)'],
];
// Как SPECIAL_REGEXP санитайзера: content: ?['"].*?['"]
const CONTENT_RE = /content: ?(['"]).*?\1/g;
const URL_RE = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
const DATA_IMAGE_RE = /^data:image\/(svg\+xml|png|jpeg|jpg|gif);base64,/i;

export function stripComments(css) {
  return css.replace(COMMENT_RE, '');
}

// Заменяет символы на пробелы, сохраняя переводы строк, — чтобы номера строк не съезжали.
const blank = (text) => text.replace(/[^\n]/g, ' ');

export function checkCss(source, file = '<css>') {
  const css = source.replace(COMMENT_RE, blank);
  const errors = [];
  const lineOf = (index) => css.slice(0, index).split('\n').length;
  const add = (index, message) => errors.push(`${file}:${lineOf(index)}: ${message}`);

  for (const m of css.matchAll(WORDS_RE)) {
    add(m.index, `запрещённое слово "${m[1]}" — санитайзер Shikimori его вырежет`);
  }
  for (const [re, message] of PATTERNS) {
    for (const m of css.matchAll(re)) add(m.index, message);
  }
  const withoutContent = css.replace(CONTENT_RE, blank);
  for (const m of withoutContent.matchAll(/\\/g)) {
    add(m.index, 'обратный слэш вне content: "…" — санитайзер вырежет эскейп');
  }
  for (const m of css.matchAll(URL_RE)) {
    const url = m[2];
    if (!url.startsWith('//') && !DATA_IMAGE_RE.test(url)) {
      add(m.index, `url должен начинаться с // или data:image/…;base64 — сейчас: ${url.slice(0, 60)}`);
    }
  }
  return errors;
}
```

- [ ] **Step 5: Запустить тесты проверки**

Run: `node --test tools/lib/check.test.mjs`
Expected: PASS, 8 тестов.

- [ ] **Step 6: Написать падающие тесты генерации — `tools/lib/generate.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRules } from './generate.mjs';
import { checkCss } from './check.mjs';

test('прогресс достижений 0..100 как доля', () => {
  const css = generateRules();
  assert.ok(css.includes('[data-progress="0"]{--bj-p:0}'));
  assert.ok(css.includes('[data-progress="41"]{--bj-p:0.41}'));
  assert.ok(css.includes('[data-progress="100"]{--bj-p:1}'));
});

test('значки уровней 1..30', () => {
  const css = generateRules();
  assert.ok(css.includes('.b-achievement.level-1 .c-image::after{content:"1"}'));
  assert.ok(css.includes('.b-achievement.level-30 .c-image::after{content:"30"}'));
  assert.ok(!css.includes('level-31'));
});

test('лесенка задержек графика активности 1..40', () => {
  const css = generateRules();
  assert.ok(css.includes('.p-profiles-show .activity .graph .line:nth-child(1) .bar{animation-delay:0.63s}'));
  assert.ok(css.includes('.line:nth-child(40) .bar{animation-delay:1.80s}'));
});

test('сгенерированное проходит проверку санитайзера', () => {
  assert.deepEqual(checkCss(generateRules(), '<generated>'), []);
});
```

- [ ] **Step 7: Запустить и убедиться, что падает**

Run: `node --test tools/lib/generate.test.mjs`
Expected: FAIL — `Cannot find module …/generate.mjs`.

- [ ] **Step 8: Реализовать `tools/lib/generate.mjs`**

```js
// Правила, которые неудобно писать руками: CSS не умеет брать число из атрибута во всех браузерах.
export function generateRules() {
  const out = [];
  for (let n = 0; n <= 100; n++) {
    out.push(`[data-progress="${n}"]{--bj-p:${n / 100}}`);
  }
  for (let n = 1; n <= 30; n++) {
    out.push(`.b-achievement.level-${n} .c-image::after{content:"${n}"}`);
  }
  for (let n = 1; n <= 40; n++) {
    const delay = (0.6 + n * 0.03).toFixed(2);
    out.push(`.p-profiles-show .activity .graph .line:nth-child(${n}) .bar{animation-delay:${delay}s}`);
  }
  return out.join('\n');
}
```

- [ ] **Step 9: Запустить тесты генерации**

Run: `node --test tools/lib/generate.test.mjs`
Expected: PASS, 4 теста.

- [ ] **Step 10: Написать падающий тест сборки — `tools/build.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from './build.mjs';

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bj-build-'));
  for (const [name, css] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, css);
  }
  return dir;
}

test('склеивает по порядку путей, убирает комментарии, добавляет сгенерированное', () => {
  const dir = fixture({
    '10-b.css': '/* b */ .b {}',
    '00-a.css': '.a {}',
    '20-c/x.css': '.x {}',
    'note.txt': 'не css',
  });
  const out = path.join(dir, 'dist', 'theme.css');
  const { css, errors, files } = build({ srcDir: dir, outFile: out });
  assert.deepEqual(errors, []);
  assert.equal(files.length, 3);
  assert.ok(css.indexOf('.a {}') < css.indexOf('.b {}'));
  assert.ok(css.indexOf('.b {}') < css.indexOf('.x {}'));
  assert.ok(!css.includes('/*'));
  assert.ok(css.includes('[data-progress="100"]'));
  assert.equal(fs.readFileSync(out, 'utf8'), css);
});

test('при ошибках не пишет файл и называет файл-источник', () => {
  const dir = fixture({ '00-a.css': '.parent {}' });
  const out = path.join(dir, 'dist', 'theme.css');
  const { errors } = build({ srcDir: dir, outFile: out });
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('00-a.css:1:'));
  assert.ok(!fs.existsSync(out));
});
```

- [ ] **Step 11: Запустить и убедиться, что падает**

Run: `node --test tools/build.test.mjs`
Expected: FAIL — `Cannot find module …/tools/build.mjs`.

- [ ] **Step 12: Реализовать `tools/build.mjs`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCss, stripComments } from './lib/check.mjs';
import { generateRules } from './lib/generate.mjs';

export function collectSources(dir) {
  const out = [];
  const walk = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) out.push(full);
    }
  };
  walk(dir);
  return out;
}

export function build({ srcDir, outFile }) {
  const files = collectSources(srcDir);
  const errors = [];
  const parts = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    errors.push(...checkCss(source, path.relative(srcDir, file).replaceAll('\\', '/')));
    parts.push(source);
  }
  const generated = generateRules();
  errors.push(...checkCss(generated, '<generated>'));

  const css = stripComments(`${parts.join('\n')}\n${generated}`)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  if (errors.length === 0 && outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, css);
  }
  return { css, errors, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { css, errors, files } = build({
    srcDir: path.join(root, 'src'),
    outFile: path.join(root, 'dist', 'theme.css'),
  });
  if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`\n✗ ошибок: ${errors.length}, dist/theme.css не обновлён`);
    process.exit(1);
  }
  console.log(`✓ dist/theme.css — файлов: ${files.length}, ${(Buffer.byteLength(css) / 1024).toFixed(1)} КБ`);
}
```

- [ ] **Step 13: Прогнать все тесты**

Run: `npm test`
Expected: PASS, 14 тестов, 0 fail.

- [ ] **Step 14: Commit**

```bash
git add package.json tools/
git commit -m "Добавить сборщик темы и проверку под санитайзер Shikimori

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Предпросмотр, снимки страниц, аудит контраста

**Files:**
- Create: `tools/lib/inject.mjs`, `tools/lib/inject.test.mjs`
- Create: `tools/snapshot.mjs`, `tools/preview.mjs`, `tools/audit.js`
- Create: `preview/pages.json`
- Create: `config/field.css`

**Interfaces:**
- Consumes: `build({ srcDir, outFile })` из Task 1.
- Produces:
  - `fieldToPreviewCss(field: string): string` — поле без `@import`.
  - `toPreviewUrls(css: string): string` — `url(//` → `url(https://`.
  - `injectTheme(html: string, css: string): string` — подменяет или вставляет `<style id="custom_css">` и добавляет `<base href="https://shikimori.io/">`.
  - `npm run snapshot` → `preview/snapshots/<name>.html`.
  - `npm run preview` → `http://localhost:5178/` (список) и `http://localhost:5178/p/<name>`.
  - `tools/audit.js` — выражение для `javascript_tool` в браузере, возвращает массив `[описание, количество]`.

- [ ] **Step 1: Написать падающие тесты — `tools/lib/inject.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { injectTheme, toPreviewUrls, fieldToPreviewCss } from './inject.mjs';

test('подменяет существующий custom_css', () => {
  const html = '<html><head></head><body><style id="custom_css">old</style></body></html>';
  const out = injectTheme(html, '.new{}');
  assert.ok(out.includes('<style id="custom_css">.new{}</style>'));
  assert.ok(!out.includes('old'));
});

test('вставляет custom_css перед </head>, если его нет', () => {
  const out = injectTheme('<html><head><title>x</title></head><body></body></html>', '.a{}');
  assert.ok(out.includes('<style id="custom_css">.a{}</style></head>'));
});

test('добавляет base href один раз', () => {
  const out = injectTheme('<html><head lang="ru"></head></html>', '');
  assert.ok(out.includes('<head lang="ru"><base href="https://shikimori.io/">'));
  assert.equal(injectTheme(out, '').match(/<base /g).length, 1);
});

test('символы $ в CSS не ломают подстановку', () => {
  const out = injectTheme('<head></head>', '.a::after{content:"$&"}');
  assert.ok(out.includes('content:"$&"'));
});

test('протокольно-относительные url становятся https', () => {
  assert.equal(toPreviewUrls('url(//a.b/c) url("//d.e/f")'), 'url(https://a.b/c) url("https://d.e/f")');
});

test('из поля убирается @import', () => {
  const field = '@import url("https://raw.githubusercontent.com/x/y/main/dist/theme.css");\n@media all { :root { --bj-ghost: "X"; } }';
  assert.equal(fieldToPreviewCss(field).trim(), '@media all { :root { --bj-ghost: "X"; } }');
});
```

- [ ] **Step 2: Запустить и убедиться, что падает**

Run: `node --test tools/lib/inject.test.mjs`
Expected: FAIL — `Cannot find module …/inject.mjs`.

- [ ] **Step 3: Реализовать `tools/lib/inject.mjs`**

```js
const CUSTOM_CSS_RE = /<style id="custom_css"[^>]*>[\s\S]*?<\/style>/;

export function fieldToPreviewCss(field) {
  return field.replace(/@import[^;]*;\s*/g, '');
}

export function toPreviewUrls(css) {
  return css.replace(/url\(\s*(['"]?)\/\//g, 'url($1https://');
}

export function injectTheme(html, css) {
  const style = `<style id="custom_css">${css}</style>`;
  let out = CUSTOM_CSS_RE.test(html)
    ? html.replace(CUSTOM_CSS_RE, () => style)
    : html.replace('</head>', () => `${style}</head>`);
  if (!/<base\s/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, (tag) => `${tag}<base href="https://shikimori.io/">`);
  }
  return out;
}
```

- [ ] **Step 4: Запустить тесты**

Run: `node --test tools/lib/inject.test.mjs`
Expected: PASS, 6 тестов.

- [ ] **Step 5: Создать `config/field.css`** — текст для поля сайта; в предпросмотре используется без `@import`

```css
@import url("https://raw.githubusercontent.com/Bonjourchik/shiki-theme/main/dist/theme.css");
@media all { :root {
  --bj-art: url(//i.ibb.co/BV9BxDb7/1880694-wolf-anime-fox-ears-fox-girl-1080-P.jpg);
  --bj-ghost: "BONJOURCHIK · BONJOURCHIK · ";
} }
```

- [ ] **Step 6: Создать `preview/pages.json`**

```json
[
  { "name": "profile", "url": "https://shikimori.io/Bonjourchik" },
  { "name": "anime", "url": "https://shikimori.io/animes/z185-initial-d-first-stage" },
  { "name": "home", "url": "https://shikimori.io/" },
  { "name": "forum", "url": "https://shikimori.io/forum" },
  { "name": "topic", "url": "https://shikimori.io/forum/site/209842-css-thread" },
  { "name": "list", "url": "https://shikimori.io/Bonjourchik/list/anime" },
  { "name": "catalog", "url": "https://shikimori.io/animes?search=initial" }
]
```

- [ ] **Step 7: Создать `tools/snapshot.mjs`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'preview', 'snapshots');
const pages = JSON.parse(fs.readFileSync(path.join(root, 'preview', 'pages.json'), 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

fs.mkdirSync(outDir, { recursive: true });
for (const { name, url } of pages) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ru' } });
  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status} ${url}`);
    process.exitCode = 1;
    continue;
  }
  const html = await res.text();
  fs.writeFileSync(path.join(outDir, `${name}.html`), html);
  console.log(`✓ ${name}: ${(html.length / 1024).toFixed(0)} КБ`);
}
```

- [ ] **Step 8: Создать `tools/preview.mjs`**

```js
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';
import { injectTheme, toPreviewUrls, fieldToPreviewCss } from './lib/inject.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapDir = path.join(root, 'preview', 'snapshots');
const PORT = Number(process.env.PORT || 5178);

const send = (res, status, body, type = 'text/html; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/') {
    const names = fs.existsSync(snapDir)
      ? fs.readdirSync(snapDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5))
      : [];
    const links = names.map((n) => `<li><a href="/p/${n}">${n}</a></li>`).join('');
    return send(res, 200, `<h1>Dark Amber preview</h1><ul>${links || '<li>нет снимков — npm run snapshot</li>'}</ul>`);
  }
  const match = url.pathname.match(/^\/p\/([\w-]+)$/);
  if (!match) return send(res, 404, 'not found', 'text/plain; charset=utf-8');
  const file = path.join(snapDir, `${match[1]}.html`);
  if (!fs.existsSync(file)) return send(res, 404, `нет снимка ${match[1]}`, 'text/plain; charset=utf-8');

  const { css, errors } = build({ srcDir: path.join(root, 'src'), outFile: path.join(root, 'dist', 'theme.css') });
  if (errors.length) return send(res, 500, errors.join('\n'), 'text/plain; charset=utf-8');
  const field = fieldToPreviewCss(fs.readFileSync(path.join(root, 'config', 'field.css'), 'utf8'));
  const html = injectTheme(fs.readFileSync(file, 'utf8'), toPreviewUrls(`${css}\n${field}`));
  return send(res, 200, html);
}).listen(PORT, () => console.log(`preview: http://localhost:${PORT}/`));
```

- [ ] **Step 9: Создать `tools/audit.js`** — вставлять целиком в `javascript_tool` на странице предпросмотра

```js
// Возвращает до 40 проблемных мест: светлые фоны и тёмный текст на тёмном фоне.
(() => {
  const ACCENTS = new Set(['rgb(240, 168, 69)', 'rgb(255, 190, 99)', 'rgb(255, 122, 61)']);
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const effectiveBg = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a >= 0.5) return lum(c);
    }
    return lum({ r: 11, g: 13, b: 17 });
  };
  const describe = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      parts.unshift(e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : ''));
    }
    return parts.join(' > ');
  };
  const issues = new Map();
  const add = (key) => issues.set(key, (issues.get(key) || 0) + 1);
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('iframe, svg, img, picture, [class*="spns"], .b-anime_status_tag')) continue;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const bg = parse(cs.backgroundColor);
    if (bg && bg.a >= 0.5 && !ACCENTS.has(cs.backgroundColor) && lum(bg) > 0.45) add(`светлый фон: ${describe(el)}`);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const tx = parse(cs.color);
    if (hasText && tx && lum(tx) < 0.12 && effectiveBg(el) < 0.2) add(`тёмный текст: ${describe(el)}`);
  }
  return [...issues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
})()
```

- [ ] **Step 10: Скачать снимки и проверить предпросмотр без темы**

Run: `npm run snapshot`
Expected: 7 строк `✓ <name>: … КБ`.

Затем создать пустую папку `src` и запустить сервер в фоне (Bash с `run_in_background: true`):

```bash
mkdir -p src && npm run preview
```

Expected: `preview: http://localhost:5178/`. В браузере (`mcp__Claude_Browser__navigate`) открыть `http://localhost:5178/p/profile`: страница профиля в стандартном светлом виде, без темы Edesign. Выполнить `tools/audit.js` через `mcp__Claude_Browser__javascript_tool` — вывод содержит `светлый фон: section.l-page` (это подтверждает, что аудит работает).

- [ ] **Step 11: Прогнать тесты и закоммитить**

Run: `npm test`
Expected: PASS, 20 тестов.

```bash
git add tools/ preview/pages.json config/field.css
git commit -m "Добавить предпросмотр на снимках страниц и аудит контраста

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Шрифты, токены, база и анимации

**Files:**
- Create: `src/00-fonts.css`, `src/01-tokens.css`, `src/10-base.css`, `src/40-motion.css`

**Interfaces:**
- Produces (используются всеми следующими задачами): переменные `--bj-bg --bj-sf --bj-sf2 --bj-sf3 --bj-ln --bj-ln2 --bj-tx --bj-tx2 --bj-mu --bj-ac --bj-ac-h --bj-ac2 --bj-ac-s --bj-ac-line --bj-ok --bj-warn --bj-on-ac --bj-r --bj-r-sm --bj-shadow --bj-ease --bj-font --bj-font-alt --bj-art --bj-ghost --bj-banner-h`; keyframes `bj-drift bj-kenburns bj-sweep bj-ghost bj-spin bj-pulse bj-shine bj-ping bj-blink bj-rise bj-fill-x bj-grow-y bj-bar-glint`.

- [ ] **Step 1: `src/00-fonts.css`** (адреса взяты из CSS Google Fonts с современным User-Agent, шрифты вариативные)

```css
/* Onest — текст */
@font-face {
  font-family: 'Onest';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url(//fonts.gstatic.com/s/onest/v11/gNMKW3F-SZuj7xmb-HY6EQ.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face {
  font-family: 'Onest';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url(//fonts.gstatic.com/s/onest/v11/gNMKW3F-SZuj7xmf-HY.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* Unbounded — ник, заголовки, цифры */
@font-face {
  font-family: 'Unbounded';
  font-style: normal;
  font-weight: 500 800;
  font-display: swap;
  src: url(//fonts.gstatic.com/s/unbounded/v12/Yq6W-LOTXCb04q32xlpwv8ZfrxE.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
@font-face {
  font-family: 'Unbounded';
  font-style: normal;
  font-weight: 500 800;
  font-display: swap;
  src: url(//fonts.gstatic.com/s/unbounded/v12/Yq6W-LOTXCb04q32xlpwu8Zf.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

- [ ] **Step 2: `src/01-tokens.css`**

Токены объявляются только на `:root`. Если объявить их ещё и на `body`, значения на `body` перекроют переменные из поля «Внешний вид сайта» (они тоже на `:root`), и арт с бегущим текстом нельзя будет сменить.

```css
:root {
  --bj-bg: #0b0d11;
  --bj-sf: #14171d;
  --bj-sf2: #1b1f27;
  --bj-sf3: #252a35;
  --bj-ln: #232833;
  --bj-ln2: #343a47;
  --bj-tx: #eceef2;
  --bj-tx2: #c9ccd4;
  --bj-mu: #878da0;
  --bj-ac: #f0a845;
  --bj-ac-h: #ffbe63;
  --bj-ac2: #ff7a3d;
  --bj-ac-s: rgba(240, 168, 69, .14);
  --bj-ac-line: rgba(240, 168, 69, .35);
  --bj-ok: #5fbf77;
  --bj-warn: #e0655a;
  --bj-on-ac: #1a1206;
  --bj-r: 16px;
  --bj-r-sm: 10px;
  --bj-shadow: 0 12px 28px rgba(0, 0, 0, .45);
  --bj-ease: cubic-bezier(.2, .8, .2, 1);
  --bj-font: 'Onest', system-ui, 'Segoe UI', Roboto, sans-serif;
  --bj-font-alt: 'Unbounded', 'Onest', system-ui, sans-serif;
  --bj-banner-h: 480px;
  /* дефолты; поле «Внешний вид сайта» переопределяет их */
  --bj-art: url(//i.ibb.co/BV9BxDb7/1880694-wolf-anime-fox-ears-fox-girl-1080-P.jpg);
  --bj-ghost: "BONJOURCHIK · BONJOURCHIK · ";

  /* токены самого сайта; --font-alt сайт берёт и для полей ввода и подменю,
     поэтому там Onest, а Unbounded ставится точечно */
  --font-main: var(--bj-font);
  --font-alt: var(--bj-font);
  --link-color: var(--bj-ac);
  --link-hover-color: var(--bj-ac-h);
  --link-active-color: var(--bj-ac2);
  --link-border-color: var(--bj-ac-line);
  --link-border-hover-color: var(--bj-ac-h);
  --link-border-active-color: var(--bj-ac2);
  --headline-color: var(--bj-tx);
  --headline-background-color: transparent;
  --headline-border-color: transparent;
  --headline-arrow-color: var(--bj-ac);
  --icon-color: var(--bj-mu);
}
```

- [ ] **Step 3: `src/10-base.css`**

```css
html {
  background: var(--bj-bg);
  color-scheme: dark;
  scrollbar-color: var(--bj-sf3) var(--bj-bg);
}
body {
  background: var(--bj-bg) radial-gradient(rgba(255, 255, 255, .035) 1px, transparent 1px) 0 0 / 22px 22px;
  color: var(--bj-tx);
  font-family: var(--bj-font);
  overflow-x: clip;
}
a { color: var(--link-color); transition: color .2s var(--bj-ease); }
a:hover { color: var(--link-hover-color); }
h1, h2, h3, h4 { color: var(--bj-tx); }
h2, h3, h4 { font-family: var(--bj-font-alt); font-weight: 600; letter-spacing: -.2px; }
hr { background-image: linear-gradient(90deg, transparent, var(--bj-ln2), transparent); }
::selection { background: rgba(240, 168, 69, .35); color: #fff; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--bj-bg); }
::-webkit-scrollbar-thumb { background: var(--bj-sf3); border: 2px solid var(--bj-bg); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--bj-ln2); }
.b-separator,
.b-nothing_here,
.b-breadcrumbs,
.b-show_more { color: var(--bj-mu); }
mark { background: var(--bj-ac-s); color: var(--bj-ac-h); }
```

- [ ] **Step 4: `src/40-motion.css`**

```css
@keyframes bj-drift { to { transform: translate(520px, 260px) scale(1.2); } }
@keyframes bj-kenburns { from { transform: scale(1); } to { transform: scale(1.12) translate(-2%, -3%); } }
@keyframes bj-sweep {
  0% { background-position: 0 0, 120% 0; }
  60%, 100% { background-position: 0 0, -120% 0; }
}
@keyframes bj-ghost { to { transform: translateX(-160px); } }
@keyframes bj-spin { to { transform: rotate(360deg); } }
@keyframes bj-pulse { 50% { opacity: .4; transform: scale(.92); } }
@keyframes bj-shine {
  0% { background-position: 100% 0; }
  50%, 100% { background-position: 0 0; }
}
@keyframes bj-ping {
  0% { box-shadow: 0 0 0 0 rgba(95, 191, 119, .6); }
  100% { box-shadow: 0 0 0 8px rgba(95, 191, 119, 0); }
}
@keyframes bj-blink { 50% { box-shadow: 0 0 2px var(--bj-ac); opacity: .6; } }
@keyframes bj-rise { from { opacity: 0; transform: translateY(18px); } }
@keyframes bj-fill-x { from { transform: scaleX(0); } }
@keyframes bj-grow-y { from { transform: scaleY(0); } }
@keyframes bj-bar-glint { 60%, 100% { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 5: Собрать**

Run: `npm run build`
Expected: `✓ dist/theme.css — файлов: 4, … КБ`.

- [ ] **Step 6: Проверить в предпросмотре**

Сервер из Task 2 должен работать (если нет — запустить `npm run preview` в фоне). Открыть `http://localhost:5178/p/profile`, сделать скриншот. Ожидается: фон страницы вокруг центральной колонки почти чёрный с точечной сеткой; текст меню и шрифт — Onest (проверить через `javascript_tool`: `getComputedStyle(document.body).fontFamily` начинается с `Onest`, а `document.fonts.check('16px Unbounded')` возвращает `true` после `await document.fonts.ready`). Центральная колонка `.l-page` пока белая — это нормально, она перекрашивается в Task 4.

- [ ] **Step 7: Commit**

```bash
git add src/ dist/theme.css
git commit -m "Тема: шрифты, токены, база, ключевые кадры анимаций

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Раскладка и меню

**Files:**
- Create: `src/20-components/layout.css`, `src/20-components/menu.css`

**Interfaces:**
- Consumes: токены и `bj-drift`, `bj-blink` из Task 3.

- [ ] **Step 1: `src/20-components/layout.css`**

```css
.l-page {
  background: transparent;
  color: var(--bj-tx);
}
/* дрейфующее янтарное сияние за контентом */
html::after {
  content: "";
  position: fixed;
  z-index: 0;
  left: -200px;
  top: 200px;
  width: 900px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(240, 168, 69, .12), rgba(255, 122, 61, .05) 50%, transparent);
  filter: blur(30px);
  pointer-events: none;
  animation: bj-drift 18s ease-in-out infinite alternate;
}
.head h1 {
  color: var(--bj-tx);
  font-family: var(--bj-font-alt);
  font-weight: 700;
  font-size: 24px;
  letter-spacing: -.3px;
}
.b-breadcrumbs a { color: var(--bj-tx2); }
.b-breadcrumbs a:hover { color: var(--bj-ac); }
.l-page .menu-toggler .toggler { background: var(--bj-sf2); }
.l-page .menu-toggler .toggler::after { color: var(--bj-tx); }
.l-footer,
.l-footer .links,
.l-footer .copyright,
.l-footer a { color: var(--bj-mu); }
.l-footer a:hover { color: var(--bj-ac); }
```

- [ ] **Step 2: `src/20-components/menu.css`**

```css
.l-top_menu-v2 {
  background: rgba(11, 13, 17, .72);
  -webkit-backdrop-filter: blur(14px) saturate(1.3);
  backdrop-filter: blur(14px) saturate(1.3);
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  color: var(--bj-tx);
}
.l-top_menu-v2 .menu-dropdown > span {
  color: var(--bj-tx2);
  transition: color .2s, box-shadow .3s var(--bj-ease);
}
.l-top_menu-v2 .menu-dropdown > span:hover,
.l-top_menu-v2 .menu-dropdown > span:focus {
  color: var(--bj-tx);
  box-shadow: inset 0 -2px 0 var(--bj-ac);
}
.l-top_menu-v2 .submenu {
  background: var(--bj-sf2);
  border: 1px solid var(--bj-ln);
  border-top: 0;
  border-radius: 0 0 var(--bj-r-sm) var(--bj-r-sm);
  box-shadow: var(--bj-shadow);
}
.l-top_menu-v2 .submenu > a {
  color: var(--bj-tx2);
  transition: background-color .2s, color .2s;
}
.l-top_menu-v2 .submenu > a:hover,
.l-top_menu-v2 .submenu > a:active,
.l-top_menu-v2 .submenu > a.active {
  background: var(--bj-ac-s);
  color: var(--bj-ac);
}
.l-top_menu-v2 .submenu .legend {
  color: var(--bj-mu);
  font-family: var(--bj-font-alt);
  font-size: 9.5px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}
.l-top_menu-v2 .global-search input {
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 9px;
  color: var(--bj-tx);
  transition: border-color .2s, box-shadow .2s;
}
.l-top_menu-v2 .global-search input:focus {
  border-color: var(--bj-ac);
  box-shadow: 0 0 0 3px var(--bj-ac-s);
}
.l-top_menu-v2 .global-search input::placeholder { color: var(--bj-mu); }
.l-top_menu-v2 .global-search .clear,
.l-top_menu-v2 .global-search .hotkey-marker { color: var(--bj-mu); border-color: var(--bj-ln2); }
.l-top_menu-v2 .global-search .search-results {
  background: var(--bj-sf2);
  border: 1px solid var(--bj-ln);
  border-radius: var(--bj-r-sm);
  box-shadow: var(--bj-shadow);
  color: var(--bj-tx);
}
.l-top_menu-v2 .menu-icon[data-count]::after,
.l-top_menu-v2 .menu-dropdown > span[data-unread_count]::after {
  background: var(--bj-ac);
  color: var(--bj-on-ac);
}
```

- [ ] **Step 3: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 6`.

Открыть `http://localhost:5178/p/home` и `/p/profile`, сделать скриншоты. Ожидается: полупрозрачное тёмное меню; центральная колонка без белого фона; при наведении на пункт с аватаром появляется янтарное подчёркивание, выпадающее меню — графитовое, пункты подсвечиваются янтарём. Кликнуть по полю поиска — янтарная рамка и кольцо.

- [ ] **Step 4: Commit**

```bash
git add src/20-components/layout.css src/20-components/menu.css dist/theme.css
git commit -m "Тема: раскладка страницы и верхнее меню

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Блоки и контролы

**Files:**
- Create: `src/20-components/blocks.css`, `src/20-components/controls.css`

**Interfaces:**
- Consumes: токены, `bj-blink`.

- [ ] **Step 1: `src/20-components/blocks.css`**

```css
.headline,
.midheadline,
.subheadline {
  background: transparent;
  border-left: 0;
  color: var(--bj-tx);
  font-family: var(--bj-font-alt);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1.6px;
  line-height: 30px;
  padding: 0 2px;
  text-transform: uppercase;
}
.headline { font-size: 13px; }
.headline::before,
.midheadline::before,
.subheadline::before {
  content: "";
  display: inline-block;
  vertical-align: middle;
  width: 7px;
  height: 7px;
  margin: -2px 10px 0 0;
  border-radius: 2px;
  background: var(--bj-ac);
  box-shadow: 0 0 10px var(--bj-ac);
  transform: rotate(45deg);
  animation: bj-blink 2.6s ease-in-out infinite;
}
.headline a,
.midheadline a,
.subheadline a { color: inherit; }
.headline a:hover,
.midheadline a:hover,
.subheadline a:hover { color: var(--bj-ac); }

.b-topic {
  background: var(--bj-sf);
  border: 1px solid var(--bj-ln);
  border-radius: var(--bj-r);
  padding: 14px 16px;
  transition: border-color .3s;
}
.b-topic:hover { border-color: var(--bj-ln2); }
.b-hot_topics-v2 { background: var(--bj-sf); border-radius: var(--bj-r); }
.b-db_entry-variant-list_item,
.b-block_list li { border-color: var(--bj-ln); }
.b-block_list li:hover,
.b-block_list li:active,
.b-block_list li.selected { background: var(--bj-ac-s); }
```

- [ ] **Step 2: `src/20-components/controls.css`**

```css
.b-button,
.b-button.blue,
.b-form input[type=submit],
input[type=submit] {
  background-color: var(--bj-ac);
  border: 0;
  border-radius: 9px;
  color: var(--bj-on-ac);
  font-weight: 600;
  padding: 0 14px;
  transition: background-color .2s, transform .2s var(--bj-ease), box-shadow .2s;
}
.b-button:hover,
.b-button.blue:hover,
.b-form input[type=submit]:hover,
input[type=submit]:hover {
  background-color: var(--bj-ac-h);
  color: var(--bj-on-ac);
  box-shadow: 0 6px 16px rgba(240, 168, 69, .3);
  transform: translateY(-1px);
}
.b-button:active,
.b-button.blue:active,
input[type=submit]:active {
  background-color: var(--bj-ac2);
  transform: none;
}
.b-link_button {
  background-color: var(--bj-sf3);
  border: 1px solid var(--bj-ln2);
  border-radius: 9px;
  color: var(--bj-tx);
  font-family: var(--bj-font);
  transition: border-color .2s, color .2s;
}
.b-link_button:hover {
  border-color: var(--bj-ac);
  color: var(--bj-ac);
}
.b-spoiler_block > span {
  background-color: var(--bj-ac-s);
  border-radius: 9px;
  color: var(--bj-ac);
}
.b-spoiler_block > span:hover { background-color: rgba(240, 168, 69, .24); }

.b-input input,
.b-input textarea,
input:not([type]),
input[type=text],
input[type=search],
input[type=email],
input[type=password],
input[type=number],
input[type=url],
textarea,
select,
.b-shiki_editor-v2 .app-placeholder .textarea,
.b-shiki_editor .links .link-value,
.b-shiki_editor .images .link-value,
.b-shiki_editor .quotes .link-value {
  background-color: var(--bj-bg);
  border: 1px solid var(--bj-ln2);
  border-radius: 9px;
  color: var(--bj-tx);
  transition: border-color .2s, box-shadow .2s;
}
.b-input input:focus,
.b-input textarea:focus,
input:not([type]):focus,
input[type=text]:focus,
input[type=search]:focus,
input[type=email]:focus,
input[type=password]:focus,
input[type=number]:focus,
input[type=url]:focus,
textarea:focus,
select:focus,
.b-shiki_editor-v2 .app-placeholder .textarea:focus {
  border-color: var(--bj-ac);
  box-shadow: 0 0 0 3px var(--bj-ac-s);
  outline: none;
}
input::placeholder,
textarea::placeholder { color: var(--bj-mu); }
.b-input input[disabled] { background-color: var(--bj-sf2); color: var(--bj-mu); }
input[type=checkbox],
input[type=radio] { accent-color: var(--bj-ac); }

/* кнопка «добавить в список» на странице тайтла: у сайта светлые фоны по статусам */
.b-add_to_list .trigger,
.b-add_to_list .option,
.b-add_to_list.planned .trigger,
.b-add_to_list.planned .option,
.b-add_to_list.watching .trigger,
.b-add_to_list.watching .option,
.b-add_to_list.rewatching .trigger,
.b-add_to_list.rewatching .option,
.b-add_to_list.completed .trigger,
.b-add_to_list.completed .option,
.b-add_to_list.on_hold .trigger,
.b-add_to_list.on_hold .option,
.b-add_to_list.dropped .trigger,
.b-add_to_list.dropped .option {
  background: var(--bj-sf2);
  border-color: var(--bj-ln);
  color: var(--bj-tx);
}
.b-add_to_list.planned .trigger,
.b-add_to_list.watching .trigger,
.b-add_to_list.rewatching .trigger { box-shadow: inset 3px 0 0 var(--bj-ac); }
.b-add_to_list.completed .trigger { box-shadow: inset 3px 0 0 var(--bj-ok); }
.b-add_to_list.on_hold .trigger { box-shadow: inset 3px 0 0 var(--bj-mu); }
.b-add_to_list.dropped .trigger { box-shadow: inset 3px 0 0 var(--bj-warn); }
```

- [ ] **Step 2b: Проверить, не занят ли `::before` у заголовков**

В предпросмотре `/p/anime` выполнить в `javascript_tool`:

```js
[...document.querySelectorAll('.subheadline')].slice(0, 5).map((e) => getComputedStyle(e, '::before').content)
```

Expected: `["\"\"", …]` — ромб на месте. Если сайт кладёт в `::before` иконку или стрелку (у `content` видно другое значение), перенести ромб на `::after` с `float: left`, заменив в обоих блоках `::before` на `::after`.

- [ ] **Step 3: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 8`.

Открыть `/p/anime` и `/p/topic`, скриншоты. Ожидается: заголовки блоков — Unbounded капсом с ромбом; кнопки янтарные; поле комментария — тёмное с янтарной рамкой при фокусе; кнопка «Добавить в список» — графитовая с цветной полоской слева.

- [ ] **Step 4: Commit**

```bash
git add src/20-components/blocks.css src/20-components/controls.css dist/theme.css
git commit -m "Тема: заголовки, блоки, кнопки и поля ввода

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Постеры, комментарии, прочее

**Files:**
- Create: `src/20-components/posters.css`, `src/20-components/comments.css`, `src/20-components/misc.css`

- [ ] **Step 1: `src/20-components/posters.css`**

```css
.b-catalog_entry .cover { color: var(--bj-tx2); }
.b-catalog_entry .cover:hover { color: var(--bj-ac); }
.b-catalog_entry .cover .misc { color: var(--bj-mu); }
.b-catalog_entry .image-decor {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--bj-r-sm);
  box-shadow: 0 0 0 1px var(--bj-ln);
  transition: transform .45s var(--bj-ease), box-shadow .45s var(--bj-ease);
}
.b-catalog_entry .image-decor::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, .3) 50%, transparent 70%);
  pointer-events: none;
  transform: translateX(-120%);
  transition: transform .7s var(--bj-ease);
}
.b-catalog_entry .cover:hover .image-decor {
  box-shadow: 0 0 0 1px var(--bj-ac), 0 14px 28px rgba(0, 0, 0, .5), 0 0 18px rgba(240, 168, 69, .3);
  transform: translateY(-5px) scale(1.04);
}
.b-catalog_entry .cover:hover .image-decor::after { transform: translateX(120%); }
.b-catalog_entry-tooltip .inner {
  background: var(--bj-sf2);
  border: 1px solid var(--bj-ln2);
  border-radius: var(--bj-r-sm);
  color: var(--bj-tx);
}
.b-catalog_entry-tooltip .inner .line .key,
.b-catalog_entry-tooltip .inner .rating,
.b-catalog_entry-tooltip .inner .rating .text { color: var(--bj-mu); }
```

- [ ] **Step 2: `src/20-components/comments.css`**

```css
.b-comment {
  background: var(--bj-sf);
  border: 1px solid var(--bj-ln);
  border-radius: var(--bj-r);
  margin-bottom: 12px;
  padding: 12px 14px;
  transition: border-color .3s;
}
.b-comment:hover { border-color: var(--bj-ln2); }
.b-comment header img,
.b-topic header img { border-radius: 50%; }
.b-comment .name-date .name,
.b-topic .name-date .name { color: var(--bj-tx); font-weight: 600; }
.b-comment .name-date .time,
.b-topic > .inner .name-date .time { color: var(--bj-mu); }
.b-comment .body,
.b-topic .body { color: var(--bj-tx2); }
.b-quote,
.b-quote-v2 {
  background: var(--bj-sf2);
  border: 0;
  border-left: 3px solid var(--bj-ac);
  border-radius: 0 var(--bj-r-sm) var(--bj-r-sm) 0;
  color: var(--bj-tx2);
  font-style: normal;
}
.b-quote .b-quote,
.b-quote .b-quote .b-quote .b-quote { background: var(--bj-sf3); }
.b-quote .b-quote .b-quote { background: var(--bj-sf2); }
code.b-code_inline {
  background: var(--bj-sf3);
  border: 0;
  border-radius: 5px;
  color: var(--bj-ac-h);
  padding: 1px 5px;
}
pre,
pre code { background: var(--bj-sf2); color: var(--bj-tx2); border-radius: var(--bj-r-sm); }
.b-comments .comments-loader,
.b-comments .comments-hider,
.b-comments .comments-expander,
.b-comments .faye-loader,
.b-comments .messages-postloader,
.b-forum .faye-loader,
.b-postloader {
  background: var(--bj-sf2);
  border-color: var(--bj-ln);
  border-radius: var(--bj-r-sm);
  color: var(--bj-tx2);
}
.b-comments .comments-loader:hover,
.b-comments .comments-hider:hover,
.b-comments .comments-expander:hover,
.b-comments .faye-loader:hover,
.b-comments .messages-postloader:hover,
.b-forum .faye-loader:hover,
.b-postloader:hover,
.b-comments .comments-loader:active,
.b-comments .comments-hider:active,
.b-comments .comments-expander:active,
.b-postloader:active {
  background: var(--bj-ac-s);
  border-color: var(--bj-ac-line);
  color: var(--bj-ac);
}
.b-comment > .inner aside.moderation-ban-form,
.b-topic > .inner aside.moderation-ban-form {
  background-color: var(--bj-sf2);
  border-color: var(--bj-ln);
}
```

- [ ] **Step 3: `src/20-components/misc.css`**

```css
.tooltip-inner {
  background: var(--bj-sf2);
  border: 1px solid var(--bj-ln2);
  border-radius: var(--bj-r-sm);
  box-shadow: var(--bj-shadow);
  color: var(--bj-tx);
}
.b-modal > .inner {
  background: var(--bj-sf);
  border: 1px solid var(--bj-ln);
  border-radius: var(--bj-r);
  color: var(--bj-tx);
}
.ac_results { background-color: var(--bj-sf2); border-color: var(--bj-ln); color: var(--bj-tx); }
.ac_odd { background-color: var(--bj-sf); }
.ac_over { background-color: var(--bj-ac-s); color: var(--bj-ac); }
.b-dropzone,
.b-footer_vote,
.b-editable_grid tbody tr:nth-child(odd) td { background: var(--bj-sf); }
.b-form.green-form,
.green { background: rgba(95, 191, 119, .12); }
.red,
.b-errors .subheadline { background: rgba(224, 101, 90, .14); color: #f19b93; }
.blue,
.skyblue,
.powderblue { background: rgba(127, 178, 255, .12); }
.yellow { background: rgba(240, 200, 69, .12); }
.orange { background: rgba(255, 122, 61, .12); }
.pink,
.magenta { background: rgba(244, 119, 173, .12); }
.purple { background: rgba(155, 140, 255, .12); }
.brown { background: rgba(160, 120, 80, .14); }
.gray { background: rgba(255, 255, 255, .06); }
```

- [ ] **Step 4: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 11`.

Открыть `/p/catalog` и `/p/topic`, скриншоты. Ожидается: постеры со скруглением; при наведении подъём, янтарная рамка и пробегающий блик; комментарии — графитовые карточки; цитаты с янтарной полосой слева.

- [ ] **Step 5: Commit**

```bash
git add src/20-components/posters.css src/20-components/comments.css src/20-components/misc.css dist/theme.css
git commit -m "Тема: постеры, комментарии, тултипы и цветные хелперы

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Мобильная база и приёмка этапа 1

**Files:**
- Create: `src/50-mobile.css`
- Modify: файлы `src/20-components/*.css` — по результатам аудита

- [ ] **Step 1: `src/50-mobile.css`** (профильные правила добавятся в Task 12)

```css
@media (max-width: 1023px) {
  html::after { display: none; }
  .l-top_menu-v2 {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: var(--bj-sf);
  }
}
```

- [ ] **Step 2: Собрать**

Run: `npm run build`
Expected: `✓ … файлов: 12`.

- [ ] **Step 3: Аудит всех страниц на десктопе**

Для каждой страницы `profile anime home forum topic list catalog`: открыть `http://localhost:5178/p/<name>` при ширине 1440 (`mcp__Claude_Browser__resize_window` с `width: 1440, height: 900`), выполнить `tools/audit.js`, сделать скриншот.

Expected: аудит возвращает `[]` или только элементы рекламы и сторонних виджетов.

- [ ] **Step 4: Исправить найденное**

Для каждой строки аудита:
1. найти правило сайта, которое красит элемент. Способ первый — в браузере посмотреть `getComputedStyle(el).backgroundColor` и `color` у элемента из аудита. Способ второй — поискать класс в CSS сайта (адрес бандла взять из `<link href="/static/css/application.css?v=…">` в снимке):

```bash
curl -s "https://shikimori.io/static/css/application.css" | tr '}' '\n' | grep -F ".b-quote" | head -20
```

(вместо `.b-quote` подставить класс из строки аудита);
2. добавить перекрытие в тематический файл `src/20-components/`: фоны → `var(--bj-sf)`/`var(--bj-sf2)`, текст → `var(--bj-tx)`/`var(--bj-tx2)`/`var(--bj-mu)`, границы → `var(--bj-ln)`. Селектор должен быть не менее специфичным, чем у сайта;
3. `npm run build`, перезагрузить страницу, снова выполнить аудит.

Повторять, пока аудит не станет пустым на всех 7 страницах.

- [ ] **Step 5: Мобильные ширины**

Повторить аудит и скриншоты на ширинах 768 (`preset: "tablet"`) и 375 (`preset: "mobile"`). После каждого переключения перезагружать страницу. Expected: аудит пустой, нет горизонтальной прокрутки (`document.documentElement.scrollWidth <= innerWidth` в `javascript_tool` → `true`). После проверки вернуть `preset: "desktop"`.

- [ ] **Step 6: Прогон с уменьшением движения**

`mcp__Claude_Browser__javascript_tool` не умеет эмулировать `prefers-reduced-motion`, поэтому проверить правило напрямую:

```js
[...document.getElementById('custom_css').sheet.cssRules].some((r) => r.media && r.media.mediaText.includes('prefers-reduced-motion'))
```

Expected: `true`.

- [ ] **Step 7: Commit**

```bash
git add src/ dist/theme.css
git commit -m "Тема: мобильная база и доводка по аудиту контраста — этап 1 готов

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Профиль — сетка, карточки, баннер

**Files:**
- Create: `src/30-pages/profile/00-layout.css`, `src/30-pages/profile/banner.css`

**Interfaces:**
- Consumes: `--bj-art`, `--bj-ghost`, `--bj-banner-h`, `bj-kenburns`, `bj-sweep`, `bj-ghost`, `bj-rise`.
- Produces: карточное оформление для `.c-left`, колонок `.cc-2a`, `.c-right > .block`, `.profile-content > .block:not(.cc-2)`; отступ `.profile-head` под баннер — `margin-top: 250px` (задаётся в Task 9).

Разметка профиля (снята с живой страницы): `section.l-page > div > .profile-head + .profile-content`; `.profile-content > .cc-2.block > .c-column.c-left + .c-column.c-right`; `.c-right > .cc-2a.m30 > .c-column ×2` (друзья, клубы) и `.c-right > .block` (избранное); далее `.block.achievements`, `.about.block`, `.block` (стена).

- [ ] **Step 1: `src/30-pages/profile/00-layout.css`**

```css
.p-profiles-show .profile-content > .cc-2 {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
}
.p-profiles-show .profile-content > .cc-2 > .c-column {
  float: none;
  width: auto;
  margin: 0;
}
.p-profiles-show .profile-content .c-right > .cc-2a {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}
.p-profiles-show .profile-content .c-right > .cc-2a > .c-column {
  float: none;
  width: auto;
  margin: 0;
}
/* карточки */
.p-profiles-show .profile-content > .cc-2 > .c-left,
.p-profiles-show .profile-content .c-right > .cc-2a > .c-column,
.p-profiles-show .profile-content .c-right > .block,
.p-profiles-show .profile-content > .block:not(.cc-2) {
  position: relative;
  margin-bottom: 18px;
  padding: 18px 20px;
  background: var(--bj-sf);
  border: 1px solid var(--bj-ln);
  border-radius: var(--bj-r);
  transition: border-color .3s;
}
.p-profiles-show .profile-content > .cc-2 > .c-left:hover,
.p-profiles-show .profile-content .c-right > .cc-2a > .c-column:hover,
.p-profiles-show .profile-content .c-right > .block:hover,
.p-profiles-show .profile-content > .block:not(.cc-2):hover { border-color: var(--bj-ln2); }
/* янтарная кромка сверху */
.p-profiles-show .profile-content > .cc-2 > .c-left::before,
.p-profiles-show .profile-content .c-right > .cc-2a > .c-column::before,
.p-profiles-show .profile-content .c-right > .block::before,
.p-profiles-show .profile-content > .block:not(.cc-2)::before {
  content: "";
  position: absolute;
  left: 20px;
  right: 20px;
  top: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(240, 168, 69, .6), transparent);
  opacity: .5;
  transition: opacity .3s;
}
.p-profiles-show .profile-content > .cc-2 > .c-left:hover::before,
.p-profiles-show .profile-content .c-right > .cc-2a > .c-column:hover::before,
.p-profiles-show .profile-content .c-right > .block:hover::before,
.p-profiles-show .profile-content > .block:not(.cc-2):hover::before { opacity: 1; }
.p-profiles-show .profile-content .c-right > .block { margin-bottom: 0; }
/* появление лесенкой */
.p-profiles-show .profile-head > *,
.p-profiles-show .profile-content > .cc-2 > .c-column,
.p-profiles-show .profile-content > .block:not(.cc-2) { animation: bj-rise .7s var(--bj-ease) both; }
.p-profiles-show .profile-head > .c-brief { animation-delay: .05s; }
.p-profiles-show .profile-head > .c-info { animation-delay: .25s; }
.p-profiles-show .profile-head > .c-history { animation-delay: .35s; }
.p-profiles-show .profile-content > .cc-2 > .c-left { animation-delay: .55s; }
.p-profiles-show .profile-content > .cc-2 > .c-right { animation-delay: .62s; }
.p-profiles-show .profile-content > .block:nth-child(2) { animation-delay: .8s; }
.p-profiles-show .profile-content > .block:nth-child(3) { animation-delay: .9s; }
.p-profiles-show .profile-content > .block:nth-child(4) { animation-delay: 1s; }
```

- [ ] **Step 2: `src/30-pages/profile/banner.css`**

```css
body.p-profiles-show { position: relative; }
/* арт с медленным наездом камеры */
body.p-profiles-show::before {
  content: "";
  position: absolute;
  z-index: 0;
  left: 0;
  right: 0;
  top: 0;
  height: var(--bj-banner-h);
  background: var(--bj-art) center 30% / cover no-repeat;
  pointer-events: none;
  transform-origin: 50% 40%;
  animation: bj-kenburns 26s ease-in-out infinite alternate;
}
/* затемнение к фону + пробегающий блик */
body.p-profiles-show::after {
  content: "";
  position: absolute;
  z-index: 0;
  left: 0;
  right: 0;
  top: 0;
  height: calc(var(--bj-banner-h) + 2px);
  background:
    linear-gradient(180deg, rgba(11, 13, 17, 0) 0%, rgba(11, 13, 17, .05) 45%, rgba(11, 13, 17, .6) 75%, var(--bj-bg) 100%),
    linear-gradient(105deg, transparent 35%, rgba(255, 210, 150, .14) 50%, transparent 65%);
  background-repeat: no-repeat;
  background-size: 100% 100%, 250% 100%;
  pointer-events: none;
  animation: bj-sweep 7s ease-in-out infinite;
}
/* бегущий текст: только заливка, без обводки */
.p-profiles-show .l-page::before {
  content: var(--bj-ghost);
  position: absolute;
  z-index: -1;
  left: 24px;
  top: 250px;
  font: 800 130px/1 var(--bj-font-alt);
  letter-spacing: -2px;
  white-space: nowrap;
  background: linear-gradient(180deg, rgba(240, 168, 69, .30), rgba(240, 168, 69, .04) 85%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  pointer-events: none;
  animation: bj-ghost 14s ease-in-out infinite alternate;
}
```

- [ ] **Step 3: Проверить, что `::before`/`::after` у `body` и `.l-page` не заняты сайтом**

В `/p/profile` выполнить до сборки новой версии (либо закомментировав `banner.css`):

```js
[getComputedStyle(document.body, '::before').content, getComputedStyle(document.body, '::after').content, getComputedStyle(document.querySelector('.l-page'), '::before').content]
```

Expected: `["none", "none", "none"]`. Если какое-то значение не `none`, сообщить об этом в отчёте о задаче и перенести эффект на свободный псевдоэлемент: для бегущего текста — `.p-profiles-show .l-page::after`, для блика — второй фон `body::before`.

- [ ] **Step 4: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 14`.

Открыть `/p/profile` при 1440×900, скриншот. Ожидается: арт на всю ширину сверху (480px), лицо персонажа видно, низ растворяется в фоне; в нижней части баннера — полупрозрачные янтарные буквы «BONJOURCHIK» без контуров внутри букв; колонки контента стали карточками. Шапка пока может наезжать на баннер — это исправит Task 9. Горизонтальной прокрутки нет (`document.documentElement.scrollWidth <= innerWidth` → `true`).

- [ ] **Step 5: Commit**

```bash
git add src/30-pages/profile/00-layout.css src/30-pages/profile/banner.css dist/theme.css
git commit -m "Профиль: сетка, карточки, баннер с бегущим текстом

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Профиль — шапка и последние тайтлы

**Files:**
- Create: `src/30-pages/profile/head.css`, `src/30-pages/profile/history.css`

**Interfaces:**
- Consumes: `bj-spin`, `bj-pulse`, `bj-shine`, `bj-ping`.

Разметка: `.profile-head > .c-history.x3 + .c-brief + .c-mobile-actions + .c-info`; `.c-brief > .avatar > img (+ .profile-actions > a.* для залогиненных)` и `header.head.misc > h1 + div.misc > span + div.notice > span`; `.c-info > .c-lists-info > .b-stats_bar.anime|.manga > a.title + .bar + .stat_names`. История: `.c-history > .subheadline + div > .entry > a > (.image-name > picture + span.title) + span.misc + time.misc.date`.

- [ ] **Step 1: `src/30-pages/profile/head.css`**

```css
.p-profiles-show .profile-head {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  grid-template-areas: "brief info" "hist hist";
  align-items: end;
  gap: 24px;
  margin-top: 250px;
}
.p-profiles-show .profile-head > .c-brief,
.p-profiles-show .profile-head > .c-info,
.p-profiles-show .profile-head > .c-history {
  float: none;
  width: auto;
  margin: 0;
}
.p-profiles-show .profile-head > .c-mobile-actions { grid-column: 1 / -1; }
.p-profiles-show .profile-head > .c-brief {
  grid-area: brief;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  min-width: 0;
}
/* аватар с вращающимся кольцом */
.p-profiles-show .c-brief .avatar {
  position: relative;
  isolation: isolate;
  flex: none;
  float: none;
  width: 136px;
  height: 136px;
  margin: 0;
  padding: 4px;
  border-radius: 50%;
}
.p-profiles-show .c-brief .avatar::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--bj-ac), var(--bj-ac2), transparent 40%, var(--bj-ac) 70%, var(--bj-ac));
  animation: bj-spin 6s linear infinite;
}
.p-profiles-show .c-brief .avatar::after {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -14px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(240, 168, 69, .35), transparent);
  animation: bj-pulse 3s ease-in-out infinite;
}
.p-profiles-show .c-brief .avatar img {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 4px solid var(--bj-bg);
  border-radius: 50%;
  transition: transform .5s var(--bj-ease);
}
.p-profiles-show .c-brief .avatar:hover img { transform: scale(1.06) rotate(-3deg); }
/* кнопки действий (видны залогиненным) — под ником */
.p-profiles-show .c-brief .avatar .profile-actions {
  position: absolute;
  z-index: 2;
  left: calc(100% + 24px);
  bottom: 0;
  display: flex;
  gap: 6px;
  width: max-content;
  margin: 0;
}
.p-profiles-show .c-brief:has(.profile-actions) header.head { padding-bottom: 46px; }
.p-profiles-show .profile-actions > a {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 10px;
  color: var(--bj-tx2);
  transition: background-color .25s, color .25s, transform .25s var(--bj-ease), box-shadow .25s;
}
.p-profiles-show .profile-actions > a:hover {
  background: var(--bj-ac);
  color: var(--bj-on-ac);
  box-shadow: 0 6px 16px rgba(240, 168, 69, .35);
  transform: translateY(-2px) rotate(-6deg);
}
/* ник, статус, инфо */
.p-profiles-show .c-brief header.head {
  min-width: 0;
  margin: 0;
  padding: 0;
  background: none;
}
.p-profiles-show .c-brief header.head h1 {
  margin: 0;
  overflow: hidden;
  font: 800 38px/1.05 var(--bj-font-alt);
  letter-spacing: -.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(100deg, #fff 0%, #fff 38%, var(--bj-ac) 50%, #fff 62%, #fff 100%);
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 14px rgba(0, 0, 0, .55));
  animation: bj-shine 5s ease-in-out infinite;
}
.p-profiles-show .c-brief header.head .misc {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  color: var(--bj-mu);
  font-size: 11.5px;
}
.p-profiles-show .c-brief header.head .misc::before {
  content: "";
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--bj-ok);
  animation: bj-ping 2s ease-out infinite;
}
.p-profiles-show .c-brief header.head .notice {
  margin-top: 6px;
  color: var(--bj-tx2);
  font-size: 12.5px;
}
/* карточка списков «стеклом» поверх баннера */
.p-profiles-show .profile-head > .c-info {
  grid-area: info;
  padding: 18px 20px;
  background: rgba(20, 23, 29, .62);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid var(--bj-ln);
  border-radius: var(--bj-r);
}
.p-profiles-show .c-lists-info .b-stats_bar + .b-stats_bar { margin-top: 14px; }
.p-profiles-show .c-lists-info .b-stats_bar > .title {
  color: var(--bj-tx);
  font: 600 10.5px/1 var(--bj-font-alt);
  letter-spacing: 1.4px;
  text-transform: uppercase;
}
.p-profiles-show .c-info .c-additionals { margin-top: 12px; color: var(--bj-mu); font-size: 11.5px; }
```

- [ ] **Step 2: `src/30-pages/profile/history.css`**

```css
.p-profiles-show .profile-head > .c-history { grid-area: hist; }
.p-profiles-show .c-history > .subheadline { display: none; }
.p-profiles-show .c-history > div:not(.subheadline) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.p-profiles-show .c-history .entry {
  float: none;
  width: auto;
  margin: 0;
}
.p-profiles-show .c-history .entry > a {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
  height: 100%;
  padding: 9px;
  background: var(--bj-sf);
  border: 1px solid var(--bj-ln);
  border-radius: 14px;
  color: var(--bj-tx2);
  transition: transform .35s var(--bj-ease), border-color .35s, box-shadow .35s;
}
.p-profiles-show .c-history .entry > a:hover {
  border-color: rgba(240, 168, 69, .5);
  box-shadow: 0 12px 26px rgba(0, 0, 0, .4);
  transform: translateY(-3px);
}
.p-profiles-show .c-history .entry .image-name { display: contents; }
.p-profiles-show .c-history .entry picture {
  grid-row: 1 / span 3;
  display: block;
  width: 36px;
  height: 50px;
  overflow: hidden;
  border-radius: 7px;
}
.p-profiles-show .c-history .entry picture img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.p-profiles-show .c-history .entry .title {
  grid-column: 2;
  display: -webkit-box;
  overflow: hidden;
  color: var(--bj-tx2);
  font-size: 12px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.p-profiles-show .c-history .entry .misc {
  grid-column: 2;
  margin: 2px 0 0;
  color: var(--bj-ac);
  font-size: 10.5px;
  text-align: left;
  animation: none;
}
.p-profiles-show .c-history .entry time.misc { color: var(--bj-mu); margin-top: 0; }
```

- [ ] **Step 3: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 16`.

Открыть `/p/profile` при 1440×900 и положить рядом `design/mockup-profile.html` (открыть файл во второй вкладке). Сравнить скриншоты шапки. Ожидается совпадение по сути: аватар 136px с вращающимся кольцом и ореолом; ник Unbounded с переливом; зелёная пульсирующая точка перед статусом; справа — «стеклянная» карточка «Список аниме / Список манги»; ниже — три карточки последних тайтлов с постером, названием, действием янтарём и датой.

Если снимок профиля сделан без `.c-history` (сайт показывает историю не всем), написать об этом в отчёте о задаче: сетка работает и без неё, область `hist` останется пустой.

- [ ] **Step 4: Commit**

```bash
git add src/30-pages/profile/head.css src/30-pages/profile/history.css dist/theme.css
git commit -m "Профиль: шапка с аватаром, ником, карточкой списков и история

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Профиль — статистика и график активности

**Files:**
- Create: `src/30-pages/profile/stats.css`

**Interfaces:**
- Consumes: `bj-fill-x`, `bj-grow-y`, `bj-bar-glint`, `bj-blink`; задержки столбиков — из `generateRules()` (Task 1).

Разметка: `.b-stats_bar > .bar > .first|.second|.third` (ширина — инлайн-стилем, внутри текст-число), `.stat_names > .stat_name[data-type] > a > .size`. Время: `.lifetime.b-stats_bar > .title > .value.b-tooltipped.dotted + .label`, `.bar > .cuts + .first + .third`, `.times > .time(.checked)`. Активность: `.activity > .title + .graph.x26 + .graph.x34` (видна одна), `.graph > .line > .x_label + .bar-container > .bar.sN > .value.mini`.

- [ ] **Step 1: `src/30-pages/profile/stats.css`**

```css
/* полосы списков */
.p-profiles-show .b-stats_bar .bar {
  position: relative;
  display: flex;
  gap: 2px;
  height: 7px;
  margin: 6px 0 4px;
  overflow: hidden;
  background: var(--bj-sf3);
  border-radius: 4px;
  font-size: 0;
  line-height: 0;
}
.p-profiles-show .b-stats_bar .bar > .first,
.p-profiles-show .b-stats_bar .bar > .second,
.p-profiles-show .b-stats_bar .bar > .third {
  height: 100%;
  border-radius: 0;
  transform-origin: left;
  animation: bj-fill-x 1.4s .5s var(--bj-ease) both;
}
.p-profiles-show .b-stats_bar .bar > .first {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, var(--bj-ac2), var(--bj-ac));
}
.p-profiles-show .b-stats_bar .bar > .first::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .45), transparent);
  transform: translateX(-100%);
  animation: bj-bar-glint 3s 2s ease-in-out infinite;
}
.p-profiles-show .b-stats_bar .bar > .second { background: #8a6a3c; }
.p-profiles-show .b-stats_bar .bar > .third { background: var(--bj-warn); }
.p-profiles-show .b-stats_bar .stat_names {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  color: var(--bj-mu);
  font-size: 11px;
}
.p-profiles-show .b-stats_bar .stat_names .stat_name { float: none; margin: 0; }
.p-profiles-show .b-stats_bar .stat_names a { color: var(--bj-mu); }
.p-profiles-show .b-stats_bar .stat_names a:hover { color: var(--bj-ac); }
.p-profiles-show .b-stats_bar .stat_names .size { color: var(--bj-tx2); }

/* время за аниме */
.p-profiles-show .lifetime .title {
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
}
.p-profiles-show .lifetime .title .label,
.p-profiles-show .activity > .title {
  color: var(--bj-tx);
  font: 600 10.5px/1 var(--bj-font-alt);
  letter-spacing: 1.6px;
  text-transform: uppercase;
}
.p-profiles-show .lifetime .title .label::before,
.p-profiles-show .activity > .title::before {
  content: "";
  display: inline-block;
  vertical-align: middle;
  width: 7px;
  height: 7px;
  margin: -2px 10px 0 0;
  border-radius: 2px;
  background: var(--bj-ac);
  box-shadow: 0 0 10px var(--bj-ac);
  transform: rotate(45deg);
  animation: bj-blink 2.6s ease-in-out infinite;
}
.p-profiles-show .lifetime .title .value {
  border: 0;
  color: var(--bj-ac);
  font: 700 26px/1.1 var(--bj-font-alt);
}
.p-profiles-show .lifetime .bar { height: 8px; margin-top: 12px; }
.p-profiles-show .lifetime .bar .cuts { display: none; }
.p-profiles-show .lifetime .bar > .third { background: transparent; }
.p-profiles-show .lifetime .times {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  color: var(--bj-mu);
  font-size: 10.5px;
}
.p-profiles-show .lifetime .times .time {
  float: none;
  width: auto;
  color: var(--bj-mu);
}
.p-profiles-show .lifetime .times .time.checked { color: var(--bj-ac); }
.p-profiles-show .lifetime .times .time.checked::before { content: "✓ "; }

/* график активности */
.p-profiles-show .activity { margin-top: 24px; }
.p-profiles-show .activity > .title { margin-bottom: 14px; }
.p-profiles-show .activity .graph .line .bar-container .bar {
  background: linear-gradient(180deg, var(--bj-ac), rgba(240, 168, 69, .25));
  border-radius: 5px 5px 0 0;
  transform-origin: bottom;
  animation: bj-grow-y 1s var(--bj-ease) both;
  transition: filter .2s;
}
.p-profiles-show .activity .graph .line .bar-container .bar:hover {
  filter: brightness(1.3) drop-shadow(0 0 8px rgba(240, 168, 69, .6));
}
.p-profiles-show .activity .graph .line .bar-container .bar .value { color: var(--bj-tx2); }
.p-profiles-show .activity .graph .x_label { color: var(--bj-mu); font-size: 10px; }
```

- [ ] **Step 2: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 17`.

Открыть `/p/profile`, сразу после загрузки сделать скриншот и ещё один через 3 секунды (`computer` с `action: "wait", duration: 3`). Ожидается: полосы заливаются слева направо; по основной янтарной полосе пробегает блик; «6 месяцев и 2 недели» — крупно, Unbounded, янтарём, над ним заголовок с ромбом; отметки «✓ 1 неделя…» янтарные; столбики графика вырастают лесенкой.

Если график не отрисовался в предпросмотре (он строится JavaScript'ом сайта, а скрипты в снимке могут не выполниться), отметить в отчёте о задаче: график проверяется в Task 13 на живом сайте.

- [ ] **Step 3: Commit**

```bash
git add src/30-pages/profile/stats.css dist/theme.css
git commit -m "Профиль: полосы списков, время за аниме, график активности

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Профиль — избранное и достижения с превью

**Files:**
- Create: `src/30-pages/profile/favourites.css`, `src/30-pages/profile/achievements.css`

**Interfaces:**
- Consumes: `--bj-p` из сгенерированных правил `[data-progress="N"]` и текст значков `.b-achievement.level-N .c-image::after` (Task 1); эффекты `.image-decor` из `posters.css` (Task 6).

Разметка избранного: `.cc-favourites > article.c-column.b-catalog_entry.c-anime|.c-character > a.cover > span.image-decor > span.image-cutter > picture` + `span.misc`. Достижения: `.block.achievements > .subheadline + .cc-2 > .c-column ×4`; в колонке `.header > .title (+ a.size)` и `.cc-achievements > .b-achievement.is-badge.level-N[data-progress][data-title][data-hint] > .c-image > .inner > a > .border[style=border-color] + img`; франшизы — `.cc-franchises > a.b-badge.level-N > img`; авторы — `.cc-authors > .b-achievement…`.

Распределение псевдоэлементов карточки достижения: `.b-achievement::after` — заголовок, `::before` — описание; `.c-image::before` — заливка прогресса, `::after` — значок уровня; `.inner::before` — затемнение, `::after` — дорожка прогресса.

- [ ] **Step 1: `src/30-pages/profile/favourites.css`**

```css
.p-profiles-show .cc-favourites {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 10px;
  perspective: 600px;
}
.p-profiles-show .cc-favourites > .c-column {
  float: none;
  width: auto !important;
  margin: 0 !important;
}
.p-profiles-show .cc-favourites .cover .misc { display: none; }
.p-profiles-show .cc-favourites .image-decor { aspect-ratio: 2 / 3; }
.p-profiles-show .cc-favourites .image-cutter,
.p-profiles-show .cc-favourites picture,
.p-profiles-show .cc-favourites img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.p-profiles-show .cc-favourites .cover:hover .image-decor {
  z-index: 2;
  transform: translateY(-6px) rotateX(6deg) scale(1.06);
}
.p-profiles-show .cc-friends .b-nothing_here,
.p-profiles-show .b-clubs .b-nothing_here { margin: 0; }
.p-profiles-show .cc-friends img,
.p-profiles-show .b-clubs img {
  border-radius: 50%;
  transition: transform .3s var(--bj-ease);
}
.p-profiles-show .cc-friends a:hover img,
.p-profiles-show .b-clubs a:hover img { transform: scale(1.1); }
```

- [ ] **Step 2: `src/30-pages/profile/achievements.css`**

```css
.p-profiles-show .achievements .cc-2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px 22px;
}
.p-profiles-show .achievements .cc-2 > .c-column {
  float: none;
  width: auto;
  margin: 0;
}
.p-profiles-show .achievements .header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}
.p-profiles-show .achievements .header .title {
  color: var(--bj-mu);
  font: 500 10px/1.2 var(--bj-font-alt);
  letter-spacing: 1.4px;
  text-transform: uppercase;
}
.p-profiles-show .achievements .header .size { color: var(--bj-mu); font-size: 11.5px; }
.p-profiles-show .achievements .header .size:hover { color: var(--bj-ac); }

/* квадратные карточки с превью */
.p-profiles-show .cc-achievements {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.p-profiles-show .cc-achievements .b-achievement {
  position: relative;
  float: none;
  width: auto;
  margin: 0;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--bj-sf2);
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .06);
  cursor: pointer;
  transition: transform .45s var(--bj-ease), box-shadow .45s var(--bj-ease);
}
.p-profiles-show .cc-achievements .b-achievement .c-image,
.p-profiles-show .cc-achievements .b-achievement .inner,
.p-profiles-show .cc-achievements .b-achievement .inner > a {
  position: absolute;
  inset: 0;
  display: block;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
}
.p-profiles-show .cc-achievements .b-achievement img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.9);
  transition: transform .6s var(--bj-ease), filter .4s;
}
.p-profiles-show .cc-achievements .b-achievement .border {
  position: absolute;
  z-index: 3;
  inset: 0;
  border-width: 2px;
  border-style: solid;
  border-radius: inherit;
  opacity: .55;
  pointer-events: none;
  transition: opacity .3s;
}
.p-profiles-show .cc-achievements .b-achievement .inner::before {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(180deg, transparent 35%, rgba(11, 13, 17, .92));
  pointer-events: none;
}
/* заголовок и описание из data-атрибутов */
.p-profiles-show .cc-achievements .b-achievement::after,
.p-profiles-show .cc-achievements .b-achievement::before {
  position: absolute;
  z-index: 2;
  left: 9px;
  right: 9px;
  bottom: 17px;
  line-height: 1.2;
  pointer-events: none;
  transition: transform .35s var(--bj-ease), opacity .35s var(--bj-ease);
}
.p-profiles-show .cc-achievements .b-achievement::after {
  content: attr(data-title);
  color: #fff;
  font: 600 11px/1.2 var(--bj-font);
  text-shadow: 0 1px 4px #000;
}
.p-profiles-show .cc-achievements .b-achievement::before {
  content: attr(data-hint);
  color: var(--bj-tx2);
  font-size: 10px;
  opacity: 0;
  transform: translateY(6px);
}
/* прогресс: дорожка + заливка */
.p-profiles-show .cc-achievements .b-achievement .inner::after {
  content: "";
  position: absolute;
  z-index: 2;
  left: 9px;
  right: 9px;
  bottom: 8px;
  height: 3px;
  background: rgba(255, 255, 255, .15);
  border-radius: 2px;
}
.p-profiles-show .cc-achievements .b-achievement .c-image::before {
  content: "";
  position: absolute;
  z-index: 3;
  left: 9px;
  bottom: 8px;
  width: calc((100% - 18px) * var(--bj-p, 0));
  height: 3px;
  background: var(--bj-ac);
  border-radius: 2px;
  box-shadow: 0 0 6px var(--bj-ac);
  transform-origin: left;
  animation: bj-fill-x 1.2s .8s var(--bj-ease) both;
}
/* значок уровня (текст — из сгенерированных правил) */
.p-profiles-show .cc-achievements .b-achievement .c-image::after {
  position: absolute;
  z-index: 4;
  top: 7px;
  right: 7px;
  padding: 4px 6px;
  background: rgba(11, 13, 17, .7);
  border-radius: 6px;
  color: var(--bj-ac);
  font: 700 10px/1 var(--bj-font-alt);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
/* наведение */
.p-profiles-show .cc-achievements .b-achievement:hover {
  z-index: 2;
  box-shadow: 0 14px 30px rgba(0, 0, 0, .5), 0 0 22px rgba(240, 168, 69, .35);
  transform: translateY(-4px) scale(1.04);
}
.p-profiles-show .cc-achievements .b-achievement:hover img { filter: saturate(1.15); transform: scale(1.15); }
.p-profiles-show .cc-achievements .b-achievement:hover .border { opacity: 1; }
.p-profiles-show .cc-achievements .b-achievement:hover::after { transform: translateY(-14px); }
.p-profiles-show .cc-achievements .b-achievement:hover::before { opacity: 1; transform: none; }

/* франшизы и авторы — круглые значки */
.p-profiles-show .cc-franchises,
.p-profiles-show .cc-authors {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.p-profiles-show .cc-franchises .b-badge,
.p-profiles-show .cc-authors .b-achievement {
  position: relative;
  float: none;
  width: 46px;
  height: 46px;
  margin: 0;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--bj-bg), 0 0 0 3px var(--bj-ln2);
  transition: transform .35s var(--bj-ease), box-shadow .35s var(--bj-ease);
}
.p-profiles-show .cc-authors .b-achievement .c-image,
.p-profiles-show .cc-authors .b-achievement .inner,
.p-profiles-show .cc-authors .b-achievement .inner > a {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  margin: 0;
}
.p-profiles-show .cc-authors .b-achievement::before,
.p-profiles-show .cc-authors .b-achievement::after,
.p-profiles-show .cc-authors .b-achievement .c-image::before,
.p-profiles-show .cc-authors .b-achievement .c-image::after,
.p-profiles-show .cc-authors .b-achievement .border { display: none; }
.p-profiles-show .cc-franchises .b-badge img,
.p-profiles-show .cc-authors .b-achievement img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.p-profiles-show .cc-franchises .b-badge:hover,
.p-profiles-show .cc-authors .b-achievement:hover {
  box-shadow: 0 0 0 2px var(--bj-bg), 0 0 0 3px var(--bj-ac), 0 8px 18px rgba(240, 168, 69, .35);
  transform: translateY(-4px) scale(1.15);
}
```

- [ ] **Step 3: Проверить, что сайт не занимает псевдоэлементы карточки достижения**

До сборки с `achievements.css` выполнить в `/p/profile`:

```js
(() => {
  const a = document.querySelector('.cc-achievements .b-achievement');
  const ci = a.querySelector('.c-image');
  const inner = a.querySelector('.inner');
  return [[a, '::before'], [a, '::after'], [ci, '::before'], [ci, '::after'], [inner, '::before'], [inner, '::after']]
    .map(([el, p]) => getComputedStyle(el, p).content);
})()
```

Expected: шесть значений `"none"`. Если где-то не `none`, в отчёте о задаче указать, какой псевдоэлемент занят. Перенести эффект на свободный: заголовок или описание — на `.inner > a::before` / `::after`, затемнение — на `box-shadow: inset 0 -60px 40px -10px rgba(11, 13, 17, .92)` у `.inner`.

- [ ] **Step 4: Собрать и проверить**

Run: `npm run build`
Expected: `✓ … файлов: 19`.

Открыть `/p/profile`, прокрутить к достижениям (`javascript_tool`: `document.querySelector('.achievements').scrollIntoView()`), скриншот. Затем навести курсор на первую карточку (`computer` → `hover` по координатам со скриншота) и сделать ещё один скриншот. Ожидается:
- «Общие» и «Жанровые» — по 4 квадратные карточки с картинкой, рамкой своего цвета, значком уровня в углу, названием и янтарной полосой прогресса снизу;
- при наведении карточка поднимается и светится, картинка увеличивается, название уезжает вверх, появляется описание;
- франшизы и авторы — ряды круглых значков, которые подпрыгивают при наведении;
- избранное — сетка постеров 2:3 без подписей; при наведении постер поднимается с наклоном и бликом.

Проверить значения прогресса: `getComputedStyle(document.querySelector('.cc-achievements .b-achievement')).getPropertyValue('--bj-p')` → число от 0 до 1 (например `0.41`).

- [ ] **Step 5: Commit**

```bash
git add src/30-pages/profile/favourites.css src/30-pages/profile/achievements.css dist/theme.css
git commit -m "Профиль: избранное и достижения с превью, прогрессом и уровнями

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: «О себе», мобильный профиль, приёмка этапа 2

**Files:**
- Create: `src/30-pages/profile/about.css`, `about/about.bb`
- Modify: `src/50-mobile.css` (дописать профильные правила)

**Interfaces:**
- Produces: классы BB-кода `bj-cards`, `bj-card`, `bj-card-title`, `bj-top`, `bj-links`. Сайт превращает `[div=класс]` в `<div class="класс" data-div>`.

- [ ] **Step 1: `about/about.bb`** — черновик. **Тексты и топ-3 перед публикацией согласовать с пользователем**: ID тайтлов 185, 1575 и 431 — это Initial D First Stage, Code Geass и «Ходячий замок» из его избранного.

```
[div=bj-cards]
[div=bj-card]
[div=bj-card-title]Привет[/div]
Здесь мой список, любимое и немного статистики. Если хочешь посоветовать тайтл — пиши в личку.
[/div]
[div=bj-card]
[div=bj-card-title]Топ-3[/div]
[div=bj-top][animes ids=185,1575,431 columns=3][/div]
[/div]
[div=bj-card]
[div=bj-card-title]Ссылки[/div]
[div=bj-links][url=https://bonjourchik.ru]bonjourchik.ru[/url][url=https://shikimori.io/Bonjourchik/list/anime]Список аниме[/url][/div]
[/div]
[/div]
```

- [ ] **Step 2: `src/30-pages/profile/about.css`**

```css
.p-profiles-show .about.block .bj-cards {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 12px;
}
.p-profiles-show .about.block .bj-card {
  position: relative;
  overflow: hidden;
  padding: 16px;
  background: var(--bj-sf2);
  border: 1px solid var(--bj-ln);
  border-radius: 14px;
  color: var(--bj-tx2);
  line-height: 1.6;
  transition: transform .4s var(--bj-ease), border-color .4s;
}
.p-profiles-show .about.block .bj-card::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -60px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(240, 168, 69, .18), transparent);
  pointer-events: none;
  transition: transform .5s var(--bj-ease);
}
.p-profiles-show .about.block .bj-card:hover {
  border-color: rgba(240, 168, 69, .4);
  transform: translateY(-3px);
}
.p-profiles-show .about.block .bj-card:hover::after { transform: scale(1.6); }
.p-profiles-show .about.block .bj-card-title {
  margin-bottom: 10px;
  color: var(--bj-ac);
  font: 600 10px/1.2 var(--bj-font-alt);
  letter-spacing: 1.4px;
  text-transform: uppercase;
}
/* топ-3: постеры из [animes] с номерами */
.p-profiles-show .about.block .bj-top { counter-reset: bj-top; }
.p-profiles-show .about.block .bj-top > * {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.p-profiles-show .about.block .bj-top .b-catalog_entry {
  position: relative;
  float: none;
  width: 56px !important;
  margin: 0 !important;
  counter-increment: bj-top;
}
.p-profiles-show .about.block .bj-top .b-catalog_entry::before {
  content: counter(bj-top);
  position: absolute;
  z-index: 3;
  left: -7px;
  top: -7px;
  width: 22px;
  height: 22px;
  background: var(--bj-ac);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--bj-sf2);
  color: var(--bj-on-ac);
  font: 800 11px/22px var(--bj-font-alt);
  text-align: center;
}
.p-profiles-show .about.block .bj-top .b-catalog_entry .title,
.p-profiles-show .about.block .bj-top .b-catalog_entry .misc { display: none; }
.p-profiles-show .about.block .bj-top .b-catalog_entry .cover:hover .image-decor { transform: rotate(-4deg) scale(1.08); }
/* ссылки */
.p-profiles-show .about.block .bj-links a {
  display: block;
  padding: 6px 0;
  border-bottom: 1px solid var(--bj-ln);
  color: var(--bj-ac);
  transition: color .25s, padding-left .35s var(--bj-ease);
}
.p-profiles-show .about.block .bj-links a:last-child { border-bottom: 0; }
.p-profiles-show .about.block .bj-links a:hover {
  color: var(--bj-ac-h);
  padding-left: 6px;
}
```

- [ ] **Step 3: Дописать в конец `src/50-mobile.css`**

```css
@media (max-width: 1023px) {
  body.p-profiles-show { --bj-banner-h: 240px; }
  body.p-profiles-show::before,
  body.p-profiles-show::after { animation: none; }
  .p-profiles-show .l-page::before { display: none; }
  .p-profiles-show .profile-head {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "brief" "info" "hist";
    gap: 16px;
    margin-top: 130px;
  }
  .p-profiles-show .profile-head > .c-brief { gap: 16px; }
  .p-profiles-show .c-brief .avatar { width: 96px; height: 96px; padding: 3px; }
  .p-profiles-show .c-brief header.head h1 { font-size: 26px; }
  .p-profiles-show .c-history > div:not(.subheadline) { grid-template-columns: minmax(0, 1fr); }
  .p-profiles-show .profile-content > .cc-2 { grid-template-columns: minmax(0, 1fr); }
  .p-profiles-show .cc-favourites { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .p-profiles-show .achievements .cc-2 { grid-template-columns: minmax(0, 1fr); }
  .p-profiles-show .cc-achievements { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .p-profiles-show .about.block .bj-cards { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 480px) {
  .p-profiles-show .profile-content .c-right > .cc-2a { grid-template-columns: minmax(0, 1fr); }
  .p-profiles-show .cc-favourites { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .p-profiles-show .cc-achievements { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

- [ ] **Step 4: Собрать**

Run: `npm run build`
Expected: `✓ … файлов: 20`.

- [ ] **Step 5: Проверить «О себе» на сгенерированной разметке**

В снимке профиля блока «О себе» нет (поле пустое). Вставить разметку, которую сайт сделает из `about/about.bb`, прямо в открытую страницу `/p/profile` через `javascript_tool`:

```js
(() => {
  const block = document.createElement('div');
  block.className = 'about block';
  block.innerHTML = `<div class="subheadline">О себе</div>
<div class="bj-cards" data-div>
<div class="bj-card" data-div><div class="bj-card-title" data-div>Привет</div>Здесь мой список, любимое и немного статистики.</div>
<div class="bj-card" data-div><div class="bj-card-title" data-div>Топ-3</div><div class="bj-top" data-div><div class="cc-3a">${[...document.querySelectorAll('.cc-favourites .b-catalog_entry')].slice(0, 3).map((e) => e.outerHTML).join('')}</div></div></div>
<div class="bj-card" data-div><div class="bj-card-title" data-div>Ссылки</div><div class="bj-links" data-div><a href="https://bonjourchik.ru">bonjourchik.ru</a><a href="/Bonjourchik/list/anime">Список аниме</a></div></div>
</div>`;
  document.querySelector('.profile-content .achievements').after(block);
  block.scrollIntoView();
  return 'ok';
})()
```

Скриншот. Ожидается: три карточки в ряд — «Привет», «Топ-3» (три постера с янтарными номерами 1–3), «Ссылки» (янтарные ссылки, сдвигаются при наведении); в углу каждой карточки мягкий янтарный блик.

Настоящая разметка тега `[animes]` проверяется на живом сайте в Task 13.

- [ ] **Step 6: Приёмка профиля по ширинам**

Для ширин 1440, 1024, 768, 375 (`resize_window`; после каждой — перезагрузка `/p/profile`) сделать скриншоты всей страницы и выполнить `tools/audit.js`. Expected:
- 1440 — совпадает с `design/mockup-profile.html`;
- 1024 — ничего не наезжает, карточка списков не выходит за край;
- 768 и 375 — баннер 240px без анимации, шапка в одну колонку, избранное в 4 и 3 колонки, достижения в 3 и 2;
- аудит пустой, `document.documentElement.scrollWidth <= innerWidth` → `true` на всех ширинах.

После проверки вернуть `preset: "desktop"`.

- [ ] **Step 7: Прогнать тесты и закоммитить**

Run: `npm test`
Expected: PASS, 20 тестов.

```bash
git add src/ about/about.bb dist/theme.css
git commit -m "Профиль: карточки «О себе», мобильная раскладка — этап 2 готов

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Публикация и проверка на живом сайте

**Files:**
- Create: `reference/field-before-2026-09-24.css` (текст даст пользователь)
- Create: `docs/WORKFLOW.md`
- Modify: `AGENTS.md`, `docs/HANDOFF.md`, `docs/BACKLOG.md`, `docs/CONTEXT.md`, `docs/LOG.md`, `docs/SHIKIMORI.md`

Шаги 1–4 и 6 требуют явного подтверждения или действий пользователя. Без его «да» в чате их не выполнять.

- [ ] **Step 1: Бэкап текущего поля**

Попросить пользователя открыть Настройки → «Внешний вид сайта», скопировать всё поле CSS и прислать в чат. Сохранить присланный текст как есть в `reference/field-before-2026-09-24.css`.

- [ ] **Step 2: Согласовать «О себе»**

Показать пользователю `about/about.bb`. Уточнить тексты карточек и тройку тайтлов (ID из ссылок вида `shikimori.io/animes/z185-…` → `185`). Внести правки в файл.

- [ ] **Step 3: Создать публичный репозиторий — только после «да» пользователя**

Предупредить пользователя, что в публичный репозиторий попадут `docs/`, `design/`, `reference/` и `about/`. Спросить подтверждение. После «да»:

```bash
gh repo create Bonjourchik/shiki-theme --public --source . --remote origin --push
```

Expected: `✓ Created repository Bonjourchik/shiki-theme on GitHub` и `✓ Pushed commits`.

- [ ] **Step 4: Убедиться, что файл темы отдаётся**

Run:

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://raw.githubusercontent.com/Bonjourchik/shiki-theme/main/dist/theme.css
```

Expected: `200 <размер dist/theme.css в байтах>`.

- [ ] **Step 5: Передать пользователю текст для поля**

Дать пользователю содержимое `config/field.css` и попросить:
1. заменить им всё поле «Внешний вид сайта» и сохранить;
2. вставить `about/about.bb` в «Профиль» → «О себе» в режиме «Код» и сохранить;
3. написать в чат, когда готово.

Если после сохранения редактор показал «ошибки импорта», значит, сервер Shikimori не скачал файл. Тогда запасной вариант из спецификации (§8): вставить в поле содержимое `dist/theme.css`, а после него — блок `@media all { :root { … } }` из `config/field.css`.

- [ ] **Step 6: Проверить живой профиль гостем**

Открыть `https://shikimori.io/Bonjourchik` в `mcp__Claude_Browser__navigate` (браузер не залогинен, то есть видит ровно то, что гости). Сделать скриншоты на 1440 и 375, прогнать `tools/audit.js`. Проверить:
- `document.getElementById('custom_css').textContent.includes('bj-kenburns')` → `true`;
- график активности отрисован и анимирован;
- «О себе»: три карточки, у «Топ-3» реальные постеры с номерами. Если тег `[animes]` дал другую разметку, снять её (`document.querySelector('.bj-top').innerHTML`) и поправить селекторы в `about.css`; в крайнем случае перейти на `[url=…][img]…[/img][/url]` (§3 спеки).

Для каждой правки: изменить `src/`, `npm run build`, закоммитить, `git push`. Затем пользователь сбрасывает кеш: открывает `https://shikimori.io/tests/reset_styles_cache`, вводит URL импорта из `config/field.css` и отправляет форму. После этого — снова проверка.

- [ ] **Step 7: Записать workflow и обновить память проекта**

Создать `docs/WORKFLOW.md`:

```markdown
# Workflow

## Setup

Node.js 24+. Зависимостей нет, `npm install` не нужен.

## Команды

- `npm test` — тесты сборщика, проверки и предпросмотра (`node:test`).
- `npm run build` — собрать `src/` в `dist/theme.css`; при словах, которые вырезает санитайзер, — ошибка и код 1.
- `npm run snapshot` — скачать страницы из `preview/pages.json` в `preview/snapshots/` (в git не попадают).
- `npm run preview` — http://localhost:5178/, страницы сайта со свежей темой; сборка идёт на каждый запрос.
- `tools/audit.js` — выполнить в браузере на странице предпросмотра: список светлых фонов и тёмного текста.

## Выпуск изменения

1. Правка в `src/` → `npm run build` → проверка в предпросмотре и аудит.
2. `git commit` (вместе с `dist/theme.css`) → `git push`.
3. Сброс кеша импорта: `https://shikimori.io/tests/reset_styles_cache`, URL из `config/field.css`.
4. Проверка живого профиля гостем.

## Поле «Внешний вид сайта»

Содержимое — `config/field.css`. Арт баннера и бегущий текст меняются там, без пересборки.
«О себе» — `about/about.bb`, вставлять в режиме «Код».
```

Обновить:
- `AGENTS.md` → раздел `## Commands`: `npm test`, `npm run build`, `npm run snapshot`, `npm run preview` со ссылкой на `docs/WORKFLOW.md`;
- `docs/HANDOFF.md` → тема опубликована, что проверено вживую, что осталось;
- `docs/BACKLOG.md` → этапы 1–2 в Done, этапы 3–4 в Next;
- `docs/CONTEXT.md` и `docs/SHIKIMORI.md` → всё, что подтвердилось или опроверглось на живом сайте (разметка `[animes]`, поведение импорта с raw.githubusercontent, псевдоэлементы, занятые сайтом);
- `docs/LOG.md` → запись за день с хешами коммитов.

- [ ] **Step 8: Commit и push**

```bash
git add docs/ AGENTS.md reference/
git commit -m "Документация: workflow, состояние после публикации темы

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
