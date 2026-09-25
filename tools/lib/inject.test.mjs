import { test } from 'node:test';
import assert from 'node:assert/strict';
import { injectTheme, toPreviewUrls, fieldToPreviewCss } from './inject.mjs';

test('подменяет существующий custom_css', () => {
  const html = '<html><head></head><body><style id="custom_css">old</style></body></html>';
  const out = injectTheme(html, '.new{}');
  assert.ok(out.includes('<style id="custom_css">.new{}</style>'));
  assert.ok(!out.includes('old'));
});

test('вставляет custom_css перед </head>, если его нет', () => {
  const out = injectTheme('<html><head><title>x</title></head><body></body></html>', '.a{}');
  assert.ok(out.includes('<style id="custom_css">.a{}</style></head>'));
});

test('добавляет base href один раз', () => {
  const out = injectTheme('<html><head lang="ru"></head></html>', '');
  assert.ok(out.includes('<head lang="ru"><base href="https://shikimori.io/">'));
  assert.equal(injectTheme(out, '').match(/<base /g).length, 1);
});

test('символы $ в CSS не ломают подстановку', () => {
  const out = injectTheme('<head></head>', '.a::after{content:"$&"}');
  assert.ok(out.includes('content:"$&"'));
});

test('протокольно-относительные url становятся https', () => {
  assert.equal(toPreviewUrls('url(//a.b/c) url("//d.e/f")'), 'url(https://a.b/c) url("https://d.e/f")');
});

test('из поля убирается @import', () => {
  const field = '@import url("https://raw.githubusercontent.com/x/y/main/dist/theme.css");\n@media all { :root { --bj-ghost: "X"; } }';
  assert.equal(fieldToPreviewCss(field).trim(), '@media all { :root { --bj-ghost: "X"; } }');
});

test('base href можно задать (предпросмотр ставит свой прокси)', () => {
  const out = injectTheme('<html><head></head></html>', '', '/');
  assert.ok(out.includes('<head><base href="/">'));
});
