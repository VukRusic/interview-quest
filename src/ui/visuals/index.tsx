import type { FC } from 'react';
import { CacheFlow } from './CacheFlow';
import { DesignFlow } from './DesignFlow';
import { TwoPointers } from './TwoPointers';

export const VISUALS: Record<string, FC> = {
  'cache-flow': CacheFlow,
  'design-flow': DesignFlow,
  'two-pointers': TwoPointers,
};
