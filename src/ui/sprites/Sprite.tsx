/**
 * Tiny pixel sprites drawn from character maps: each character is one pixel, '.' is empty.
 * Colors come from CSS tokens so sprites follow light/dark mode.
 */
const PALETTE: Record<string, string> = {
  k: 'var(--ink)',
  g: 'var(--pine)',
  y: 'var(--sun)',
  r: 'var(--bad)',
  s: 'var(--surface)',
  p: 'var(--paper)',
  l: 'var(--line)',
};

export const SPRITES = {
  castle: [
    'k.k.k....k.k.k',
    'kkkkk....kkkkk',
    'klllk.kk.klllk',
    'klllkkllkklllk',
    'kllllllllllllk',
    'kllllkkkklllll',
    'klllkyyyyklllk',
    'klllkyyyyklllk',
    'kkkkkkkkkkkkkk',
  ],
  shield: [
    'kkkkkkkkk',
    'kgggkyyyk',
    'kgggkyyyk',
    'kgggkyyyk',
    'kkkkkkkkk',
    'kyyykgggk',
    '.kyykggk.',
    '..kykgk..',
    '...kkk...',
  ],
  flag: ['kyyyyy', 'kyyyyyy', 'kyyyyy', 'k', 'k', 'k', 'k', 'kk'],
  flame: ['..y..', '.yyy.', '.yry.', 'yrrry', 'yrrry', '.yry.', '..k..', '.kkk.'],
  scroll: ['.kkkkkkk.', 'kssssssk.', '.kslllsk.', '.ksssssk.', '.kslllsk.', '.ksssssk.', 'kssssssk.', '.kkkkkkk.'],
  key: ['.kkk.....', 'kyyyk....', 'ky.ykkkkk', 'kyyyk.k.k', '.kkk.....'],
} satisfies Record<string, string[]>;

export type SpriteName = keyof typeof SPRITES;

export function Sprite({ name, size = 3, title }: { name: SpriteName; size?: number; title?: string }) {
  const rows = SPRITES[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      className="pixel sprite"
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          PALETTE[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[c]} /> : null,
        ),
      )}
    </svg>
  );
}
