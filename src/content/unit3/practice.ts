/** Unit 3 practice lessons. Validated when unit3.ts assembles the unit. */

export const dashboardRush = {
  id: 'dashboard-rush',
  title: 'Sandbox: the Monday dashboard',
  pillar: 'design',
  slot: 'practice',
  steps: [
    {
      kind: 'explain',
      title: 'Before you build',
      body: `Reads and writes put pressure on different parts of a database, so they need different fixes.

- **Too many reads:** read replicas multiply how many queries you can answer, and keep answering if the primary fails.
- **Too many writes at once:** replicas do not help, because every write still goes to the one primary. A queue lets a burst wait its turn.
- **The primary fails:** replicas keep serving reads. Writes have nowhere to go, unless something holds them until a replica is promoted.

This scenario has four events. Every one of them has to stay green within the budget, so check each tab after you change the design.`,
    },
    { kind: 'sandbox', id: 'sandbox-dashboard-rush', topic: 'scaling-db', scenarioId: 'dashboard-rush' },
  ],
};

const TWO_SUM_REFERENCE = `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return None
`;

export const hashMap = {
  id: 'hash-map',
  title: 'Hash maps',
  pillar: 'algo',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'Remember what you have seen',
      visual: 'hash-lookup',
      body: `Many slow solutions are slow because they search the same list again and again: for each item, look through all the others. That is O(n²).

A **hash map** (a \`dict\` in Python) answers "have I seen this, and where?" in about constant time. So you can walk the list **once**, and at each item ask the map for the thing that would complete it. Step through the example above.

That turns O(n²) time into O(n), at the price of O(n) extra memory.

The signal in a problem statement: **unsorted** input, and a question about pairs, duplicates, counts or groups. When you only need to know whether something was seen, a **set** is enough. When the input is sorted and memory is tight, two pointers does the same job with no extra memory.`,
    },
    {
      kind: 'quiz',
      id: 'hm-which-group',
      topic: 'hash-map',
      prompt: 'Group a list of words so that anagrams ("listen", "silent") end up together. Which approach?',
      options: [
        'Two pointers from both ends',
        'A sliding window over the list',
        'Binary search for each word',
        'A hash map from each word’s sorted letters to the words that share them',
      ],
      answer: 3,
      why: 'Anagrams have the same letters, so sorting the letters of each word gives a key that all of them share. One pass puts every word into the map under its key, and each entry is a group. Grouping by a computed key is one of the most common uses of a hash map.',
    },
    {
      kind: 'quiz',
      id: 'hm-which-set',
      topic: 'hash-map',
      prompt: 'Decide in one pass whether a list contains any value twice. What is enough?',
      options: [
        'A set of the values seen so far',
        'A hash map from each value to its position',
        'A sliding window of size 2',
        'Two pointers from both ends',
      ],
      answer: 0,
      why: 'You only need to know whether a value was seen, not where, so a set does it: if the value is already in the set, stop. A map to positions works too but stores more than the question needs. A window of size 2 only catches duplicates that sit next to each other.',
    },
    {
      kind: 'quiz',
      id: 'hm-which-not',
      topic: 'hash-map',
      prompt: 'A sorted list; find two numbers that add up to a target, and you may not use extra memory. Which approach?',
      options: [
        'A hash map of the values seen so far',
        'Two pointers, one from each end',
        'A set of all the values',
        'Copy the list and sort the copy',
      ],
      answer: 1,
      why: 'Both a hash map and two pointers solve this in O(n) time, but the map and the set need O(n) extra memory. The list is already sorted, which is exactly what two pointers needs, and it uses no extra memory. The constraints in the question choose the pattern.',
    },
    {
      kind: 'python',
      id: 'py-two-sum',
      topic: 'hash-map',
      prompt:
        'Write `two_sum(nums, target)`. `nums` is **not** sorted. Return `[i, j]` with `i < j` and `nums[i] + nums[j] == target`, or `None` if there is no such pair. A number cannot be paired with itself, but two equal numbers at different positions can be. Each test has at most one valid pair. Aim for O(n) time.',
      fn: 'two_sum',
      starter: `def two_sum(nums, target):
    # nums is NOT sorted.
    # Return [i, j] (i < j) where nums[i] + nums[j] == target, or None.
    pass
`,
      tests: [
        { args: [[8, 3, 11, 7, 2], 9], expected: [3, 4] },
        { args: [[3, 3], 6], expected: [0, 1] },
        { args: [[5], 10], expected: null },
        { args: [[5, 1], 10], expected: null },
        { args: [[], 4], expected: null },
        { args: [[-4, 10, 6, 1], 2], expected: [0, 2] },
        { args: [[1, 2, 3, 4], 8], expected: null },
        { args: [[0, 4, 0], 0], expected: [0, 2] },
      ],
      reference: TWO_SUM_REFERENCE,
      walkthrough: [
        { line: 2, vars: { nums: '[8, 3, 11, 7, 2]', target: '9', seen: '{}' }, note: 'An empty map: value → position where it was seen.' },
        { line: 4, vars: { i: '0', n: '8', need: '9 − 8 = 1' }, note: '8 would need a 1 to reach 9.' },
        { line: 7, vars: { seen: '{8: 0}' }, note: 'No 1 seen yet, so remember that 8 is at position 0.' },
        { line: 4, vars: { i: '1', n: '3', need: '9 − 3 = 6' }, note: '3 would need a 6.' },
        { line: 7, vars: { seen: '{8: 0, 3: 1}' }, note: 'No 6 either. Remember 3.' },
        { line: 4, vars: { i: '2', n: '11', need: '9 − 11 = −2' }, note: '11 would need −2. Negative needs are fine; they are just another lookup.' },
        { line: 7, vars: { seen: '{8: 0, 3: 1, 11: 2}' }, note: 'Not seen. Remember 11.' },
        { line: 4, vars: { i: '3', n: '7', need: '9 − 7 = 2' }, note: '7 would need a 2.' },
        { line: 7, vars: { seen: '{8: 0, 3: 1, 11: 2, 7: 3}' }, note: 'No 2 yet. Remember 7.' },
        { line: 4, vars: { i: '4', n: '2', need: '9 − 2 = 7' }, note: '2 would need a 7.' },
        { line: 5, vars: { need: '7', 'seen[7]': '3' }, note: '7 is in the map, at position 3. One lookup, not a second loop.' },
        { line: 6, vars: { result: '[3, 4]' }, note: 'Found after one pass over 5 numbers. Checking before storing is what stops a number pairing with itself.' },
      ],
    },
  ],
};
