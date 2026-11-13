import type { FC } from 'react';
import { CacheFlow } from './CacheFlow';
import { DesignFlow } from './DesignFlow';
import { LoadBalancer } from './LoadBalancer';
import { QueueBuffer } from './QueueBuffer';
import { RetryStorm } from './RetryStorm';
import { SlidingWindow } from './SlidingWindow';
import { TokenWindow } from './TokenWindow';
import { TwoPointers } from './TwoPointers';

export const VISUALS: Record<string, FC> = {
  'cache-flow': CacheFlow,
  'design-flow': DesignFlow,
  'two-pointers': TwoPointers,
  'load-balancer': LoadBalancer,
  'queue-buffer': QueueBuffer,
  'retry-storm': RetryStorm,
  'sliding-window': SlidingWindow,
  'token-window': TokenWindow,
};
