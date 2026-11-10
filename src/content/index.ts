import type { ItemStep, Unit } from './types';

export type ItemEntry = { step: ItemStep; lessonId: string };
export type ItemIndex = Map<string, ItemEntry>;

export const UNITS: Unit[] = [];

/** Every step that has an id, keyed by id. Later duplicates do not overwrite earlier ones. */
export function indexItems(units: Unit[]): ItemIndex {
  const map: ItemIndex = new Map();
  for (const u of units)
    for (const l of u.lessons)
      for (const s of l.steps)
        if (s.kind !== 'explain' && !map.has(s.id)) map.set(s.id, { step: s, lessonId: l.id });
  return map;
}

export const ITEMS: ItemIndex = indexItems(UNITS);

export function topicsOf(units: Unit[]): string[] {
  const set = new Set<string>();
  for (const { step } of indexItems(units).values()) set.add(step.topic);
  return [...set];
}

export const TOPICS: string[] = topicsOf(UNITS);

export function validateContent(units: Unit[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const check = (id: string, where: string) => {
    if (seen.has(id)) errors.push(`duplicate id "${id}" (${where})`);
    seen.add(id);
  };
  for (const u of units) {
    check(u.id, `unit`);
    for (const l of u.lessons) {
      check(l.id, `lesson in ${u.id}`);
      for (const s of l.steps) {
        if (s.kind === 'explain') continue;
        check(s.id, `step in ${l.id}`);
        if ((s.kind === 'quiz' || s.kind === 'bug') && (s.answer < 0 || s.answer >= s.options.length))
          errors.push(`${s.id}: answer ${s.answer} out of range for ${s.options.length} options`);
        if (s.kind === 'bug') {
          const lines = s.code.split('\n').length;
          const bad = s.bugLines.filter((n) => n < 1 || n > lines);
          if (bad.length) errors.push(`${s.id}: bugLines ${bad.join(',')} outside ${lines} lines`);
        }
      }
    }
  }
  return errors;
}

export function findLesson(id: string, units: Unit[] = UNITS) {
  for (const u of units) {
    const lesson = u.lessons.find((l) => l.id === id);
    if (lesson) return { unit: u, lesson };
  }
  return undefined;
}
