import { UnitSchema, type Unit } from './types';
import { loadBalancing, queues, retries } from './unit2/design';
import { flashSale, slidingWindow } from './unit2/practice';
import { talkMessaging, talkRequestPath } from './unit2/talk';
import { aiTokens, mockNotifications, storyIncident } from './unit2/extras';

export const unit2: Unit = UnitSchema.parse({
  id: 'unit-2',
  title: 'Unit 2: Traffic and failure',
  lessons: [
    loadBalancing,
    queues,
    retries,
    flashSale,
    talkRequestPath,
    slidingWindow,
    talkMessaging,
    aiTokens,
    mockNotifications,
    storyIncident,
  ],
});
