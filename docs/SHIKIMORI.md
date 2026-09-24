# Shikimori: как работает кастомизация профиля

Справочник по платформе. Собран 2026-09-24 из исходников Shikimori
(`github.com/shikimori/shikimori`, ветка `master`, коммит `a900114` от 2025-01-25)
и страниц CSS-club. Исходники могут отставать от продакшена — проверять вживую.

Домен сайта сейчас `shikimori.io` (`shikimori.one` отдаёт 301 на `.io`).

## Два канала оформления

| Что | Где вводится | Формат |
|---|---|---|
| CSS | Профиль → Настройки → «Внешний вид сайта» (поле CSS) | CSS + `@import` |
| Разметка | Профиль → Настройки → «Профиль» → «О себе», редактор в режим «Код» | BB-коды, не HTML |

В «Внешнем виде» ещё есть готовые переключатели (они дописывают CSS в то же поле):
«липкое меню», рамка страницы, прозрачность фона `.l-page`, фон `body`.

## Кто видит стиль — `LayoutView#custom_style`

Source: code (`app/view_objects/layout_view.rb`).

1. Если посетитель залогинен и выключил у себя «применять стили пользователей»
   (`preferences.apply_user_styles = false`) — он видит **свой** стиль.
2. Иначе, если на странице есть `@user` (профиль и его подстраницы: список,
   избранное, друзья, клубы, отзывы и т.д.) и профиль не зацензурен/не забанен
   навсегда — все видят **стиль владельца профиля**.
3. Иначе — стиль клуба (на страницах клуба) или стиль самого посетителя.

То есть свой CSS действует на весь сайт для тебя и на твой профиль для гостей.

## Как CSS компилируется — `Styles::Compile`

Source: code (`app/services/styles/compile.rb`).

- **Обёртка media-query.** Весь пользовательский CSS оборачивается в
  `@media only screen and (min-width: 1024px) { ... }` — на экранах <1024px
  стиль не работает. **Исключение:** если в тексте есть хоть одно `@media`,
  обёртка не добавляется вовсе и CSS применяется на всех ширинах.
  Галочка «липкое меню» содержит `@media` → тоже снимает обёртку.
- **`@import`** вырезается из текста, файл скачивается сервером
  (`Styles::Download`, кеш 8 часов, 2 попытки), санитизируется и **инлайнится**
  перед пользовательским CSS. Импортированный CSS в media-query **не** оборачивается.
  Вложенные `@import` внутри импортированного файла вырезаются санитайзером.
  Нужен HTTP 200 и валидный UTF-8, иначе импорт пустой и в редакторе
  показывается «ошибка импорта».
- Компилированный CSS хранится в БД и пересобирается только при сохранении.
  Чтобы подтянуть новую версию импортированного файла раньше 8 ч —
  `shikimori.io/tests/reset_styles_cache` (POST с `url`).
- **`url(http…)` переписываются на camo-прокси** Shikimori. Картинка должна
  быть доступна с их сервера: надёжно — imgur (`i.imgur.com`), ibb.co.
  VK и сомнительные хосты часто не работают.
- **Протокольно-относительные `url(//host/…)` camo не трогает** — они остаются как есть.
  Проверено 2026-09-24 на живом CSS профиля: `//fonts.gstatic.com/…woff2` (шрифт реально
  рендерится) и `//i.ibb.co/…`. Source: live page. Для шрифтов — только так.

## Санитайзер — `Misc::SanitizeEvilCss`

Source: code (`app/services/misc/sanitize_evil_css.rb`). Вырезает (циклом, до стабилизации):

- **все комментарии** `/* ... */` — в итоговый CSS они не попадают;
- **целые слова** (регистр не важен): `eval`, `cookie`, `window`, `parent`, `this`,
  `javascript`, `vbscript`, `script`, `behavior`, `behaviour`, `expression`;
  также `moz-binding`, `@charset`, символ `<`.
  ⚠ Ломает селекторы/`content`/названия анимаций с этими словами:
  класс `.parent`, `content: "this"`, `@keyframes window-glow` и т.п. — не использовать;
- `&#`, управляющие символы, `\` + перевод строки;
- обратные слэши-эскейпы `\xxxx` **вне** `content: "..."` (внутри `content` работают);
- `data:` URI, кроме `data:image/(svg+xml|png|jpeg|jpg|gif);base64,` и
  `data:application/octet-stream;base64,` → SVG встраивать только в base64.

## BB-коды для «О себе»

Source: code (`app/services/bb_codes/tags/*`). Полезные для дизайна:

- `[div=класс1 класс2 data-foo=bar]...[/div]` → `<div class="..." data-foo="bar" data-div>`.
- `[span=класс]...[/span]` → `<span class="..." data-span>`.
- Запрещённые классы вырезаются: всё с префиксом `l-`, `b-feedback`, `b-modal`,
  `b-comments`, `tooltip`, `tooltip-inner`, `expand`, `shade`, `ban`, `mfp-*`,
  `toastify*`, `CodeMirror*` и др. (`BbCodes::CleanupCssClass`).
- Запрещённые data-атрибуты: `data-action`, `data-remote`, `data-method`.
- Прочее: `[b] [i] [u] [s] [center] [right] [size=N] [color=#hex] [url=...]`,
  `[img]`, `[image=ID]`, `[poster]`, `[spoiler=Заголовок]`, `[spoiler_v1=...]`,
  `[quote]`, `[hr]`, `[h3]`, `[list]`, `[animes ids=1,2 columns=N]`,
  `[mangas ...]`, `[characters ...]`, `[video]`, `[html5_video]`.
- Своего JS нет. Интерактив — CSS-псевдоклассы (`:hover` и т.п.) и штатные
  спойлеры сайта (`[spoiler]` раскрывается кликом). Тегов `input`/`label` нет,
  поэтому трюки с `:checked` недоступны. Source: inference — как устроены
  «вкладки» у `Chortowod/Shikimori`, TODO: verify.

## Структура страницы профиля

Source: code (`app/views/profiles/show.html.slim`, `layout_view.rb`).

- `body#profiles_show.p-profiles.p-profiles-show.x1200` — id = `контроллер_экшен`,
  классы = `p-контроллер`, `p-контроллер-экшен`, ширина `x1200` (настройка пользователя).
- Подстраницы профиля: `body.p-profiles-favorites`, `.p-profiles-friends`, и т.п.
- Шапка: `.profile-head[data-user-id]` → `.c-brief` → `.avatar img` (160px),
  `.profile-actions > a.(mail|settings|ban|talk|fav-add|...)`,
  `header.head.misc h1` (ник), `.notice span` (инфо), `.c-info .c-lists-info`
  (полосы `.b-stats_bar`), `.c-additionals` (активность, `div[data-type=...]`).
- Контент: `.profile-content` → `.cc-2.block` → `.c-column.c-left`
  (`.lifetime.b-stats_bar`, `.bar .first/.third`, `.times .time.checked`, активность)
  и `.c-column.c-right` (`.cc-friends`, `.b-clubs`, `.cc-favourites`).
- Дальше: достижения `.achievements`, «О себе» `.about.block` (`.subheadline`,
  затем разметка из BB-кодов), лента комментариев.
- Общие: `.l-top_menu-v2` (меню), `.l-page` (центральная колонка), `.l-footer`,
  `.subheadline`, `.b-feedback` (кнопка «ошибка» — удобный якорь для `::after`,
  не скрывать).

## Переменные и брейкпоинты сайта

Source: code (`app/assets/stylesheets/globals.scss`, `application.sass`).

- `:root`: `--font-main`, `--font-alt`, `--font-code`, `--font-size-base-desktop: 13px`,
  `--font-size-base-mobile: 13px`, `--top-menu-height: 46px`, `--link-color`,
  `--link-hover-color`, `--link-active-color`, `--headline-color`,
  `--headline-background-color`, `--icon-color` и др.
- Брейкпоинты: iphone ≤767px, ipad ≤1023px, контент 1200px.
- На ≤1023px сайт сам делает `body { background: none !important }`.

## Рекомендации сообщества (форум «Рекомендации по настройке внешнего вида профиля»)

Не делать прозрачной центральную область (текст нечитаем), не использовать
рукописные шрифты для основного текста, не раздувать размеры, не злоупотреблять
яркими цветами, странными курсорами и тяжёлыми GIF.

## Ресурсы

- CSS-club: `shikimori.io/clubs/811-css-club-nastroyka-vneshnego-vida-sayta`
  (страницы «Шаблоны, примеры и всякие фичи», «Список селекторов», «Готовые стили»).
- Сборщики тем: `grin3671.github.io/shiki-theme/`, `ed-main.github.io/`.
- Примеры на GitHub: `Chortowod/Shikimori` (гарем с вкладками, персонаж в углу),
  `SergejVolkov/sergejvolkov-shiki-theme`, `Dedonych/Shikimori-Dark-Theme`,
  тема `github.com/topics/shikimori-css`.
- Популярные приёмы: GIF-аватар через `.profile-head .avatar { background }` +
  `img { visibility: hidden }`; персонаж в углу через
  `.p-profiles-show .b-feedback::after { position: fixed; pointer-events: none }`;
  замена постеров через `custom_posters.min.css` из CSS-club.
