import { useState } from 'react';

type Key = 'country' | 'hash';
const CUSTOMERS = [
  ...Array.from({ length: 7 }, () => 'US'),
  ...Array.from({ length: 3 }, () => 'DE'),
  ...Array.from({ length: 2 }, () => 'RS'),
].map((country, i) => ({ id: i + 1, country }));
const COUNTRY_SHARD: Record<string, number> = { US: 1, DE: 2, RS: 3 };

/** Twelve customers on three shards under two shard keys: the spread, and what one query has to touch. */
export function ShardKeys() {
  const [key, setKey] = useState<Key>('country');
  const shardOf = (c: (typeof CUSTOMERS)[number]) => (key === 'country' ? COUNTRY_SHARD[c.country] : (c.id % 3) + 1);
  const counts = [1, 2, 3].map((s) => CUSTOMERS.filter((c) => shardOf(c) === s).length);

  return (
    <div className="viz viz-shards">
      <div className="retry-options" role="radiogroup" aria-label="Shard key">
        <label className="switch">
          <input type="radio" name="shard-key" checked={key === 'country'} onChange={() => setKey('country')} />
          <span>Shard by country</span>
        </label>
        <label className="switch">
          <input type="radio" name="shard-key" checked={key === 'hash'} onChange={() => setKey('hash')} />
          <span>Shard by hash of customer id</span>
        </label>
      </div>
      <ul className="lb-servers">
        {[1, 2, 3].map((s) => (
          <li key={s} data-testid={`shard-${s}`} className="lb-server">
            <strong>Shard {s}</strong>
            <span>
              {counts[s - 1]} {counts[s - 1] === 1 ? 'customer' : 'customers'}
            </span>
            <span className="shard-dots" aria-hidden="true">
              {'■'.repeat(counts[s - 1])}
            </span>
          </li>
        ))}
      </ul>
      <dl className="viz-stats">
        <div>
          <dt>Busiest shard holds</dt>
          <dd>{Math.round((Math.max(...counts) / CUSTOMERS.length) * 100)}%</dd>
        </div>
        <div>
          <dt>Shards asked for "all customers in Germany"</dt>
          <dd>{key === 'country' ? 1 : 3}</dd>
        </div>
      </dl>
      <p className="viz-note" aria-live="polite">
        {key === 'country'
          ? 'Customers from one country stay together, so a query by country is cheap. But most customers are in one country, so one shard does most of the work.'
          : 'Hashing spreads customers evenly. But a query by country now has to ask every shard and combine the answers.'}{' '}
        Illustrative numbers.
      </p>
    </div>
  );
}
