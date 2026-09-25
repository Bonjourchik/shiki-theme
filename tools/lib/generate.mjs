// Правила, которые неудобно писать руками: CSS не умеет брать число из атрибута во всех браузерах.
export function generateRules() {
  const out = [];
  for (let n = 0; n <= 100; n++) {
    out.push(`[data-progress="${n}"]{--bj-p:${n / 100}}`);
  }
  for (let n = 1; n <= 30; n++) {
    out.push(`.p-profiles-show .achievements .b-achievement.level-${n} .c-image::after{content:"${n}"}`);
  }
  for (let n = 1; n <= 40; n++) {
    const delay = (0.6 + n * 0.03).toFixed(2);
    out.push(`.p-profiles-show .activity .graph .line:nth-child(${n}) .bar{animation-delay:${delay}s}`);
  }
  return out.join('\n');
}
