/** Unit 3 lesson data. Validated when unit3.ts assembles the unit. */

const SYNC_OVER_ASYNC = `[HttpGet("orders/{id}")]
public IActionResult GetOrder(int id)
{
    var order = _orders.GetByIdAsync(id).Result;
    if (order is null)
    {
        return NotFound();
    }

    return Ok(order);
}`;

export const dotnetAsync = {
  id: 'dotnet-async',
  title: '.NET async, under the hood',
  pillar: 'stack',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'What await gives back',
      visual: 'await-threads',
      body: `A web server has a limited pool of threads. Most of what a request does is **wait**: for the database, for another service, for a file.

If a thread waits by **blocking**, it is held the whole time and can do nothing else. With \`await\`, the method is paused at that point and its thread **goes back to the pool**. When the I/O finishes, any free thread picks the method up where it left off. The compiler makes this possible by rewriting an \`async\` method into a state machine.

So \`async\` does not make one request faster. It lets the same few threads carry far more requests at once. Compare the two modes above, then raise the number of requests.`,
    },
    {
      kind: 'explain',
      title: 'The four things interviewers ask about',
      body: `- **Blocking on async code.** Calling \`.Result\` or \`.Wait()\` on a task holds a thread until it completes, which throws the benefit away. In ASP.NET Core this does not deadlock, but under load it causes **thread-pool starvation**: every thread is stuck waiting, new requests queue for a thread, and the service crawls while the CPU sits idle. The classic **deadlock** from \`.Result\` happens where a synchronisation context exists, as in desktop UI apps and the older ASP.NET.
- **Async all the way.** One blocking call anywhere in the chain reintroduces the problem, so \`async\` goes from the controller down to the I/O call.
- **Sequential or concurrent.** Awaiting three independent calls one after another takes the sum of their times. Starting all three and awaiting \`Task.WhenAll\` takes about as long as the slowest.
- **\`ConfigureAwait(false)\`.** It tells an await not to return to the captured context. It matters in library code that might be called from a UI app. It makes no difference in ASP.NET Core request code, which has no such context.

Also pass a \`CancellationToken\` down the chain, so work stops when the caller has gone away.`,
    },
    {
      kind: 'quiz',
      id: 'net-await-thread',
      topic: 'dotnet-async',
      prompt: 'A request handler awaits a database call that takes 200 ms. What is its thread doing during those 200 ms?',
      options: [
        'Blocked, waiting for the database',
        'Looping, checking whether the result has arrived',
        'Nothing for this request: it went back to the pool and can serve others',
        'Waiting on a second thread that was created for the call',
      ],
      answer: 2,
      why: 'At the await the method is suspended and its thread is released. No thread is waiting on the database at all; the operating system signals when the I/O completes, and a pool thread then resumes the method. That is why awaiting I/O scales, and why wrapping I/O in an extra thread only adds cost.',
    },
    {
      kind: 'quiz',
      id: 'net-result-starvation',
      topic: 'dotnet-async',
      prompt: 'Under load, an ASP.NET Core API that calls .Result on async methods becomes very slow, although CPU use is low. Why?',
      options: [
        'The garbage collector is running constantly',
        'Each blocked call holds a pool thread that is doing nothing, so the pool runs out and new requests wait for a thread',
        '.Result runs the async method twice',
        'The database is rejecting connections',
      ],
      answer: 1,
      why: 'This is thread-pool starvation. Every .Result parks a thread until its task finishes, and the pool only adds threads slowly, so requests pile up waiting for one. Low CPU with high latency is the giveaway: the threads are not working, they are waiting. Awaiting the calls releases those threads.',
    },
    {
      kind: 'quiz',
      id: 'net-when-all',
      topic: 'dotnet-async',
      prompt:
        'A page needs three independent API calls of about 300 ms each, written as "var a = await GetA(); var b = await GetB(); var c = await GetC();". How long does that take, and what is the fix?',
      options: [
        'About 300 ms; await already runs them in parallel',
        'About 900 ms; wrap each call in Task.Run',
        'About 300 ms; nothing needs fixing',
        'About 900 ms; start all three, then await Task.WhenAll to finish in about 300 ms',
      ],
      answer: 3,
      why: 'Each await waits for its call to finish before the next line starts the next one, so the times add up. Calling all three methods first starts all three operations, and awaiting Task.WhenAll waits for them together. Task.Run is for moving CPU-bound work off a thread and does nothing useful for I/O that is already asynchronous.',
    },
    {
      kind: 'quiz',
      id: 'net-configure-await',
      topic: 'dotnet-async',
      prompt: 'Where does ConfigureAwait(false) make a difference?',
      options: [
        'In library code that may be called under a synchronisation context, such as from a desktop UI app',
        'Everywhere; it makes every await faster',
        'Only inside ASP.NET Core controllers',
        'Nowhere; it no longer does anything',
      ],
      answer: 0,
      why: 'By default an await resumes on the context it started in, which in a UI app is the single UI thread. A library that does not need that context says ConfigureAwait(false), which avoids deadlocks when a caller blocks and saves a hop. ASP.NET Core request code has no such context, so there it makes no difference.',
    },
    {
      kind: 'bug',
      id: 'bug-sync-over-async',
      topic: 'dotnet-async',
      lang: 'csharp',
      code: SYNC_OVER_ASYNC,
      bugLines: [4],
      options: [
        'GetByIdAsync cannot be called from a controller',
        'NotFound() has to be awaited',
        '.Result blocks a pool thread until the query finishes, and under load the pool runs out of threads',
        '"is null" does not work on reference types',
      ],
      answer: 2,
      why: 'The action is synchronous, so it blocks on the task. Each request then holds a thread for the whole database call. It works in testing and fails under traffic through thread-pool starvation: requests queue for a thread and response times climb while the CPU is idle. If the task fails, .Result also wraps the error in an AggregateException.',
      fix: 'Make the action asynchronous and await the call: `public async Task<IActionResult> GetOrder(int id, CancellationToken ct)` with `var order = await _orders.GetByIdAsync(id, ct);`. Keep it async all the way down to the database call.',
    },
  ],
};

export const aiPromptBudget = {
  id: 'ai-prompt-budget',
  title: 'Writing a prompt inside a budget',
  pillar: 'ai',
  slot: 'lesson',
  steps: [{ kind: 'explain', title: 'Writing a prompt inside a budget', body: 'Coming soon.' }],
};

export const mockNewsFeed = {
  id: 'mock-news-feed',
  title: 'Mock interview: news feed',
  pillar: 'design',
  slot: 'extra',
  steps: [{ kind: 'explain', title: 'Mock interview: news feed', body: 'Coming soon.' }],
};

export const storyTradeoff = {
  id: 'story-tradeoff',
  title: 'Your story: a trade-off you argued for',
  pillar: 'stories',
  slot: 'extra',
  steps: [{ kind: 'explain', title: 'Your story: a trade-off you argued for', body: 'Coming soon.' }],
};
