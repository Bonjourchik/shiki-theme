# Session log

Append-only dated journal. Newest entries first. One entry per meaningful
session or task, 3–10 lines. Never rewrite old entries.

To find a period: search by date header, e.g. `rg "## 2026-09" docs/LOG.md`.

Older entries: none archived yet.

## 2026-09-24 — план реализации темы

- What: написан план из 13 задач с готовым кодом сборщика, тестов, предпросмотра и всего CSS.
  Для этого сняты живой DOM профиля, страницы тайтла и комментариев, а также проанализирован
  CSS сайта (светлые фоны и тёмный текст, которые надо перекрыть).
- Files: docs/superpowers/plans/2026-09-24-dark-amber-theme.md, docs/HANDOFF.md, docs/BACKLOG.md.
- Notes: токены — только на `:root`, иначе поле настроек не сможет их переопределить.

## 2026-09-24 — брейнсторм и спецификация темы «Dark Amber»

- What: через визуальные макеты выбраны тёмный минимализм, янтарный акцент, баннер-арт,
  Unbounded + Onest, мобильная версия, карточки «О себе», доставка через GitHub и `@import`.
  Макет профиля прошёл 4 итерации: «скучно» → анимации и превью достижений →
  заливка вместо обводки → баннер выше.
- Files: docs/superpowers/specs/2026-09-24-dark-amber-theme-design.md, design/*, docs/DECISIONS.md, .gitignore.
- Notes: протокольно-относительные `//` url обходят camo — проверено по живому CSS.

## 2026-09-24 — снимок текущего профиля Bonjourchik

- What: изучен живой профиль `shikimori.io/Bonjourchik`: тема Edesign через 5 `@import`,
  своя палитра «Bronze Sunset», фон и обложка с ibb.co, «О себе» пустой.
- Files: docs/CONTEXT.md, docs/HANDOFF.md, docs/BACKLOG.md, AGENTS.md,
  reference/current-user-css-2026-09-24.css.
- Notes: подтверждено вживую, что `@import` с raw.githubusercontent и картинки с ibb работают.

## 2026-09-24 — исследование кастомизации профиля Shikimori

- What: изучены механизм пользовательских стилей и BB-кодов по исходникам
  `shikimori/shikimori` и страницам CSS-club; настроена project memory.
- Files: AGENTS.md, CLAUDE.md, docs/SHIKIMORI.md, docs/CONTEXT.md, docs/BACKLOG.md,
  docs/HANDOFF.md, docs/DECISIONS.md, docs/LOG.md.
- Commits: нет (не git-репозиторий).
- Notes: домен сменился на `shikimori.io`; любое `@media` отключает автообёртку
  `min-width:1024px`; санитайзер вырезает слова `this`/`parent`/`window` и др.
