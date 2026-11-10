import { Prism, type PrismTheme } from 'prism-react-renderer';

// prism-react-renderer ships no C# grammar; a small one on top of clike is enough for snippets.
const P = Prism as unknown as {
  languages: Record<string, unknown> & { extend: (base: string, def: object) => unknown };
};
if (!P.languages.csharp) {
  P.languages.csharp = P.languages.extend('clike', {
    keyword:
      /\b(?:abstract|as|async|await|base|bool|break|case|catch|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|get|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|record|ref|return|sealed|set|short|static|string|struct|switch|this|throw|true|try|typeof|using|var|virtual|void|while|yield)\b/,
    string: [
      { pattern: /\$?@?"(?:""|\\.|[^\\"])*"/, greedy: true },
      { pattern: /'(?:\\.|[^\\'])'/, greedy: true },
    ],
    'class-name': /\b[A-Z]\w*(?=\s*(?:<[^>]*>)?\s+\w|\s*<|\s*\.|\s*\()/,
  });
}

export const PRISM_LANG: Record<'csharp' | 'typescript' | 'python', string> = {
  csharp: 'csharp',
  typescript: 'tsx',
  python: 'python',
};

export const LANG_LABEL: Record<'csharp' | 'typescript' | 'python', string> = {
  csharp: 'C#',
  typescript: 'TypeScript',
  python: 'Python',
};

/** Colors come from CSS tokens so code follows light/dark mode. */
export const codeTheme: PrismTheme = {
  plain: { color: 'var(--ink)', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog'], style: { color: 'var(--ink-soft)', fontStyle: 'italic' } },
    { types: ['keyword', 'boolean', 'important', 'builtin'], style: { color: 'var(--code-keyword)' } },
    { types: ['string', 'char', 'template-string', 'attr-value'], style: { color: 'var(--code-string)' } },
    { types: ['function', 'class-name', 'tag'], style: { color: 'var(--code-fn)' } },
    { types: ['number', 'constant'], style: { color: 'var(--code-number)' } },
    { types: ['punctuation', 'operator'], style: { color: 'var(--ink-soft)' } },
  ],
};
