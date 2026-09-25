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
    const amber = bg && bg.r > 200 && bg.g > 120 && bg.g < 210 && bg.b < 130;
    if (bg && bg.a >= 0.5 && !ACCENTS.has(cs.backgroundColor) && !amber && lum(bg) > 0.45) add(`светлый фон: ${describe(el)}`);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const tx = parse(cs.color);
    if (hasText && tx && lum(tx) < 0.12 && effectiveBg(el) < 0.2) add(`тёмный текст: ${describe(el)}`);
  }
  return [...issues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
})()
