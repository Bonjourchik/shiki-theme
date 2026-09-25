import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bj-build-'));
  for (const [name, css] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, css);
  }
  return dir;
}

test('склеивает по порядку путей, убирает комментарии, добавляет сгенерированное', () => {
  const dir = fixture({
    '10-b.css': '/* b */ .b {}',
    '00-a.css': '.a {}',
    '20-c/x.css': '.x {}',
    'note.txt': 'не css',
  });
  const out = path.join(dir, 'dist', 'theme.css');
  const { css, errors, files } = build({ srcDir: dir, outFile: out });
  assert.deepEqual(errors, []);
  assert.equal(files.length, 3);
  assert.ok(css.indexOf('.a {}') < css.indexOf('.b {}'));
  assert.ok(css.indexOf('.b {}') < css.indexOf('.x {}'));
  assert.ok(!css.includes('/*'));
  assert.ok(css.includes('[data-progress="100"]'));
  assert.equal(fs.readFileSync(out, 'utf8'), css);
});

test('при ошибках не пишет файл и называет файл-источник', () => {
  const dir = fixture({ '00-a.css': '.parent {}' });
  const out = path.join(dir, 'dist', 'theme.css');
  const { errors } = build({ srcDir: dir, outFile: out });
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('00-a.css:1:'));
  assert.ok(!fs.existsSync(out));
});

test('dist/theme.css совпадает со сборкой src/ (сайт импортирует именно его)', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { css, errors } = build({ srcDir: path.join(root, 'src') });
  assert.deepEqual(errors, []);
  assert.equal(fs.readFileSync(path.join(root, 'dist', 'theme.css'), 'utf8'), css, 'запустите npm run build');
});
