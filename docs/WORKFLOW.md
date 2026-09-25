# Workflow

## Setup

Node.js 24+. Зависимостей нет, `npm install` не нужен.

## Команды

- `npm test` — тесты сборщика, проверки, генерации и предпросмотра (`node:test`), в том числе
  проверка, что `dist/theme.css` совпадает со сборкой `src/`.
- `npm run build` — собрать `src/` в `dist/theme.css`. Если в CSS есть то, что вырежет санитайзер
  Shikimori, сборка падает с кодом 1 и `dist/` не обновляется.
- `npm run snapshot` — скачать страницы из `preview/pages.json` в `preview/snapshots/` (в git не попадают).
- `npm run preview` — http://localhost:5178/ — страницы сайта со свежей темой; сборка идёт на каждый запрос.
- `tools/audit.js` — вставить целиком в консоль браузера (или `javascript_tool`) на странице предпросмотра:
  список светлых фонов и тёмного текста. `h1.aliases` на профиле — известный ложный сигнал
  (ник залит градиентом через `background-clip: text`).

## Выпуск изменения

1. Правка в `src/` → `npm run build` → проверка в предпросмотре и аудит.
2. `npm test` → `git commit` (вместе с `dist/theme.css`) → `git push`.
3. Сброс кеша импорта: `https://shikimori.io/tests/reset_styles_cache`, URL из `config/field.css`.
4. Проверка живого профиля гостем (браузер без входа видит стиль владельца).

## Поле «Внешний вид сайта»

Содержимое — `config/field.css`. Арт баннера (`--bj-art`) и бегущий текст (`--bj-ghost`) меняются там,
без пересборки. «О себе» — `about/about.bb`, вставлять в режиме «Код».
