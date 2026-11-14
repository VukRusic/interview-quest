export const CHARS_PER_TOKEN = 4;

/**
 * A rough token count for English prose: trimmed length ÷ 4, rounded up. Empty or whitespace is 0.
 * Real counts come from a model provider's tokenizer and differ, more so for code and non-English
 * text, so every screen that shows this number words it as "about".
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / CHARS_PER_TOKEN);
}
