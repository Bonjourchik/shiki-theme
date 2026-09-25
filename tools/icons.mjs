// Генерирует src/20-components/icons.css: собственные линейные иконки шапки вместо шрифта сайта.
// SVG кладутся в CSS как base64 data URI (санитайзер Shikimori пропускает только их) и используются
// как mask — иконка красится цветом текста (currentColor) и перекрашивается при наведении.
// Запуск: node tools/icons.mjs, затем npm run build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  anime: '<rect x="2.5" y="5" width="19" height="13" rx="3"/><path d="m10 8.8 4.8 2.7-4.8 2.7Z"/><path d="M8 21h8"/>',
  top: '<path d="M8 4h8v5.5a4 4 0 0 1-8 0Z"/><path d="M8 6H5.5A2.5 2.5 0 0 0 8 10.5M16 6h2.5A2.5 2.5 0 0 1 16 10.5"/><path d="M12 13.5V17M8.5 20.5h7M10 17h4"/>',
  manga: '<path d="M2.5 5.5H9a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H2.5Z"/><path d="M21.5 5.5H15a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7.5Z"/>',
  ranobe: '<path d="M6 3h8.5L19 7.5V21H6Z"/><path d="M14 3v5h5"/><path d="M9 12.5h7M9 16.5h5"/>',
  clubs: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  collections: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  tierlists: '<rect x="3" y="4" width="18" height="4" rx="1.5"/><rect x="3" y="10" width="13" height="4" rx="1.5"/><rect x="3" y="16" width="8" height="4" rx="1.5"/>',
  pen: '<path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  articles: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 8.5h10M7 12h10M7 15.5h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7l-5.4 2.9 1.1-6-4.5-4.2 6.1-.8Z"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4.5h12l-2.5 4 2.5 4H5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.3 10.9 7.4-3.7M8.3 13.1l7.4 3.7"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="m3 5 1.5 1.5L7 4M3 11l1.5 1.5L7 10M3 17l1.5 1.5L7 16"/>',
  bookmark: '<path d="M6.5 3h11v18L12 17l-5.5 4Z"/>',
  medal: '<circle cx="12" cy="9" r="6"/><path d="M8.6 14 7 22l5-3 5 3-1.6-8"/><path d="m12 6.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3Z"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  rules: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8M12 17h.01"/>',
  logout: '<path d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5"/><path d="m10 8-4 4 4 4M6 12h10"/>',
  burger: '<path d="M4 7h16M4 12h16M4 17h11"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
};

// класс сайта → иконка; селекторы — внутри шапки .l-top_menu-v2
const MAP = {
  'icon-home': 'home', 'icon-anime': 'anime', 'icon-top': 'top', 'icon-manga': 'manga', 'icon-ranobe': 'ranobe',
  'icon-forum': 'chat', 'icon-clubs': 'clubs', 'icon-collections': 'collections', 'icon-tierlists': 'tierlists',
  'icon-critiques': 'pen', 'icon-articles': 'articles', 'icon-users': 'user', 'icon-recommendations': 'star',
  'icon-contests': 'flag', 'icon-calendar': 'calendar', 'icon-info': 'info', 'icon-socials': 'share',
  'icon-moderation': 'shield', 'icon-profile': 'user', 'icon-anime_list': 'list', 'icon-manga_list': 'bookmark',
  'icon-mail': 'mail', 'icon-achievements': 'medal', 'icon-settings': 'sliders', 'icon-site_rules': 'rules',
  'icon-faq': 'help', 'icon-sign_out': 'logout',
};
// круглые кнопки справа и лупа
const BUTTONS = {
  '.menu-icon.forum': 'chat', '.menu-icon.mail': 'mail', '.menu-icon.search': 'search',
  '.menu-icon.trigger': 'burger', '.global-search .search-marker': 'search',
};

const uri = (body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return `url(data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')})`;
};

export function iconsCss() {
  const lines = [
    '/* СГЕНЕРИРОВАНО tools/icons.mjs — не править руками */',
    ':root {',
    ...Object.entries(ICONS).map(([name, body]) => `  --bj-i-${name}: ${uri(body)};`),
    '}',
  ];
  const all = [
    ...Object.keys(MAP).map((c) => `.l-top_menu-v2 .${c}`),
    ...Object.keys(BUTTONS).map((s) => `.l-top_menu-v2 ${s}`),
  ];
  // общий вид: иконка — маска, закрашенная текущим цветом текста
  lines.push(`${all.map((s) => `${s}::before`).join(',\n')} {
  content: "";
  flex: none;
  display: block;
  width: 18px;
  height: 18px;
  background: currentColor;
  -webkit-mask: var(--bj-i) center / contain no-repeat;
  mask: var(--bj-i) center / contain no-repeat;
  font-size: 0;
  line-height: 0;
}`);
  for (const [c, name] of Object.entries(MAP)) lines.push(`.l-top_menu-v2 .${c} { --bj-i: var(--bj-i-${name}); }`);
  for (const [s, name] of Object.entries(BUTTONS)) lines.push(`.l-top_menu-v2 ${s} { --bj-i: var(--bj-i-${name}); }`);
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  fs.writeFileSync(path.join(root, 'src/20-components/icons.css'), iconsCss());
  console.log('✓ src/20-components/icons.css');
}
