import type { Pillar } from '../content/types';

const TOPIC_LABELS: Record<string, string> = {
  'design-flow': 'Design answer flow',
  caching: 'Caching',
  'scaling-db': 'Scaling databases',
  'two-pointers': 'Two pointers',
  async: 'Async pitfalls',
  'data-access': 'Data access',
  'frontend-state': 'Front-end state',
  security: 'Security',
  'sql-indexing': 'SQL indexing',
  behavioural: 'Behavioural stories',
};

export const topicLabel = (t: string) => TOPIC_LABELS[t] ?? t.replace(/-/g, ' ');

export const PILLAR_LABELS: Record<Pillar, string> = {
  design: 'System design',
  review: 'Code review',
  algo: 'Algorithm patterns',
  stack: 'Stack',
  stories: 'Stories',
};
