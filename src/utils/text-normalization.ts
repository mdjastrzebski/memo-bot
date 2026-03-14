const SINGLE_QUOTE_VARIANTS = /[\u2018\u2019\u201A\u201B\u2032\u02BC\u0060\u00B4]/g;
const DOUBLE_QUOTE_VARIANTS = /[\u201C\u201D\u201E\u201F\u2033]/g;
const TRAILING_TERMINAL_PUNCTUATION = /[.?!]$/;
const MISSING_SPACE_AFTER_PUNCTUATION = /([.,!?])([^\s])/g;
const EXTRA_SPACE_BEFORE_PUNCTUATION = /\s+([.,!?])/g;
const MULTIPLE_SPACES = /\s+/g;
const TRAILING_DOTS = /\.+$/;

/** Normalization of text provided during input/setup step. */
export function normalizeInputText(input: string): string {
  return input.replace(SINGLE_QUOTE_VARIANTS, "'").replace(DOUBLE_QUOTE_VARIANTS, '"');
}

/** Normalization of text provided during answer evaluation. */
export function normalizeAnswerText(input: string): string {
  let current = normalizeInputText(input).trim();

  if (TRAILING_TERMINAL_PUNCTUATION.test(current)) {
    current = current.slice(0, -1);
  }

  current = current.replace(MISSING_SPACE_AFTER_PUNCTUATION, '$1 $2');
  current = current.replace(EXTRA_SPACE_BEFORE_PUNCTUATION, '$1');
  current = current.replace(MULTIPLE_SPACES, ' ').replace(TRAILING_DOTS, '');

  return current.trim();
}
