import { CHARS_PER_TOKEN, estimateTokens } from '../../src/core/tokens';

test('empty and whitespace-only text is 0', () => {
  expect(estimateTokens('')).toBe(0);
  expect(estimateTokens('   \n\t ')).toBe(0);
});

test('trimmed length ÷ 4, rounded up', () => {
  expect(CHARS_PER_TOKEN).toBe(4);
  expect(estimateTokens('abcd')).toBe(1);
  expect(estimateTokens('abcde')).toBe(2);
  expect(estimateTokens('  abcd  ')).toBe(1);
});

test('400 characters is about 100 tokens', () => {
  expect(estimateTokens('x'.repeat(400))).toBe(100);
});

test('emoji and non-Latin text do not throw and count something', () => {
  expect(estimateTokens('👍👍')).toBeGreaterThan(0);
  expect(estimateTokens('こんにちは')).toBeGreaterThan(0);
  expect(estimateTokens('\ud83d')).toBe(1); // a lone surrogate half
});

test('a 200,000 character string returns quickly', () => {
  const big = 'word '.repeat(40_000);
  const t0 = performance.now();
  expect(estimateTokens(big)).toBe(50_000);
  expect(performance.now() - t0).toBeLessThan(50);
});
