const CUSTOM_CSS_RE = /<style id="custom_css"[^>]*>[\s\S]*?<\/style>/;

export function fieldToPreviewCss(field) {
  return field.replace(/@import[^;]*;\s*/g, '');
}

export function toPreviewUrls(css) {
  return css.replace(/url\(\s*(['"]?)\/\//g, 'url($1https://');
}

// base — куда браузер резолвит относительные адреса снимка; предпросмотр передаёт '/',
// чтобы файлы сайта шли через его прокси (иначе иконочный шрифт режется CORS).
export function injectTheme(html, css, base = 'https://shikimori.io/') {
  const style = `<style id="custom_css">${css}</style>`;
  let out = CUSTOM_CSS_RE.test(html)
    ? html.replace(CUSTOM_CSS_RE, () => style)
    : html.replace('</head>', () => `${style}</head>`);
  if (!/<base\s/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, (tag) => `${tag}<base href="${base}">`);
  }
  return out;
}
