/** Unit 2 practice lessons. Validated when unit2.ts assembles the unit. */

export const flashSale = {
  id: 'flash-sale',
  title: 'Sandbox: the flash sale',
  pillar: 'design',
  slot: 'practice',
  steps: [
    {
      kind: 'explain',
      title: 'Before you build',
      body: `This scenario uses the last three lessons together.

- A traffic spike that one app server cannot handle calls for **more servers**, and more servers only help behind a **load balancer**.
- A server can die at the worst moment, so plan for **one more than the load needs**.
- A burst of **writes** (orders) is a different problem from a burst of reads. A cache or a read replica does nothing for writes. A **queue** lets them wait their turn.

Add and remove components, then switch between the three events to see how your design holds up. Every event has to stay green within the budget.`,
    },
    { kind: 'sandbox', id: 'sandbox-flash-sale', topic: 'traffic-spikes', scenarioId: 'flash-sale' },
  ],
};

const WINDOW_REFERENCE = `def max_window_sum(nums, k):
    if k <= 0 or k > len(nums):
        return None
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        best = max(best, window)
    return best
`;

export const slidingWindow = {
  id: 'sliding-window',
  title: 'Sliding window',
  pillar: 'algo',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'Reuse the work from the last step',
      visual: 'sliding-window',
      body: `Many problems ask about a run of **neighbouring** items: the best 7 days in a row, the longest stretch without a repeat. The slow way looks at every run from scratch.

A **sliding window** keeps a summary of the current run and updates it as the run moves one step: add the item that enters on the right, remove the item that leaves on the left. Two small operations per step, however wide the window is. Step through the example above.

That turns O(n × k) into O(n).

The signal in a problem statement: **contiguous** items (a subarray or substring) and a question about the best, longest or shortest run. If the items do not have to be next to each other, it is not a window problem.`,
    },
    {
      kind: 'quiz',
      id: 'sw-which-fixed',
      topic: 'sliding-window',
      prompt: 'From a year of daily sales figures, find the highest total over any 7 days in a row. Which pattern?',
      options: [
        'Two pointers from both ends',
        'A sliding window of fixed size 7',
        'Sort the figures and take the top 7',
        'A hash map of day to sales',
      ],
      answer: 1,
      why: '"In a row" means contiguous, and the size is fixed, so slide a 7-day window along the year, adding the new day and dropping the old one. Sorting would give the 7 best days of the year, which are almost never next to each other.',
    },
    {
      kind: 'quiz',
      id: 'sw-which-variable',
      topic: 'sliding-window',
      prompt: 'Find the length of the longest substring with no repeated character. Which pattern?',
      options: [
        'Binary search on the answer',
        'Sort the characters',
        'Two pointers moving inward from both ends',
        'A window that grows on the right and shrinks from the left when a repeat appears',
      ],
      answer: 3,
      why: 'A substring is contiguous, so it is a window, but this time its size changes. Grow it one character at a time, keep a set of what is inside, and when the new character is already there, move the left edge forward until it is not. Each character enters and leaves at most once, so it is O(n).',
    },
    {
      kind: 'quiz',
      id: 'sw-which-not',
      topic: 'sliding-window',
      prompt: 'Find the largest sum of any 3 numbers in a list. They do not have to be next to each other. Does a sliding window fit?',
      options: [
        'Yes, a window of size 3',
        'Yes, but it needs two windows',
        'No: they need not be adjacent, so just take the three largest numbers',
        'No: this needs dynamic programming',
      ],
      answer: 2,
      why: 'A window only ever looks at neighbours. Once the items can come from anywhere, the question is simply "which three are biggest", answered by one pass that tracks the top three (or by sorting). Spotting when a pattern does not apply is as useful in an interview as spotting when it does.',
    },
    {
      kind: 'python',
      id: 'py-max-window-sum',
      topic: 'sliding-window',
      prompt:
        'Write `max_window_sum(nums, k)`. Return the largest sum of any `k` numbers that sit next to each other in `nums`. Return `None` if `k` is zero or negative, or larger than the list. Numbers can be negative. Aim for O(n) time.',
      fn: 'max_window_sum',
      starter: `def max_window_sum(nums, k):
    # Largest sum of k neighbouring numbers in nums.
    # Return None if k <= 0 or k > len(nums).
    pass
`,
      tests: [
        { args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 },
        { args: [[1, 2, 3], 3], expected: 6 },
        { args: [[4, -1, 2], 1], expected: 4 },
        { args: [[1, 2], 3], expected: null },
        { args: [[], 1], expected: null },
        { args: [[-3, -2, -5], 2], expected: -5 },
        { args: [[5, 5, 5, 5], 2], expected: 10 },
        { args: [[1, 2, 3], 0], expected: null },
      ],
      reference: WINDOW_REFERENCE,
      walkthrough: [
        { line: 2, vars: { nums: '[2, 1, 5, 1, 3, 2]', k: '3' }, note: 'k is between 1 and the length of the list, so there is at least one window.' },
        { line: 4, vars: { window: '2 + 1 + 5 = 8' }, note: 'Add up the first 3 numbers once. This is the only full sum we ever compute.' },
        { line: 5, vars: { window: '8', best: '8' }, note: 'The first window is the best so far.' },
        { line: 7, vars: { i: '3', window: '8 + 1 − 2 = 7' }, note: 'Slide one step. 1 enters on the right, 2 leaves on the left.' },
        { line: 8, vars: { window: '7', best: '8' }, note: '7 is not better than 8, so best stays.' },
        { line: 7, vars: { i: '4', window: '7 + 3 − 1 = 9' }, note: 'Slide again. 3 enters, 1 leaves.' },
        { line: 8, vars: { window: '9', best: '9' }, note: 'A new best: the window 5, 1, 3.' },
        { line: 7, vars: { i: '5', window: '9 + 2 − 5 = 6' }, note: 'Last slide. 2 enters, 5 leaves.' },
        { line: 8, vars: { window: '6', best: '9' }, note: 'Not better. Best stays 9.' },
        { line: 9, vars: { result: '9' }, note: 'Four windows, and after the first each one cost two operations instead of adding 3 numbers again.' },
      ],
    },
  ],
};
