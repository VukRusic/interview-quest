/** Unit 2 design lessons. Validated when unit2.ts assembles the unit. */

export const loadBalancing = {
  id: 'load-balancing',
  title: 'Load balancing',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'One server is one point of failure',
      visual: 'load-balancer',
      body: `With a single app server, two things are true: when it crashes the whole product is down, and you can never serve more than that one machine can handle.

A **load balancer** sits in front of several identical servers. It spreads incoming requests across them and runs **health checks**: it pings each server every few seconds and stops sending traffic to one that fails to answer.

Try it above. Send requests, stop a server, send again. Then switch the load balancer off and stop server 1.`,
    },
    {
      kind: 'explain',
      title: 'What makes it work',
      body: `- **Stateless servers.** Any server must be able to answer any request. Anything that has to survive between requests (the login session, a shopping cart) lives in a shared store such as Redis or the database, or travels with the request as a signed token. If it lives in one server's memory, the user loses it whenever the next request lands elsewhere.
- **How requests are spread.** **Round robin** hands them out in turn, which is fine when requests cost about the same. **Least connections** sends each new request to the server with the fewest in progress, which copes better when some requests take far longer than others.
- **Layer 4 and layer 7.** A layer 4 balancer sees only IP addresses and ports, so it forwards connections without reading them. A layer 7 balancer reads the HTTP request, so it can route by path, host or header.
- **The balancer must not be the new weak spot.** In practice it runs as a redundant pair or as a managed cloud service spread across zones.`,
    },
    {
      kind: 'quiz',
      id: 'lb-health-check',
      topic: 'load-balancing',
      prompt: 'One of four servers behind a load balancer crashes. What stops users from being sent to it?',
      options: [
        'The DNS record for the crashed server expires',
        'Health checks: the balancer probes each server and stops routing to one that fails',
        'The crashed server tells the balancer it is going down',
        'Browsers automatically retry against a different server',
      ],
      answer: 1,
      why: 'The load balancer keeps probing every server, usually an HTTP endpoint such as /health, and takes a server out of rotation after a few failed probes. A crashed server cannot announce anything, which is exactly why the check has to come from outside.',
    },
    {
      kind: 'quiz',
      id: 'lb-session-state',
      topic: 'load-balancing',
      prompt: 'After you add a second server, users are randomly logged out. What is the most likely cause?',
      options: [
        'The load balancer strips cookies from requests',
        'The second server has a slower CPU',
        'Sessions are kept in each server’s memory, so the other server does not recognise the user',
        'Round robin is the wrong algorithm for logins',
      ],
      answer: 2,
      why: 'The session was created in server A’s memory, and the next request went to server B, which has never seen it. Move sessions to a shared store or use a signed token. Sticky sessions (always sending a user to the same server) hide the problem but bring it back whenever that server dies or is redeployed.',
    },
    {
      kind: 'quiz',
      id: 'lb-least-connections',
      topic: 'load-balancing',
      prompt: 'Most requests take 10 ms, but report exports take 10 seconds. Which algorithm spreads the work more evenly than round robin?',
      options: ['Least connections', 'Random', 'Always the first healthy server', 'Round robin with more servers'],
      answer: 0,
      why: 'Round robin counts requests, not work, so one server can be handed several long exports in a row while the others sit idle. Least connections looks at how many requests each server is still working on and sends the new one to the least busy.',
    },
    {
      kind: 'quiz',
      id: 'lb-l4-l7',
      topic: 'load-balancing',
      prompt: 'You want /api/* to go to the API servers and /images/* to the image servers. Which kind of load balancer can do that?',
      options: [
        'Layer 4, because it is faster',
        'Layer 7, because it reads the HTTP request',
        'Either one, the path is in every packet',
        'Neither; this needs DNS',
      ],
      answer: 1,
      why: 'Routing by path needs something that understands HTTP, and that is a layer 7 (application) load balancer. A layer 4 balancer works on TCP connections: it sees addresses and ports and never looks inside, which makes it simple and fast but blind to paths and headers.',
    },
    {
      kind: 'quiz',
      id: 'lb-spof',
      topic: 'load-balancing',
      prompt: 'You put one load balancer in front of three servers. What is the single point of failure now?',
      options: ['The database connection pool', 'Whichever server is busiest', 'The load balancer itself', 'There is none'],
      answer: 2,
      why: 'Every request now passes through the balancer, so if it dies nothing reaches the three healthy servers. That is why balancers run as a redundant pair or as a managed service across zones. Interviewers often ask this as a follow-up right after you draw the box.',
    },
  ],
};

export const queues = {
  id: 'queues',
  title: 'Queues and background work',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'Don’t make the user wait for slow work',
      visual: 'queue-buffer',
      body: `Some work is slow or can fail for reasons outside your control: sending an email, resizing an image, calling another company's API. Doing it inside the request makes the user wait and ties your uptime to theirs.

With a **queue**, the request does the minimum, puts a small message on the queue ("send the receipt for order 42") and answers straight away. A separate **worker** takes messages off the queue and does the slow part.

A queue also **absorbs bursts**. When messages arrive faster than workers can handle them, they wait instead of being rejected, and the workers catch up afterwards. Move the slider above past what the worker can handle, with and without the queue.`,
    },
    {
      kind: 'explain',
      title: 'What a queue asks of you in return',
      body: `- **Duplicates.** Most queues promise **at-least-once** delivery: if a worker crashes before confirming a message, the message is delivered again. A worker must be safe to run twice on the same message.
- **Poison messages.** A message that always fails would be retried forever. After a few attempts it is moved to a **dead-letter queue** where someone can look at it, and the rest keep flowing.
- **A growing backlog.** Queue depth, and the age of the oldest message, tell you whether workers are keeping up. Steady growth means you need more or faster workers.
- **"Accepted" is not "done".** The user gets an answer before the work has happened, so the API returns something they can check later, and the screen says "we're processing your order", not "your order is complete".`,
    },
    {
      kind: 'quiz',
      id: 'q-good-fit',
      topic: 'queues',
      prompt: 'Which task is the best fit for a queue?',
      options: [
        'Checking a password at login',
        'Loading a product page',
        'Generating a PDF invoice and emailing it after checkout',
        'Validating a form field as the user types',
      ],
      answer: 2,
      why: 'The invoice is slow, depends on an email provider, and the customer does not need it before the checkout page answers. The other three are things the user is waiting for right now, so they have to happen inside the request.',
    },
    {
      kind: 'quiz',
      id: 'q-backlog',
      topic: 'queues',
      prompt: 'The number of messages waiting in a queue has grown steadily for an hour. What does that tell you?',
      options: [
        'The queue is broken and losing messages',
        'Messages are arriving faster than the workers process them',
        'The producers are too slow',
        'Nothing; queues always grow',
      ],
      answer: 1,
      why: 'A queue only grows while more goes in than comes out. A short bump during a burst is the queue doing its job; steady growth means the workers cannot keep up, so you add workers, make each one faster, or find the message that is making them fail and retry.',
    },
    {
      kind: 'quiz',
      id: 'q-duplicates',
      topic: 'queues',
      prompt: 'Your queue promises at-least-once delivery. What must every worker be ready for?',
      options: [
        'Messages arriving in alphabetical order',
        'Messages being lost without notice',
        'The same message arriving more than once',
        'Messages arriving only once a second',
      ],
      answer: 2,
      why: 'At-least-once means the queue will redeliver when it is not sure a message was handled, for example when a worker finishes the work and crashes before confirming. The worker has to be idempotent: check whether this order’s email was already sent, or use a unique key so the second run changes nothing.',
    },
    {
      kind: 'quiz',
      id: 'q-dead-letter',
      topic: 'queues',
      prompt: 'One malformed message makes the worker crash every time, so it is redelivered again and again. What is the standard fix?',
      options: [
        'Delete the queue and recreate it',
        'After a few failed attempts, move the message to a dead-letter queue',
        'Add more workers',
        'Increase the message size limit',
      ],
      answer: 1,
      why: 'A dead-letter queue is a side queue for messages that failed too many times. It gets the bad message out of the way so the rest keep flowing, and keeps it so someone can inspect it and replay it after a fix. More workers would only crash on it faster.',
    },
    {
      kind: 'quiz',
      id: 'q-accepted',
      topic: 'queues',
      prompt: 'An API puts each new order on a queue and answers immediately. What should it answer?',
      options: [
        '200 OK with the finished, shipped order',
        'Nothing; the client should assume it worked',
        'It should keep the connection open until a worker finishes',
        '202 Accepted, with an order id the client can use to check the status',
      ],
      answer: 3,
      why: '202 Accepted says "I have your request and will process it", which is the truth. The id lets the client poll or be notified when it is done. Claiming the order is finished would be a lie, and holding the connection open throws away the reason for using a queue.',
    },
  ],
};

const RETRY_CHARGE = `public async Task<ChargeResult> ChargeAsync(Order order)
{
    for (var attempt = 1; attempt <= 5; attempt++)
    {
        try
        {
            var response = await _http.PostAsJsonAsync("/charges", new
            {
                amount = order.Total,
                customerId = order.CustomerId
            });
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ChargeResult>();
        }
        catch (HttpRequestException)
        {
            // try again
        }
    }
    throw new PaymentFailedException(order.Id);
}`;

const FETCH_NO_TIMEOUT = `app.get('/orders/:id', async (req, res) => {
  const order = await db.orders.findById(req.params.id);

  const response = await fetch(\`\${SHIPPING_URL}/track/\${order.trackingId}\`);
  const tracking = await response.json();

  res.json({ ...order, tracking });
});`;

export const retries = {
  id: 'retries-idempotency',
  title: 'Timeouts, retries and idempotency',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'When something you depend on is slow',
      visual: 'retry-storm',
      body: `Every call over a network needs a **timeout**. Without one, a dependency that hangs makes your requests hang too. They pile up holding threads and connections until your service stops answering anything, including requests that never needed that dependency.

A **retry** fixes brief failures, but it also multiplies load. If every client retries at once, a service that was merely struggling gets buried. That is a **retry storm**.

The fix has two parts. **Exponential backoff**: wait longer after each failure (1 s, 2 s, 4 s) and give up after a few attempts. **Jitter**: add a random amount to each wait so clients that failed together don't retry together. Compare the three strategies above.`,
    },
    {
      kind: 'explain',
      title: 'Retrying safely',
      body: `A timeout tells you that you did not get an answer. It does **not** tell you whether the other side did the work. The request may have succeeded and only the response was lost.

That is harmless for an **idempotent** operation, where doing it twice leaves the same result as doing it once: reading data, or setting a value. It is dangerous for "charge the card" or "place the order".

An **idempotency key** makes those safe. The client creates one unique key per operation and sends it with every attempt. The server stores the key with the result, and when the same key arrives again it returns the stored result without doing the work twice.

A **circuit breaker** protects a dependency that keeps failing. After enough failures it "opens": calls fail immediately without being sent. After a pause it lets one trial call through, and closes again if that succeeds.`,
    },
    {
      kind: 'quiz',
      id: 'res-no-timeout',
      topic: 'resilience',
      prompt: 'Your service calls a payment API with no timeout. The payment API starts hanging. What happens to your service?',
      options: [
        'Nothing; only payment requests are affected',
        'Requests pile up waiting until it stops answering anything, even pages that need no payment',
        'The framework cancels the calls after a second',
        'It gets faster, because fewer payments complete',
      ],
      answer: 1,
      why: 'Each hanging call holds a thread or a connection from a limited pool. Once the pool is used up there is nothing left to serve other requests, so one slow dependency takes the whole service down. A timeout turns a hang into a quick, visible error you can handle.',
    },
    {
      kind: 'quiz',
      id: 'res-jitter',
      topic: 'resilience',
      prompt: 'Why add random jitter to the delay between retries?',
      options: [
        'So clients that failed together do not all retry at the same moment',
        'To make retries faster on average',
        'To hide the retry logic from attackers',
        'Because servers reject evenly spaced requests',
      ],
      answer: 0,
      why: 'Clients that hit the same outage fail at the same instant, so with a fixed delay they also retry at the same instant, in waves. Jitter spreads those waves out into a steady trickle. It does not make any single retry faster; it makes the total load survivable.',
    },
    {
      kind: 'quiz',
      id: 'res-timeout-unknown',
      topic: 'resilience',
      prompt: 'Your POST /payments call times out. What do you know about the payment?',
      options: [
        'It failed, so retrying is safe',
        'It succeeded, so retrying is pointless',
        'Nothing: it may have gone through with only the response lost',
        'It is still in progress and will be cancelled',
      ],
      answer: 2,
      why: 'A timeout only says the answer did not arrive in time. The charge may have been made a moment later, or the response may have been lost on the way back. Treating a timeout as a failure is how customers get charged twice, which is the reason idempotency keys exist.',
    },
    {
      kind: 'quiz',
      id: 'res-idempotency-key',
      topic: 'resilience',
      prompt: 'How does an idempotency key make it safe to retry a payment?',
      options: [
        'It encrypts the request so it cannot be replayed',
        'The client checks the key locally before sending',
        'It makes the request finish before the timeout',
        'The server remembers the key and returns the first result when it sees the key again',
      ],
      answer: 3,
      why: 'The key identifies the operation, not the attempt. The server stores it with the outcome, so a second request with the same key gets the saved outcome and no second charge. The client cannot do this check itself, because the whole problem is that the client does not know what happened.',
    },
    {
      kind: 'quiz',
      id: 'res-breaker-open',
      topic: 'resilience',
      prompt: 'A circuit breaker around a dependency is "open". What does that mean?',
      options: [
        'Calls are flowing through normally',
        'Calls are skipped and fail immediately for a while, to give the dependency room to recover',
        'The dependency has been removed from the system',
        'Every call is retried until it succeeds',
      ],
      answer: 1,
      why: 'The name comes from electrical circuits, where an open circuit carries no current. "Open" is the tripped state: calls fail fast without being sent. "Closed" is the normal state. After a pause the breaker goes half-open and lets a trial call through to see whether the dependency is back.',
    },
    {
      kind: 'bug',
      id: 'bug-retry-charge',
      topic: 'resilience',
      lang: 'csharp',
      code: RETRY_CHARGE,
      bugLines: [7, 17],
      options: [
        'PostAsJsonAsync cannot be awaited inside a loop',
        'The loop should run 3 times, not 5',
        'The charge is retried at once with nothing marking it as the same charge, so the customer can be charged twice',
        'HttpClient never throws HttpRequestException',
      ],
      answer: 2,
      why: 'EnsureSuccessStatusCode throws on any error status, including a 502 or 504 from a gateway in front of a provider that did complete the charge. The loop then posts a brand-new charge. It also retries with no pause, which piles load on a provider that is already struggling, and it retries errors that can never succeed, such as a declined card.',
      fix: 'Create one idempotency key per order (for example from the order id) and send it as an `Idempotency-Key` header on every attempt, so the provider returns the first result instead of charging again. Wait between attempts with exponential backoff and jitter, and only retry network errors and 5xx responses, never 4xx.',
    },
    {
      kind: 'bug',
      id: 'bug-fetch-no-timeout',
      topic: 'resilience',
      lang: 'typescript',
      code: FETCH_NO_TIMEOUT,
      bugLines: [4],
      options: [
        'await cannot be used twice in one handler',
        'The fetch has no timeout, so if the shipping service hangs, the order page hangs with it',
        'findById should run after the fetch',
        'res.json needs a status code first',
      ],
      answer: 1,
      why: 'Nothing here limits how long the fetch may wait, and the default is far longer than any user will. When the shipping service is slow, every order page waits on it and requests pile up. Tracking is an extra on this page, yet as written it can take the whole page down.',
      fix: 'Give the call a time limit and let the page work without it: `fetch(url, { signal: AbortSignal.timeout(2000) })` inside a try/catch, and on a timeout or a non-OK response return the order with `tracking: null`. Showing the order without live tracking is far better than showing nothing.',
    },
  ],
};
