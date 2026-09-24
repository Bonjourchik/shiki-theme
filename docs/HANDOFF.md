# Handoff

## Current state

Брейнсторм закончен, дизайн утверждён. Спецификация:
`docs/superpowers/specs/2026-09-24-dark-amber-theme-design.md` — ждёт ревью пользователя.
Утверждённые макеты: `design/mockup-design-system.html`, `design/mockup-profile.html`
(это версия v4 из брейнсторма).

Кода темы пока нет. Локально создан git-репозиторий, удалённого на GitHub нет:
его создание (`Bonjourchik/shiki-theme`, public) требует подтверждения пользователя.
`gh` залогинен под Bonjourchik.

На профиле по-прежнему стоит Edesign + «Bronze Sunset» (бэкап своей части — `reference/`).

## Recently changed

- Спека, решения в `docs/DECISIONS.md`, макеты в `design/`, `.gitignore`.

## Verification

- Проверено на живом профиле: `url(//fonts.gstatic.com/…)` и `url(//i.ibb.co/…)` доходят
  до страницы без camo.
- Макеты проверены скриншотами в браузере.

## Open issues

- Тексты карточек «О себе» — черновик, финал с пользователем.
- Какой арт будет в баннере финально (пока — нынешняя лисодевочка с ibb).

## Next recommended steps

1. Выполнять план `docs/superpowers/plans/2026-09-24-dark-amber-theme.md` (13 задач: сборщик → предпросмотр →
   фундамент → профиль → публикация). Спека пользователем одобрена.
2. Перед первой заменой CSS на сайте сохранить полный текст поля (с `@import` Edesign) в `reference/` (Task 13).

Факты, собранные для плана (живой DOM, 2026-09-24):
- `.l-page` у сайта — `background: white; position: relative; z-index: 1`; меню `.l-top_menu-v2` — `#343434`.
- График активности `.activity .graph` рисует JS сайта: в серверном HTML только `data-stats`.
- Избранное на профиле — смесь `.c-anime` и `.c-character`, выборка может меняться между загрузками.
- Страницы тайтлов открываются по `/animes/z<id>-slug` (например `z185-initial-d-first-stage`).

## Risks and cautions

- Санитайзер молча вырезает запрещённые слова — сборщик обязан это ловить.
- Изменения видны всем гостям профиля сразу после сохранения.
- Не пушить в GitHub и не менять настройки профиля без явного «да» пользователя.
