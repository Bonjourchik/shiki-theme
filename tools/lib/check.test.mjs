import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCss, stripComments } from './check.mjs';

const ok = (css) => assert.deepEqual(checkCss(css, 't.css'), []);
const bad = (css, part) => {
  const errors = checkCss(css, 't.css');
  assert.ok(errors.length > 0, `ожидалась ошибка для: ${css}`);
  assert.ok(errors.some((e) => e.includes(part)), `нет "${part}" в: ${errors.join(' | ')}`);
};

test('чистый CSS проходит', () => {
  ok('.a { color: #fff; background: var(--bj-art); }');
  ok('.subscription, .windowed, .scripted { color: red; }');
});

test('запрещённые слова целиком ловятся, в комментариях — нет', () => {
  bad('.parent { color: red; }', '"parent"');
  bad('.a::after { content: "this"; }', '"this"');
  bad('@keyframes window-glow { to { opacity: 1; } }', '"window"');
  bad('.a { behavior: url(//x.htc); }', '"behavior"');
  ok('/* window parent this */ .a { color: red; }');
});

test('moz-binding, @charset, <, &# запрещены', () => {
  bad('.a { -moz-binding: none; }', 'moz-binding');
  bad('@charset "UTF-8";', '@charset');
  bad('.a::after { content: "<b>"; }', 'символ <');
  bad('.a::after { content: "&#10;"; }', '&#');
});

test('@import внутри темы запрещён', () => {
  bad('@import url("//x.css");', '@import');
});

test('обратный слэш разрешён только внутри content', () => {
  ok('.a::before { content: "\\f101"; }');
  ok(".a::before { content:'\\2014'; }");
  bad('.a { font-family: \\66 oo; }', 'обратный слэш');
});

test('url только // или data:image;base64', () => {
  ok('.a { background: url(//i.ibb.co/x.jpg); }');
  ok('.a { background: url("//i.ibb.co/x.jpg"); }');
  ok("@font-face { src: url(//fonts.gstatic.com/a.woff2) format('woff2'); }");
  ok('.a { background: url(data:image/png;base64,AAAA); }');
  bad('.a { background: url(https://i.ibb.co/x.jpg); }', 'url должен');
  bad('.a { background: url(data:text/css,x); }', 'url должен');
  bad('.a { background: url(/local.png); }', 'url должен');
});

test('номер строки указывает на место ошибки', () => {
  const errors = checkCss('.a {}\n/* многострочный\nкомментарий */\n.parent {}', 'f.css');
  assert.ok(errors[0].startsWith('f.css:4:'), errors[0]);
});

test('stripComments убирает комментарии', () => {
  assert.equal(stripComments('/* x */.a{}/* y */'), '.a{}');
});
