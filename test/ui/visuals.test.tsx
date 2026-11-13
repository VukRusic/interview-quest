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
