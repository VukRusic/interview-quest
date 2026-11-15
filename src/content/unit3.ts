import { UnitSchema, type Unit } from './types';
import { sqlVsNosql, replication, sharding, consistency } from './unit3/design';
import { dashboardRush, hashMap } from './unit3/practice';
import { talkDataStores } from './unit3/talk';
import { dotnetAsync, aiPromptBudget, mockNewsFeed, storyTradeoff } from './unit3/extras';

export const unit3: Unit = UnitSchema.parse({
  id: 'unit-3',
  title: 'Unit 3: Data at scale',
  lessons: [sqlVsNosql, replication, sharding, consistency, dashboardRush, talkDataStores, hashMap, dotnetAsync, aiPromptBudget, mockNewsFeed, storyTradeoff],
});
