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

const SUPPORT_NOTES = `Fernhill Outdoor: customer care notes (internal)

About us. Fernhill Outdoor was founded in 2011 by two climbing instructors and started as a market stall selling second-hand rope bags. We now sell tents, sleeping bags, stoves and clothing online, and we are proud that most of the team still spends weekends outdoors. Our values are honesty, patience and getting people outside.

Office hours. The care team works Monday to Friday, 08:00 to 18:00, and Saturday 09:00 to 13:00. We are closed on public holidays. The warehouse works different hours and should not be phoned directly.

Refunds. Customers can return unused items within 30 days of delivery for a full refund. The item must be unused and in its original packaging. Used items can be returned only if they are faulty. Refunds go back to the original payment method and normally arrive within 5 to 7 working days after the return reaches our warehouse. We never refund in cash or to a different card.

Faulty items. If an item is faulty within 12 months of delivery, the customer can choose a repair, a replacement or a refund. Ask for a photo of the fault and the order number. Do not ask the customer to diagnose the fault.

Return shipping. For faulty items we send a prepaid label. For change-of-mind returns the customer pays return postage. Remember: unused items, 30 days, original packaging.

Exceptions. Anything outside these rules (a return after 30 days, a missing receipt, an item bought as a gift) can only be approved by a care team lead. Any refund above 400 euros also needs a team lead, even when it is within the rules. Agents and assistants must not promise an exception. Say that a team lead will review it and reply within 2 working days.

Never promise. Never promise a delivery date for a replacement, never promise that a refund has already arrived, and never offer compensation, vouchers or discounts. Only a team lead can offer those.

Shipping. Standard delivery takes 3 to 5 working days, express takes 1 to 2. We ship to 14 countries. Stoves and gas canisters cannot be sent by air. Free delivery applies to orders above 80 euros, and the threshold was 60 euros until last spring.

Tone. Write the way a helpful person in an outdoor shop would talk: warm, plain, short. No exclamation marks in apologies. Use the customer's first name. Sign off as "Fernhill Care".

Handing over. If the customer is angry, mentions a legal claim or a safety problem, or asks something these notes do not cover, do not guess. Tell them a member of the team will take over, and flag the conversation for a person.

Reminder for new starters. Please keep your desk tidy, the returns shelf is by the back door, and remember that refunds are 30 days for unused items in original packaging.`;

export const aiPromptBudget = {
  id: 'ai-prompt-budget',
  title: 'Writing a prompt inside a budget',
  pillar: 'ai',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'What a prompt needs, and what it can lose',
      body: `Some interviews now include a small prompt-writing task with a limit: "write a prompt for this job in under so many tokens". The limit is realistic. A system prompt is sent with **every** request, so each token in it is paid for again and again, and it takes room that the conversation and the documents also need.

A prompt that works usually says five things:

- **Who** the model is answering as, and for whom.
- **The task**, in a sentence or two.
- **The facts it may use.** Only the ones this task needs.
- **What to do when the answer is not in those facts.** Without this, a model tends to fill the gap with something that sounds right.
- **The output:** length, tone, format.

What goes first when you are over budget: background that does not change the answer, anything said twice, and long examples. What stays: the task, the constraints, the format, and the instruction for the unknown case.

In the exercise that follows, the notes you are given are deliberately longer than the budget, so you have to choose.`,
    },
    {
      kind: 'quiz',
      id: 'ai-prm-unknown',
      topic: 'ai-prompts',
      prompt: 'A support assistant’s prompt lists the refund rules. A customer asks about something the rules do not cover. What should the prompt have told the model to do?',
      options: [
        'Give its best guess, since some answer is better than none',
        'Reply with the full list of rules',
        'Say it cannot answer that, and hand over to a person without guessing',
        'Ask the customer to rephrase until the question matches a rule',
      ],
      answer: 2,
      why: 'Left without an instruction, a model usually produces a confident, plausible answer, and in support that means promising something the company never offered. One explicit line about the unknown case prevents the most expensive kind of mistake, which is why it survives every round of cutting.',
      lookUp: 'grounding and handling out-of-scope questions in prompts',
    },
    {
      kind: 'quiz',
      id: 'ai-prm-cut-first',
      topic: 'ai-prompts',
      prompt: 'Your refund-assistant prompt is 30% over budget. Which part is the safest to cut?',
      options: [
        'The company’s history and values',
        'The instruction for what to do when the answer is unknown',
        'The description of the reply’s tone and format',
        'The refund window and who approves exceptions',
      ],
      answer: 0,
      why: 'Ask of each part: would the reply be different without it? The company history changes nothing about a refund reply. The other three all change what the model writes, so losing any of them makes replies wrong, inconsistent or unsafe.',
      lookUp: 'system prompt design and context selection',
    },
    {
      kind: 'prompt',
      id: 'prompt-support-reply',
      topic: 'ai-prompts',
      brief:
        'You are building an assistant that drafts replies to customer emails about refunds for an online shop, Fernhill Outdoor. Write the system prompt it will run with. It must fit in about 350 tokens.',
      material: SUPPORT_NOTES,
      budget: 350,
      rubric: [
        'Says who the assistant is replying as, and to whom',
        'States the task in one or two sentences',
        'Includes the policy facts a reply needs, and leaves the rest out',
        'Says what to do when the answer is not in those facts: hand over to a person, never guess',
        'Specifies the reply’s length, tone and format',
        'No repeated instructions or filler',
      ],
    },
  ],
};

export const mockNewsFeed = {
  id: 'mock-news-feed',
  title: 'Mock interview: news feed',
  pillar: 'design',
  slot: 'extra',
  steps: [
    {
      kind: 'mock',
      id: 'mock-feed',
      topic: 'design-feed',
      prompt:
        'Design the home feed for a social app. Users follow other users, and the feed shows recent posts from the people they follow. Walk me through your design.',
      followUps: [
        'Say 50 million daily users, each opening the feed about 10 times a day and posting about once every two days. Roughly what are the read and write rates, and what does the ratio tell you?',
        'Do you build a user’s feed when someone they follow posts, or when they open the app? Talk me through the trade-off.',
        'One account has ten million followers. What happens to your design when they post?',
        'A user scrolls down while new posts keep arriving at the top. How do you page through the feed without showing a post twice or skipping one?',
        'A user posts and does not see their own post in the feed for a few seconds. Is that acceptable? Where in this system can data be stale, and where can it not?',
      ],
      rubric: [
        'Asked about requirements first (ordering, media, how fresh the feed has to be)',
        'Gave rough read and write rates and noticed the system is read-heavy',
        'Compared building feeds when a post is written with building them when the feed is read, and chose with reasons',
        'Handled accounts with huge follower counts differently from ordinary ones',
        'Used cursor pagination, not page numbers',
        'Said where replication lag or eventual consistency is fine, and kept the author’s own posts current',
        'Named a shard key for posts or feeds and what it makes expensive',
        'Named at least one trade-off and when you would revisit it',
      ],
    },
  ],
};

export const storyTradeoff = {
  id: 'story-tradeoff',
  title: 'Your story: a trade-off you argued for',
  pillar: 'stories',
  slot: 'extra',
  steps: [
    {
      kind: 'story',
      id: 'story-argued-tradeoff',
      topic: 'behavioural',
      prompt: 'Tell me about a time you argued for a technical trade-off. What happened?',
      hints: [
        'Name the options that were on the table, including the one you did not pick.',
        'Say what your choice gave up. A trade-off with no cost is not one.',
        'Describe how you made the case: data, a prototype, a risk you pointed out.',
        'If you lost the argument, that works too. Say what you did next and what you think now.',
      ],
    },
  ],
};
