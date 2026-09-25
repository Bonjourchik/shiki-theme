# Context

## Current project facts

- Цель: красивый дизайн своего профиля на Shikimori. Source: user
- Сайт переехал на `shikimori.io`; `shikimori.one` редиректит 301. Source: docs (проверено 2026-09-24)
- Доставка дизайна — два куска текста: CSS («Внешний вид сайта») и BB-код («О себе»). Source: code
- Гости профиля видят стиль владельца, если сами не отключили стили пользователей. Source: code
- Последний коммит в публичном `shikimori/shikimori` — 2025-01-25 (`a900114`);
  продакшен может отличаться. Source: code
- Детальный справочник — `docs/SHIKIMORI.md`.

## Профиль пользователя

- Профиль: `shikimori.io/Bonjourchik` (user id `859272`). Source: user + live page
- Сейчас стоит тема **Edesign** (`ed-main.github.io`) через 5 `@import` с
  `raw.githubusercontent.com/ed-main/ed-main.github.io/master/cssfiles/`:
  `main_code_1.css`, `main_code_2.css`, `main_code_3.css`, `main_code_4mob.css`,
  `prof_form_over.css`. Итоговый CSS ~430 КБ. Source: live page 2026-09-24
- Своя часть поверх темы — палитра «Bronze Sunset» (CSS-переменные Edesign
  `--white-color`, `--block-color`, … в формате `R, G, B`), фон `body:after` и
  обложка `.profile-head::after` — картинка с ibb.co. Бэкап:
  `reference/current-user-css-2026-09-24.css`.
- Блок «О себе» пустой. Друзей и клубов нет. В избранном: Initial D,
  Code Geass, Howl no Ugoku Shiro; персонажи Рафталия, Рюко Матой, Марин Китагава и др.
- Проверено вживую: `@import` с `raw.githubusercontent.com` и картинки с `i.ibb.co` работают.

## Current assumptions

- Дизайн выбран: «Dark Amber» (см. `docs/DECISIONS.md` и спеку). Source: user
- Пользователь не любит обводку (`-webkit-text-stroke`) у Unbounded: у вариативного шрифта
  видны внутренние перекрывающиеся контуры. Для декоративного текста — только заливка. Source: user
- Пользователь хочет «живой» дизайн: минимализм без анимаций показался ему скучным. Source: user

## Open questions

- Финальный арт для баннера и тексты «О себе».

## Resolved

- Шрифты: `@import` Google CSS не нужен — прямые `@font-face` с `url(//fonts.gstatic.com/…woff2)`
  работают (так делает Edesign, Comfortaa видна на живом профиле). Source: live page

## Gotchas

- `tools/audit.js` видит только отрисованные элементы: выпадающие меню, спойлеры, `:hover` проверять принудительно.
- В предпросмотре иконочный шрифт сайта `shikimori` не грузится (CORS) — вместо иконок прямоугольники; на сайте всё в порядке.

- Любое `@media` в CSS снимает автообёртку `min-width: 1024px` со всего стиля.
- Санитайзер удаляет целые слова `this`, `parent`, `window`, `script` и др. — молча.
- Комментарии вырезаются из итогового CSS.
- `@import` внутри импортированного файла не работает (вырезается).
- На ≤1023px сайт принудительно убирает фон `body`.
- Кеш `@import` — 8 ч; сброс через `/tests/reset_styles_cache`.

## Notes

Source tags: `Source: user`, `Source: code`, `Source: docs`, `Source: inference`, `TODO:`.
