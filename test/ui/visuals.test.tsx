import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VISUALS } from '../../src/ui/visuals';

const show = (key: string) => {
  const V = VISUALS[key];
  expect(V, key).toBeDefined();
  render(<V />);
};
const stat = (label: string) => screen.getByText(label).closest('div')!.querySelector('dd')!.textContent;

describe('load-balancer', () => {
  test('six requests spread evenly over three servers', async () => {
    show('load-balancer');
    await userEvent.click(screen.getByRole('button', { name: 'Send 6 requests' }));
    expect(stat('Served')).toBe('6');
    for (const n of [1, 2, 3]) expect(screen.getByTestId(`server-${n}`)).toHaveTextContent('2 requests');
  });

  test('a stopped server is skipped and nothing fails', async () => {
    show('load-balancer');
    await userEvent.click(screen.getByRole('button', { name: 'Stop server 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send 6 requests' }));
    expect(screen.getByTestId('server-2')).toHaveTextContent('0 requests');
    expect(screen.getByTestId('server-1')).toHaveTextContent('3 requests');
    expect(stat('Failed')).toBe('0');
  });

  test('without the load balancer everything goes to server 1, and fails when it stops', async () => {
    show('load-balancer');
    await userEvent.click(screen.getByRole('checkbox', { name: /load balancer/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Send 6 requests' }));
    expect(screen.getByTestId('server-1')).toHaveTextContent('6 requests');
    await userEvent.click(screen.getByRole('button', { name: 'Stop server 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send 6 requests' }));
    expect(stat('Failed')).toBe('6');
  });
});

describe('queue-buffer', () => {
  test('a burst above what the worker can do is lost without a queue and waits with one', async () => {
    show('queue-buffer');
    fireEvent.change(screen.getByRole('slider', { name: /orders arriving/i }), { target: { value: '12' } });
    expect(stat('Orders lost')).toBe('0');
    expect(stat('Waiting in the queue')).toBe('20');
    await userEvent.click(screen.getByRole('checkbox', { name: /queue/i }));
    expect(stat('Orders lost')).toBe('20');
  });

  test('at or below the worker rate nothing waits and nothing is lost', () => {
    show('queue-buffer');
    fireEvent.change(screen.getByRole('slider', { name: /orders arriving/i }), { target: { value: '8' } });
    expect(stat('Orders lost')).toBe('0');
    expect(stat('Waiting in the queue')).toBe('0');
  });
});

describe('retry-storm', () => {
  const peak = () => Number(stat('Peak requests per second'));

  test('immediate retries multiply the load; backoff with jitter keeps the peak near normal', async () => {
    show('retry-storm');
    const group = screen.getByRole('radiogroup', { name: /retry/i });
    await userEvent.click(within(group).getByRole('radio', { name: /immediately/i }));
    const storm = peak();
    await userEvent.click(within(group).getByRole('radio', { name: /jitter/i }));
    const calm = peak();
    expect(storm).toBeGreaterThan(calm * 3);
    expect(calm).toBeLessThanOrEqual(150);
  });
});

describe('sliding-window', () => {
  test('stepping forward slides the window and updates the running sum', async () => {
    show('sliding-window');
    expect(screen.getByTestId('window-sum')).toHaveTextContent('8');
    await userEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByTestId('window-sum')).toHaveTextContent('7');
    expect(screen.getByText(/add 1, subtract 2/i)).toBeInTheDocument();
  });

  test('the last step shows the best window and cannot go further', async () => {
    show('sliding-window');
    const next = screen.getByRole('button', { name: 'Next step' });
    for (let i = 0; i < 3; i++) await userEvent.click(next);
    expect(next).toBeDisabled();
    expect(screen.getByTestId('window-best')).toHaveTextContent('9');
  });
});

describe('token-window', () => {
  const num = (label: string) => Number(stat(label));

  test('every turn resends the whole conversation, so the total sent grows faster than the conversation', async () => {
    show('token-window');
    const first = num('Sent with this request');
    await userEvent.click(screen.getByRole('button', { name: 'Add a turn' }));
    const second = num('Sent with this request');
    expect(second).toBeGreaterThan(first);
    expect(num('Sent in total so far')).toBe(first + second);
  });

  test('attaching a document makes every later request bigger', async () => {
    show('token-window');
    const before = num('Sent with this request');
    await userEvent.click(screen.getByRole('checkbox', { name: /document/i }));
    expect(num('Sent with this request')).toBeGreaterThan(before);
  });

  test('when the window is full it says so and stops adding turns', async () => {
    show('token-window');
    await userEvent.click(screen.getByRole('checkbox', { name: /document/i }));
    const add = screen.getByRole('button', { name: 'Add a turn' });
    for (let i = 0; i < 12 && !add.hasAttribute('disabled'); i++) await userEvent.click(add);
    expect(add).toBeDisabled();
    expect(screen.getByText(/no longer fits/i)).toBeInTheDocument();
  });
});

describe('data-shapes', () => {
  test('the same question costs different work in rows and in a document', async () => {
    show('data-shapes');
    const note = () => screen.getByTestId('shape-note').textContent;
    await userEvent.click(screen.getByRole('button', { name: /every order containing/i }));
    const rows = note();
    await userEvent.click(screen.getByRole('radio', { name: /one document/i }));
    expect(note()).not.toBe(rows);
    expect(note()).toMatch(/every order document/i);
    await userEvent.click(screen.getByRole('button', { name: /order 42 with its items/i }));
    expect(note()).toMatch(/one document read/i);
  });
});

describe('replication-lag', () => {
  test('asynchronous: the follower is behind until replication catches up', async () => {
    show('replication-lag');
    await userEvent.click(screen.getByRole('button', { name: /^Write/ }));
    expect(stat('Leader has')).toBe('20');
    expect(stat('Follower has')).toBe('10');
    await userEvent.click(screen.getByRole('button', { name: /catch up/i }));
    expect(stat('Follower has')).toBe('20');
  });

  test('synchronous: the follower has the write as soon as it is confirmed, and the write waits longer', async () => {
    show('replication-lag');
    await userEvent.click(screen.getByRole('button', { name: /^Write/ }));
    const asyncWait = stat('Write confirmed after');
    await userEvent.click(screen.getByRole('checkbox', { name: /synchronous/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Write/ }));
    expect(stat('Follower has')).toBe('20');
    expect(stat('Write confirmed after')).not.toBe(asyncWait);
  });
});

describe('shard-keys', () => {
  test('sharding by country is lopsided; hashing the id is even', async () => {
    show('shard-keys');
    await userEvent.click(screen.getByRole('radio', { name: /country/i }));
    expect(screen.getByTestId('shard-1')).toHaveTextContent('7 customers');
    await userEvent.click(screen.getByRole('radio', { name: /hash/i }));
    for (const n of [1, 2, 3]) expect(screen.getByTestId(`shard-${n}`)).toHaveTextContent('4 customers');
  });

  test('a query by country touches one shard under the country key and all three under the hash', async () => {
    show('shard-keys');
    await userEvent.click(screen.getByRole('radio', { name: /country/i }));
    expect(stat('Shards asked for "all customers in Germany"')).toBe('1');
    await userEvent.click(screen.getByRole('radio', { name: /hash/i }));
    expect(stat('Shards asked for "all customers in Germany"')).toBe('3');
  });
});

describe('quorum', () => {
  const set = (name: RegExp, v: number) => fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(v) } });

  test('R + W > N guarantees a read sees the latest write; otherwise it may be stale', () => {
    show('quorum');
    set(/writes wait for/i, 2);
    set(/reads ask/i, 2);
    expect(screen.getByTestId('quorum-verdict')).toHaveTextContent(/guaranteed/i);
    set(/writes wait for/i, 1);
    set(/reads ask/i, 1);
    expect(screen.getByTestId('quorum-verdict')).toHaveTextContent(/may be stale/i);
    set(/reads ask/i, 3);
    expect(screen.getByTestId('quorum-verdict')).toHaveTextContent(/guaranteed/i);
  });
});
