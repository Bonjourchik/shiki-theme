import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRules } from './generate.mjs';
import { checkCss } from './check.mjs';

test('прогресс достижений 0..100 как доля', () => {
  const css = generateRules();
  assert.ok(css.includes('[data-progress="0"]{--bj-p:0}'));
  assert.ok(css.includes('[data-progress="41"]{--bj-p:0.41}'));
  assert.ok(css.includes('[data-progress="100"]{--bj-p:1}'));
});

test('значки уровней 1..30 только в профиле', () => {
  const css = generateRules();
  assert.ok(css.includes('.p-profiles-show .achievements .b-achievement.level-1 .c-image::after{content:"1"}'));
  assert.ok(css.includes('.p-profiles-show .achievements .b-achievement.level-30 .c-image::after{content:"30"}'));
  assert.ok(!css.includes('level-31'));
  assert.ok(!/^\.b-achievement\.level-/m.test(css), 'правило уровня без префикса профиля');
});

test('лесенка задержек графика активности 1..40', () => {
  const css = generateRules();
  assert.ok(css.includes('.p-profiles-show .activity .graph .line:nth-child(1) .bar{animation-delay:0.63s}'));
  assert.ok(css.includes('.line:nth-child(40) .bar{animation-delay:1.80s}'));
});

test('сгенерированное проходит проверку санитайзера', () => {
  assert.deepEqual(checkCss(generateRules(), '<generated>'), []);
});
