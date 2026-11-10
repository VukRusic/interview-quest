import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProgressProvider } from '../../src/state/useProgress';

export function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
  };
}

export function Wrap({ children, storage, today = '2026-11-10' }: { children: ReactNode; storage?: Storage; today?: string }) {
  return (
    <MemoryRouter>
      <ProgressProvider storage={storage ?? memoryStorage()} today={today}>
        {children}
      </ProgressProvider>
    </MemoryRouter>
  );
}
