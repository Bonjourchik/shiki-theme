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
