import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';
import { injectTheme, toPreviewUrls, fieldToPreviewCss } from './lib/inject.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapDir = path.join(root, 'preview', 'snapshots');
const PORT = Number(process.env.PORT || 5178);

const send = (res, status, body, type = 'text/html; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/') {
    const names = fs.existsSync(snapDir)
      ? fs.readdirSync(snapDir).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5))
      : [];
    const links = names.map((n) => `<li><a href="/p/${n}">${n}</a></li>`).join('');
    return send(res, 200, `<h1>Dark Amber preview</h1><ul>${links || '<li>нет снимков — npm run snapshot</li>'}</ul>`);
  }
  const match = url.pathname.match(/^\/p\/([\w-]+)$/);
  if (!match) return send(res, 404, 'not found', 'text/plain; charset=utf-8');
  const file = path.join(snapDir, `${match[1]}.html`);
  if (!fs.existsSync(file)) return send(res, 404, `нет снимка ${match[1]}`, 'text/plain; charset=utf-8');

  const { css, errors } = build({ srcDir: path.join(root, 'src'), outFile: path.join(root, 'dist', 'theme.css') });
  if (errors.length) return send(res, 500, errors.join('\n'), 'text/plain; charset=utf-8');
  const field = fieldToPreviewCss(fs.readFileSync(path.join(root, 'config', 'field.css'), 'utf8'));
  const html = injectTheme(fs.readFileSync(file, 'utf8'), toPreviewUrls(`${css}\n${field}`));
  return send(res, 200, html);
}).listen(PORT, () => console.log(`preview: http://localhost:${PORT}/`));
