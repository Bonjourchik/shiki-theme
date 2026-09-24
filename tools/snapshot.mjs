import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'preview', 'snapshots');
const pages = JSON.parse(fs.readFileSync(path.join(root, 'preview', 'pages.json'), 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

fs.mkdirSync(outDir, { recursive: true });
for (const { name, url } of pages) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ru' } });
  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status} ${url}`);
    process.exitCode = 1;
    continue;
  }
  const html = await res.text();
  fs.writeFileSync(path.join(outDir, `${name}.html`), html);
  console.log(`✓ ${name}: ${(html.length / 1024).toFixed(0)} КБ`);
}
