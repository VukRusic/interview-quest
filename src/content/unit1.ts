import { UnitSchema, type Unit } from './types';

const PAIR_REFERENCE = `def pair_with_sum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1
        else:
            right -= 1
    return None
`;

export const unit1: Unit = UnitSchema.parse({
  id: 'unit-1',
  title: 'Unit 1: Foundations',
  lessons: [
    // 1 ─────────────────────────────────────────────────────────────
    {
      id: 'design-flow',
      title: 'The design answer flow',
      pillar: 'design',
      slot: 'lesson',
      steps: [
        {
          kind: 'explain',
          title: 'Five steps, every time',
          visual: 'design-flow',
          body: `A system design round is a working session, not a quiz. Interviewers watch **how** you get to a design, so a steady flow matters more than a perfect diagram.

Use the same five steps every time: requirements, estimates, high-level design, deep dive, trade-offs. Tap each step above to see what it covers and roughly how long it takes in a 45-minute round.

The most common way to fail is jumping straight to boxes and arrows. Without requirements you can't tell whether you need a cache, a queue or sharding, and the interviewer can't tell whether you would have asked.`,
        },
        {
          kind: 'quiz',
          id: 'df-first-move',
          topic: 'design-flow',
          prompt: 'The interviewer says "Design a URL shortener." What do you do first?',
          options: [
            'Draw the services and the database',
            'Ask what it must do, for whom, and at what scale',
            'Pick between SQL and NoSQL',
            'Start writing the API code',
          ],
          answer: 1,
          why: 'Requirements decide everything after them. "Custom aliases? Expiring links? 100 links a day or 100 million?" leads to very different designs, and asking shows the interviewer you would do the same at work.',
        },
        {
          kind: 'quiz',
          id: 'df-estimates',
          topic: 'design-flow',
          prompt: 'Why do quick back-of-the-envelope estimates matter?',
          options: [
            'Interviewers grade arithmetic',
            'They tell you which parts are under real pressure, such as a 100:1 read/write ratio',
            'They replace the need for a deep dive',
            'They are only needed for big-tech interviews',
          ],
          answer: 1,
          why: 'Rough numbers (requests per second, read/write ratio, storage per year) show where the load is. A 100:1 read-heavy system points to caching and replicas; a write-heavy one points to queues and partitioning.',
        },
        {
          kind: 'quiz',
          id: 'df-time',
          topic: 'design-flow',
          prompt: 'You have 45 minutes. Where should most of the time go?',
          options: [
            'Requirements, to be safe',
            'The high-level design and one deep dive',
            'Listing every technology you know',
            'Capacity math to three decimal places',
          ],
          answer: 1,
          why: 'Requirements and estimates take about 10 minutes together. The high-level design and one well-chosen deep dive (the hot path or the data layer) are where you show design skill, so they get the bulk of the time.',
        },
        {
          kind: 'quiz',
          id: 'df-tradeoffs',
          topic: 'design-flow',
          prompt: 'The interviewer asks why you chose a relational database. Which answer is strongest?',
          options: [
            '"It is the industry standard."',
            '"I always use it."',
            '"We need transactions for orders; I give up easy horizontal scaling, and would revisit at 10× writes."',
            '"NoSQL does not scale."',
          ],
          answer: 2,
          why: 'A strong trade-off names what you gain, what it costs, and when you would change your mind. "Always" and "industry standard" are not reasons, and "NoSQL does not scale" is simply wrong.',
        },
      ],
    },

    // 2 ─────────────────────────────────────────────────────────────
    {
      id: 'caching',
      title: 'Caching that holds up',
      pillar: 'design',
      slot: 'lesson',
      steps: [
        {
          kind: 'explain',
          title: 'Cache-aside in one picture',
          visual: 'cache-flow',
          body: `**Cache-aside** is the most common pattern. On a read, the app checks the cache first. On a miss it reads the database, stores the result in the cache with a **TTL** (time to live), and returns it. Send the requests above with the cache on and off and watch the database queries.

Repeated reads of the same keys become cheap memory lookups. That is why caching is the first fix for read-heavy pages.`,
        },
        {
          kind: 'explain',
          title: 'Where it bites in production',
          body: `- **Stale data.** When data changes, update the database and then **delete** the cache key. The next read reloads a fresh copy. The TTL caps how long a stale value can survive if a delete is ever missed.
- **Stampede.** When a hot key expires, thousands of requests can miss at the same moment and all hit the database. Let one request rebuild the value while the others wait or get the old value, and add a little random jitter to TTLs so keys don't expire together.
- **Cold start.** After a deploy or restart the cache is empty and the database takes the full load until it warms up.`,
        },
        {
          kind: 'quiz',
          id: 'cache-aside-who',
          topic: 'caching',
          prompt: 'In cache-aside, who puts data into the cache?',
          options: [
            'The database, through a trigger',
            'The application, after a cache miss',
            'The cache, by reading the database itself',
            'A nightly batch job',
          ],
          answer: 1,
          why: 'In cache-aside the application owns the logic: check the cache, on a miss read the database, then write the value to the cache. A cache that loads from the database by itself is a different pattern (read-through).',
        },
        {
          kind: 'quiz',
          id: 'cache-invalidate',
          topic: 'caching',
          prompt: "A product's price changes. With cache-aside, what is the common safe move?",
          options: [
            'Write the new price to the cache, then to the database',
            'Update the database, then delete the cache key',
            'Do nothing; the TTL will handle it',
            'Flush the whole cache',
          ],
          answer: 1,
          why: 'Deleting the key after the database write means the next read loads the new price. Writing the cache first can leave a value the database never accepted, waiting for the TTL can show the old price for minutes, and flushing everything triggers a stampede.',
        },
        {
          kind: 'quiz',
          id: 'cache-ttl',
          topic: 'caching',
          prompt: 'What does a TTL on a cached value give you?',
          options: [
            'The value is always fresh',
            'A stale value lives at most that long before it is reloaded',
            'The cache never runs out of memory',
            'The database is never queried',
          ],
          answer: 1,
          why: 'A TTL is an upper bound on staleness: after it expires, the next read goes to the database. It does not make values fresh in between, and memory limits are handled by eviction policies such as LRU.',
        },
        {
          kind: 'quiz',
          id: 'cache-stampede-name',
          topic: 'caching',
          prompt: 'A hot key expires and 5,000 requests miss at the same moment, all querying the database. What is this called?',
          options: ['Cache stampede', 'Cache poisoning', 'Write-behind', 'Sharding'],
          answer: 0,
          why: 'A cache stampede (also called a thundering herd) is many requests rebuilding the same expired value at once. The database sees a sudden spike exactly when the cache was supposed to protect it.',
        },
        {
          kind: 'quiz',
          id: 'cache-stampede-fix',
          topic: 'caching',
          prompt: 'Which change protects against a stampede?',
          options: [
            'Shorter TTLs',
            'Let one request rebuild the value while the others wait or get the old value',
            'More app servers',
            'Turning the cache off at peak times',
          ],
          answer: 1,
          why: 'Request coalescing (a lock or "single flight" per key) means one database query instead of thousands. Shorter TTLs make expiries more frequent, and more app servers just send more queries.',
        },
      ],
    },

    // 3 ─────────────────────────────────────────────────────────────
    {
      id: 'slow-product-page',
      title: 'Sandbox: the slow product page',
      pillar: 'design',
      slot: 'practice',
      steps: [
        {
          kind: 'explain',
          title: 'Read replicas',
          body: `A **read replica** is a copy of the database that receives the primary's changes, usually asynchronously, and answers reads. Reads spread across the primary and its replicas, so a read-heavy system gets more capacity.

Two catches. Replicas can lag behind the primary, so a value you just wrote may not show up on a replica for a moment. And replicas don't accept writes: if the primary goes down, reads keep working but writes fail until a replica is promoted (failover).

Next, a sandbox. Add components, switch between traffic events, and watch latency, errors and cost. Get every event green within budget.`,
        },
        { kind: 'sandbox', id: 'sandbox-slow-product-page', topic: 'scaling-db', scenarioId: 'slow-product-page' },
      ],
    },

    // 4 ─────────────────────────────────────────────────────────────
    {
      id: 'two-pointers',
      title: 'Two pointers',
      pillar: 'algo',
      slot: 'lesson',
      steps: [
        {
          kind: 'explain',
          title: 'Why moving inward works',
          visual: 'two-pointers',
          body: `On a **sorted** list, put one pointer at each end and look at the sum.

- Too big? The right value is too big even with the smallest value still available, so no pair with it can work. Move right inward.
- Too small? The left value is too small even with the largest value still available. Move left inward.

Each step rules out a whole row of pairs, so you check at most n pairs instead of n² and use no extra memory. Step through the example above.

The signal in a problem statement: **sorted input** (or input you can sort) and **pairs or ranges** that must meet a condition.`,
        },
        {
          kind: 'quiz',
          id: 'tp-which-sorted',
          topic: 'two-pointers',
          prompt: 'A sorted list; find two numbers that add up to a target, using O(1) extra space. Which pattern?',
          options: ['Hash map of seen values', 'Two pointers from both ends', 'Sliding window', 'Binary search for every element'],
          answer: 1,
          why: 'Sorted input plus a pair condition is the classic two-pointer setup: O(n) time and O(1) space. A hash map also works in O(n) time but needs O(n) memory, and binary search per element is O(n log n).',
        },
        {
          kind: 'quiz',
          id: 'tp-which-palindrome',
          topic: 'two-pointers',
          prompt: 'Check whether a string is a palindrome, ignoring spaces and punctuation. Which pattern?',
          options: ['Two pointers moving inward, skipping non-letters', 'Sort the characters', 'Count characters in a hash map', 'Recursion on every substring'],
          answer: 0,
          why: 'Compare the first and last letters, then move both pointers inward, skipping characters that do not count. Counting characters checks for anagrams, not palindromes.',
        },
        {
          kind: 'quiz',
          id: 'tp-which-unsorted',
          topic: 'two-pointers',
          prompt: 'An unsorted list; return the original indices of two numbers that add up to a target. Which pattern fits best?',
          options: ['Two pointers from both ends', 'Hash map from value to index, in one pass', 'Sliding window', 'Sort, then two pointers, and return the sorted indices'],
          answer: 1,
          why: 'Two pointers needs sorted input, and sorting loses the original indices. One pass with a map of value → index finds the partner of each number in O(1), so O(n) overall.',
        },
        {
          kind: 'python',
          id: 'py-pair-with-sum',
          topic: 'two-pointers',
          prompt: `Write \`pair_with_sum(nums, target)\`. \`nums\` is sorted ascending. Return \`[i, j]\` with \`i < j\` and \`nums[i] + nums[j] == target\`, or \`None\` if there is no such pair. Each test has at most one valid pair. Aim for O(n) time and O(1) extra space.`,
          fn: 'pair_with_sum',
          starter: `def pair_with_sum(nums, target):
    # nums is sorted ascending.
    # Return [i, j] (i < j) where nums[i] + nums[j] == target, or None.
    pass
`,
          tests: [
            { args: [[1, 3, 4, 6, 8, 11], 10], expected: [2, 3] },
            { args: [[], 5], expected: null },
            { args: [[1, 2, 3], 100], expected: null },
            { args: [[2, 2, 3], 4], expected: [0, 1] },
            { args: [[-5, -2, 0, 3, 7], 1], expected: [1, 3] },
            { args: [[5], 10], expected: null },
            { args: [[1, 2, 3, 4, 5], 9], expected: [3, 4] },
          ],
          reference: PAIR_REFERENCE,
          walkthrough: [
            { line: 2, vars: { nums: '[1, 3, 4, 6, 8, 11]', target: '10', left: '0', right: '5' }, note: 'One pointer at each end.' },
            { line: 4, vars: { left: '0', right: '5', total: '1 + 11 = 12' }, note: 'Look at the sum of the two ends.' },
            { line: 10, vars: { left: '0', right: '4', total: '12' }, note: '12 is too big. Even the smallest value, 1, is too big with 11, so 11 is out. Move right inward.' },
            { line: 4, vars: { left: '0', right: '4', total: '1 + 8 = 9' }, note: 'New sum: 9.' },
            { line: 8, vars: { left: '1', right: '4', total: '9' }, note: '9 is too small. Even the largest value, 8, is too small with 1, so 1 is out. Move left inward.' },
            { line: 4, vars: { left: '1', right: '4', total: '3 + 8 = 11' }, note: 'New sum: 11.' },
            { line: 10, vars: { left: '1', right: '3', total: '11' }, note: 'Too big again, so 8 is out. Move right inward.' },
            { line: 4, vars: { left: '1', right: '3', total: '3 + 6 = 9' }, note: 'New sum: 9.' },
            { line: 8, vars: { left: '2', right: '3', total: '9' }, note: 'Too small, so 3 is out. Move left inward.' },
            { line: 4, vars: { left: '2', right: '3', total: '4 + 6 = 10' }, note: 'New sum: 10, the target.' },
            { line: 6, vars: { left: '2', right: '3', result: '[2, 3]' }, note: 'Found it after 5 sums instead of up to 15 pairs. Each step removed one number for good.' },
          ],
        },
      ],
    },

    // 5 ─────────────────────────────────────────────────────────────
    {
      id: 'bug-hunt-1',
      title: 'Bug hunt: production classics',
      pillar: 'review',
      slot: 'practice',
      steps: [
        {
          kind: 'explain',
          title: 'Read code like a reviewer',
          body: `Five short snippets, each with one problem that passes code review on a busy day and bites in production. Tap the line where it goes wrong, pick what is wrong, and check.

Read each snippet for **what happens under real conditions**: errors, many rows, many users, a component that gets destroyed, input from an attacker.`,
        },
        {
          kind: 'bug',
          id: 'bug-async-void',
          topic: 'async',
          lang: 'csharp',
          code: `public class OrdersController : ControllerBase
{
    [HttpPost("orders/{id}/confirm")]
    public IActionResult Confirm(int id)
    {
        SendConfirmationEmail(id);
        return Ok();
    }

    private async void SendConfirmationEmail(int id)
    {
        var order = await _orders.GetAsync(id);
        await _email.SendAsync(order.CustomerEmail, "Order confirmed");
    }
}`,
          bugLines: [6, 10],
          options: [
            'The route template needs a leading slash',
            'async void can’t be awaited: the request returns before the email is sent, and an exception in it can crash the process',
            'IActionResult should be ActionResult<T>',
            'GetAsync needs ConfigureAwait(false)',
          ],
          answer: 1,
          why: 'Nothing can await an async void method, so Confirm returns 200 straight away and nobody observes failures. In ASP.NET Core an exception thrown from async void is unhandled and can take down the whole process. The method may also run after the request ends, when scoped services such as a DbContext are already disposed.',
          fix: 'Return a Task and await it: `private async Task SendConfirmationEmailAsync(int id)` and `public async Task<IActionResult> Confirm(int id) { await SendConfirmationEmailAsync(id); return Ok(); }`. If the email must not slow the response, put it on a background queue (a hosted service or an outbox table) instead.',
        },
        {
          kind: 'bug',
          id: 'bug-ef-n-plus-one',
          topic: 'data-access',
          lang: 'csharp',
          code: `public async Task<List<OrderDto>> GetRecentOrders()
{
    var orders = await _db.Orders
        .Where(o => o.CreatedAt > DateTime.UtcNow.AddDays(-7))
        .ToListAsync();

    var result = new List<OrderDto>();
    foreach (var order in orders)
    {
        var customer = await _db.Customers.FindAsync(order.CustomerId);
        result.Add(new OrderDto(order.Id, customer!.Name, order.Total));
    }
    return result;
}`,
          bugLines: [10],
          options: [
            'DateTime.UtcNow should be DateTime.Now',
            'One extra query per order (N+1): 2,000 orders can mean up to 2,001 database round trips',
            'ToListAsync should be ToList',
            'OrderDto should be a class, not a record',
          ],
          answer: 1,
          why: 'FindAsync runs a query for each customer it has not loaded yet, so the loop makes one round trip per order. With 10 test orders it feels instant; with thousands in production the endpoint takes seconds and loads the database.',
          fix: 'Fetch everything in one query with a projection: `_db.Orders.Where(o => o.CreatedAt > cutoff).Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total)).ToListAsync()`. `.Include(o => o.Customer)` also works when you need the full entities.',
        },
        {
          kind: 'bug',
          id: 'bug-stale-closure',
          topic: 'frontend-state',
          lang: 'typescript',
          code: `function Stopwatch() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(seconds + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{seconds} s</p>;
}`,
          bugLines: [6, 9],
          options: [
            'clearInterval should be clearTimeout',
            'The interval callback captured seconds = 0, so the display sticks at 1',
            'useState needs a type argument',
            'The effect should return the interval id',
          ],
          answer: 1,
          why: 'With an empty dependency array the effect runs once, and its callback closes over `seconds` from the first render, which is 0. Every tick sets the value to 0 + 1, so the stopwatch shows 1 forever. Linters flag this as a missing dependency.',
          fix: 'Use the updater form, which always gets the latest value: `setSeconds((s) => s + 1)`. Adding `seconds` to the dependency array also works, but it tears down and recreates the interval every second.',
        },
        {
          kind: 'bug',
          id: 'bug-angular-subscribe',
          topic: 'frontend-state',
          lang: 'typescript',
          code: `@Component({ selector: 'app-price', template: '{{ price }}' })
export class PriceComponent implements OnInit {
  price = 0;

  constructor(private prices: PriceService) {}

  ngOnInit() {
    this.prices.live$('BTC').subscribe((p) => {
      this.price = p;
    });
  }
}`,
          bugLines: [8],
          options: [
            'price should be a string',
            'The subscription is never ended: the live stream keeps running after the component is destroyed, and every visit adds another',
            'The subscription should be made in the constructor',
            'OnInit should be replaced with AfterViewInit',
          ],
          answer: 1,
          why: '`live$` is a long-lived stream (a WebSocket or polling timer). Destroying the component does not stop the subscription, so it keeps running, holds the component in memory and repeats its work. Navigate back and forth ten times and ten streams are running.',
          fix: 'End it with the component: inject `DestroyRef` and use `this.prices.live$("BTC").pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)`. Or expose `price$ = this.prices.live$("BTC")` and render `{{ price$ | async }}`; the async pipe unsubscribes for you.',
        },
        {
          kind: 'bug',
          id: 'bug-sql-fstring',
          topic: 'security',
          lang: 'python',
          code: `def find_user(conn, email):
    cur = conn.cursor()
    cur.execute(f"SELECT id, name FROM users WHERE email = '{email}'")
    return cur.fetchone()`,
          bugLines: [3],
          options: [
            'fetchone should be fetchall',
            "The email is pasted into the SQL text, so input like ' OR '1'='1 rewrites the query (SQL injection)",
            'f-strings are slower than % formatting',
            'SELECT * would be more flexible',
          ],
          answer: 1,
          why: "Whatever the caller sends becomes part of the SQL. An email of `' OR '1'='1` returns the first user, and worse payloads can read or change other tables. Escaping by hand is easy to get wrong.",
          fix: 'Pass the value as a parameter and let the driver handle it: `cur.execute("SELECT id, name FROM users WHERE email = %s", (email,))`. The placeholder depends on the driver: `%s` for psycopg, `?` for sqlite3.',
        },
      ],
    },

    // 6 ─────────────────────────────────────────────────────────────
    {
      id: 'sql-indexes',
      title: 'SQL indexes, really',
      pillar: 'stack',
      slot: 'extra',
      steps: [
        {
          kind: 'explain',
          title: 'How an index gets used',
          body: `A typical index is a B-tree sorted by its columns, like a phone book sorted by last name, then first name.

- A **composite index** on \`(customer_id, created_at)\` is sorted by customer first. It can find "customer 42 after January" quickly, but not "anyone after January": that is like searching a phone book by first name.
- Wrapping the column in a function, as in \`WHERE LOWER(email) = ...\`, hides the sorted values, so the database scans instead.
- A **covering index** holds every column a query needs, so the database never has to visit the table.
- Every index is extra work on each insert, update and delete, and extra storage.`,
        },
        {
          kind: 'quiz',
          id: 'sql-composite-order',
          topic: 'sql-indexing',
          prompt: 'There is an index on (customer_id, created_at). Which query can use it to jump straight to the rows?',
          options: [
            "WHERE created_at > '2026-01-01'",
            "WHERE customer_id = 42 AND created_at > '2026-01-01'",
            "WHERE YEAR(created_at) = 2026",
            "WHERE customer_id + 0 = 42",
          ],
          answer: 1,
          why: 'An index can seek on its leftmost columns. With customer_id fixed, the matching created_at values sit next to each other in the index. Filtering only on created_at skips the first column, and `YEAR(...)` or `customer_id + 0` hide the column inside an expression.',
        },
        {
          kind: 'quiz',
          id: 'sql-function-on-column',
          topic: 'sql-indexing',
          prompt: "`WHERE LOWER(email) = 'ana@example.com'` is slow even though email has an index. Why?",
          options: [
            'LOWER is slow to compute',
            'The function hides the stored values from the index, so every row is checked',
            'Indexes do not work on text columns',
            'The index needs to be rebuilt',
          ],
          answer: 1,
          why: 'The index is sorted by `email`, not by `LOWER(email)`, so the database cannot seek and scans instead. Fixes: store emails already lower-cased, use a case-insensitive collation, or index the expression itself (an expression index in PostgreSQL, an indexed computed column in SQL Server).',
        },
        {
          kind: 'quiz',
          id: 'sql-covering',
          topic: 'sql-indexing',
          prompt: 'What makes an index "covering" for a query?',
          options: [
            'It covers every table in the database',
            'It contains every column the query reads, so the table itself is not touched',
            'It is the primary key',
            'It is on every column of the table',
          ],
          answer: 1,
          why: 'If the index holds all the columns a query needs (for example with INCLUDE columns in SQL Server or PostgreSQL), the database answers from the index alone and skips the lookups into the table. This often turns a slow query fast.',
        },
        {
          kind: 'quiz',
          id: 'sql-index-cost',
          topic: 'sql-indexing',
          prompt: 'Why not just add an index on every column?',
          options: [
            'Databases allow only one index per table',
            'Each index has to be updated on every insert, update and delete, and takes storage',
            'Indexes make reads slower',
            'Indexes stop working after a million rows',
          ],
          answer: 1,
          why: 'Every write has to update each index on the table, so heavy indexing slows inserts and updates and uses memory and disk. Index the columns your real queries filter, join and sort on.',
        },
      ],
    },

    // 7 ─────────────────────────────────────────────────────────────
    {
      id: 'mock-url-shortener',
      title: 'Mock interview: URL shortener',
      pillar: 'design',
      slot: 'extra',
      steps: [
        {
          kind: 'mock',
          id: 'mock-url',
          topic: 'design-flow',
          prompt:
            'Design a URL shortener like the ones used in marketing emails. Users paste a long URL and get a short link; anyone opening the short link is redirected. Walk me through your design.',
          followUps: [
            'Let’s say 100 million new links a month and 100 redirects per new link. Roughly how many requests per second, and how much storage over five years?',
            'How do you generate the short codes? What happens if two links get the same code?',
            'Redirects must feel instant worldwide. How do you keep redirect latency low?',
            'Marketing wants click analytics per link. How do you add that without slowing redirects down?',
          ],
          rubric: [
            'Asked about requirements first (custom aliases, expiry, read/write ratio)',
            'Gave rough estimates for traffic and storage',
            'Defined the API (create link, redirect)',
            'Described the data model (code → long URL, owner, created/expiry)',
            'Explained how to scale reads: cache, CDN or replicas',
            'Named at least one trade-off and when you would change it',
          ],
        },
      ],
    },

    // 8 ─────────────────────────────────────────────────────────────
    {
      id: 'story-built-system',
      title: 'Your story: a system you built',
      pillar: 'stories',
      slot: 'extra',
      steps: [
        {
          kind: 'story',
          id: 'story-proud-system',
          topic: 'behavioural',
          prompt: 'Tell me about a system you built and are proud of.',
          hints: [
            'Backend or API work is a strong fit: routing, auth, rate limits, or a migration you led.',
            'Front-end or mobile work counts too: an app you shipped, offline sync, a tricky release.',
            'Pick one where you made a real decision, and say what you would do differently now.',
          ],
        },
      ],
    },
  ],
});
