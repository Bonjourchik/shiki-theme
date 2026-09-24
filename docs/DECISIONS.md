# Decisions

Use this file only for durable product or architecture decisions.
Do not log routine implementation details.

## 2026-09-24 - Своя тема «Dark Amber» с нуля вместо Edesign

- Status: active
- Context: на профиле стоит чужая тема Edesign с палитрой «Bronze Sunset»; пользователь хочет свой дизайн.
- Decision: писать свою тему для всего сайта: тёмный минимализм, янтарный акцент `#f0a845`,
  баннер-арт над шапкой, шрифты Unbounded + Onest, заметные анимации, сразу с мобильной версией.
- Reason: полный контроль над видом; выбор сделан в брейнсторме по визуальным макетам.
- Consequences: работа идёт этапами (фундамент → профиль → подстраницы → остальной сайт).
- Related files: `docs/superpowers/specs/2026-09-24-dark-amber-theme-design.md`, `design/`.

## 2026-09-24 - Доставка через публичный GitHub-репозиторий и @import

- Status: active
- Context: CSS вставляется в поле настроек; Shikimori умеет `@import` (скачивает сервером, кеш 8 ч).
- Decision: собирать `src/` в единый `dist/theme.css` в репозитории `Bonjourchik/shiki-theme`
  и подключать через `raw.githubusercontent.com`. Арт и бегущий текст — переменные в поле.
- Reason: обновления без перевставки поля; модульные исходники; вложенные `@import` сайт вырезает,
  поэтому нужен один собранный файл.
- Consequences: после пуша нужен сброс кеша `/tests/reset_styles_cache`; сборщик обязан
  проверять код на слова, которые вырезает санитайзер.
- Related files: `docs/SHIKIMORI.md`, spec §6–7.

## 2026-09-24 - Все внешние url() — протокольно-относительные `//`

- Status: active
- Context: в скомпилированном CSS живого профиля адреса `//fonts.gstatic.com/…` и `//i.ibb.co/…`
  остаются как есть, их не переписывают на camo-прокси.
- Decision: шрифты и картинки подключать только через `//host/…`; сборщик валит сборку на `url(http…)`.
- Reason: прокси camo ненадёжен для шрифтов и части хостингов.
- Consequences: хостинги должны отдавать ресурсы по https.
- Related files: `tools/build.mjs` (план), `docs/SHIKIMORI.md`.
