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
  'load-balancing': 'Load balancing',
  queues: 'Queues',
  resilience: 'Timeouts and retries',
  'traffic-spikes': 'Handling spikes',
  'talk-networking': 'Tech talk: networking',
  'talk-apis': 'Tech talk: APIs',
  'sliding-window': 'Sliding window',
  'talk-messaging': 'Tech talk: messaging',
  'talk-reliability': 'Tech talk: reliability',
  'ai-tokens': 'Tokens and context',
  'design-notifications': 'Notification system',
  'data-modelling': 'Choosing a database',
  replication: 'Replication',
  sharding: 'Sharding',
  consistency: 'Consistency',
  'talk-storage': 'Tech talk: storage',
  'talk-search-analytics': 'Tech talk: search and analytics',
  'hash-map': 'Hash maps',
  'dotnet-async': '.NET async',
  'ai-prompts': 'Writing prompts',
  'design-feed': 'News feed',
};

export const topicLabel = (t: string) => TOPIC_LABELS[t] ?? t.replace(/-/g, ' ');

export const PILLAR_LABELS: Record<Pillar, string> = {
  design: 'System design',
  review: 'Code review',
  algo: 'Algorithm patterns',
  stack: 'Stack',
  stories: 'Stories',
  talk: 'Tech talk',
  ai: 'Working with AI',
};
