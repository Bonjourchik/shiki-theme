import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCss, stripComments } from './lib/check.mjs';
import { generateRules } from './lib/generate.mjs';

export function collectSources(dir) {
  const out = [];
  const walk = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) out.push(full);
    }
  };
  walk(dir);
  return out;
}

export function build({ srcDir, outFile }) {
  const files = collectSources(srcDir);
  const errors = [];
  const parts = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    errors.push(...checkCss(source, path.relative(srcDir, file).replaceAll('\\', '/')));
    parts.push(source);
  }
  const generated = generateRules();
  errors.push(...checkCss(generated, '<generated>'));

  const css = stripComments(`${parts.join('\n')}\n${generated}`)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  if (errors.length === 0 && outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, css);
  }
  return { css, errors, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { css, errors, files } = build({
    srcDir: path.join(root, 'src'),
    outFile: path.join(root, 'dist', 'theme.css'),
  });
  if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`\n✗ ошибок: ${errors.length}, dist/theme.css не обновлён`);
    process.exit(1);
  }
  console.log(`✓ dist/theme.css — файлов: ${files.length}, ${(Buffer.byteLength(css) / 1024).toFixed(1)} КБ`);
}
