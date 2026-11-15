/** Unit 3 design lessons. Validated when unit3.ts assembles the unit. */

const quiz = (id: string, topic: string, prompt: string, options: string[], answer: number, why: string) => ({
  kind: 'quiz',
  id,
  topic,
  prompt,
  options,
  answer,
  why,
});

export const sqlVsNosql = {
  id: 'sql-vs-nosql',
  title: 'SQL or NoSQL?',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'Shape the data for the questions you will ask',
      visual: 'data-shapes',
      body: `A **relational** database stores data as rows in tables and combines them with joins. It gives you transactions, constraints and the freedom to ask questions you did not plan for. For most products it is the right default.

"**NoSQL**" is not one thing. A **document** store keeps a whole object together. A **key-value** store looks things up by one key, very fast. A **wide-column** store handles huge volumes of writes. What they share is that they give up some of what a relational database offers, in exchange for scaling across many machines more easily or fitting one kind of access very well.

Switch the storage above and ask both questions. Neither shape wins: each is cheap for one question and expensive for the other.`,
    },
    {
      kind: 'explain',
      title: 'How to answer "which database?" in an interview',
      body: `Start from the **access patterns**: what is read, what is written, how often, and what must never be wrong.

- Many kinds of query, relationships between things, money or stock involved: relational.
- One simple lookup, enormous volume, each record independent: key-value or document.
- Many real systems use several stores, each for the job it suits. That is a reasonable answer as long as you say what each one is for, and that every extra store is one more thing to run and keep in sync.

"We'd use NoSQL because it scales" is the answer interviewers push back on. Say what you gain, what you give up, and why that trade is right for this workload.`,
    },
    quiz(
      'db-default',
      'data-modelling',
      'You are starting a typical business app: users, orders, payments, reports. The scale is ordinary. Which database is the sensible default?',
      ['A relational database', 'A key-value store', 'A wide-column store', 'Whichever is newest'],
      0,
      'Orders, payments and reports mean relationships, transactions and queries nobody has thought of yet, which is what relational databases are built for. They also scale further than people assume, with indexes, caching and read replicas. A specialised store earns its place when a specific, simple, very high-volume access pattern appears.',
    ),
    quiz(
      'db-access-patterns',
      'data-modelling',
      'What should drive the choice between a relational database and a document or key-value store?',
      [
        'Which one the team used last',
        'Whether the API returns JSON',
        'How the data will be read and written: the queries, their volume, and what must stay consistent',
        'Which has the larger community',
      ],
      2,
      'The same data can be cheap or expensive to work with depending on how it is stored, so the questions you need to ask of it come first. An API returning JSON says nothing about storage: relational databases serve JSON APIs every day.',
    ),
    quiz(
      'db-key-value-fit',
      'data-modelling',
      'Which workload fits a key-value store best?',
      [
        'A monthly revenue report across orders, customers and products',
        'Moving money between two accounts',
        'Searching products by any combination of filters',
        'Session data looked up by session id, millions of times a minute',
      ],
      3,
      'Sessions are independent records fetched by one known key at very high volume, which is exactly what a key-value store does well. The report needs joins and aggregation, the transfer needs a transaction across two records, and flexible filtering needs indexes or a search engine.',
    ),
    quiz(
      'db-transaction',
      'data-modelling',
      'Placing an order must reduce stock, create the order and record the payment, all or nothing. What gives you that most directly?',
      [
        'Three separate writes, each retried until it succeeds',
        'A transaction in a relational database',
        'Eventual consistency',
        'A cache in front of the database',
      ],
      1,
      'A transaction makes the three changes succeed or fail together, and that guarantee is central to relational databases. Three independent writes can leave stock reduced with no order if the process dies in between. Many NoSQL stores make a write to one record atomic, and some offer transactions across records with limits, but it is not what they are designed around.',
    ),
    quiz(
      'db-several-stores',
      'data-modelling',
      'A shop keeps orders in PostgreSQL, sessions in Redis and product search in a search engine. What is this?',
      [
        'A design mistake: one system should have one database',
        'Sharding',
        'A normal design that uses a different store for each access pattern',
        'Replication',
      ],
      2,
      'Each store is doing the job it suits: transactions, fast lookups by key, and text search. The cost to mention is operational: three systems to run, and data that has to be kept in step between them. Sharding and replication are about spreading or copying one dataset, which is a different thing.',
    ),
  ],
};

export const replication = {
  id: 'replication',
  title: 'Replication',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'One leader, several copies',
      visual: 'replication-lag',
      body: `**Replication** keeps copies of the same data on several machines. In the common setup one machine, the **leader** (or primary), takes every write. **Followers** (replicas) receive those changes and can serve reads.

That gives you more capacity for reads, and a copy that can take over if the leader dies.

The catch is timing. With **asynchronous** replication the leader confirms a write as soon as it has it, and followers catch up a moment later. Press "Write" above and look at the follower. Then switch to synchronous and write again.`,
    },
    {
      kind: 'explain',
      title: 'What the delay costs you',
      body: `- **Stale reads.** A user saves a change, the next page reads from a follower that has not received it yet, and the old value appears. The usual fix is **read-your-own-writes**: for a short time after a user writes, read that user's data from the leader.
- **Lost writes on failover.** If the leader dies before a follower received its last writes, those writes are gone when the follower takes over.
- **Synchronous replication** closes the failover gap, because a write is only confirmed once a follower has it. The price is slower writes, and writes that stall when that follower cannot be reached. Many systems keep one follower synchronous and the rest asynchronous, and those other followers still lag, so stale reads remain possible.
- **Two leaders at once.** If a network fault hides the leader and a follower is promoted while the old leader is still running, both accept writes and the data diverges. This is called **split brain**, and failover has to make sure the old leader is really out before a new one starts.

A replica is not a backup. It faithfully copies a mistaken delete within seconds.`,
    },
    quiz(
      'rep-what-for',
      'replication',
      'What do read replicas give you?',
      [
        'More capacity for writes',
        'A backup you can restore after a mistaken delete',
        'More capacity for reads, and a copy that can take over if the leader fails',
        'Stronger consistency',
      ],
      2,
      'Replicas serve reads and stand ready for failover. Every write still goes through the one leader, so write capacity does not grow. They are not a backup either: a wrong delete on the leader is copied to every replica almost at once, which is why backups are kept separately.',
    ),
    quiz(
      'rep-stale-read',
      'replication',
      'A user updates their profile, the page reloads, and the old name is shown. Replication is asynchronous. What happened?',
      [
        'The write failed silently',
        'The reload read from a follower that had not received the write yet',
        'The browser cached the old page',
        'The leader rolled the change back',
      ],
      1,
      'The write reached the leader and was confirmed, but the reload was served by a follower a fraction of a second behind. This is replication lag, and it is the first consequence of adding read replicas. Nothing is broken: the follower will have the new name shortly.',
    ),
    quiz(
      'rep-read-your-writes',
      'replication',
      'What is a common fix for that stale profile?',
      [
        'For a short time after a user writes, read that user’s data from the leader',
        'Add more followers',
        'Give the cache a longer TTL',
        'Change the load balancer from round robin to least connections',
      ],
      0,
      'This is read-your-own-writes. The person who made the change is the one who notices staleness, so only their reads need to go to the leader, and only briefly. Everyone else can keep reading from followers. More followers would not help, because each one lags in the same way.',
    ),
    quiz(
      'rep-sync-trade-off',
      'replication',
      'What is the trade-off of synchronous replication?',
      [
        'Faster writes, but the last writes can be lost in a failover',
        'Reads become slower',
        'It removes the need for backups',
        'No confirmed write is lost if the leader dies, but every write waits for a follower and stalls if it cannot be reached',
      ],
      3,
      'Synchronous means the leader does not confirm until a follower has the data, so a failover cannot lose a confirmed write. The cost lands on writes: they are slower, and they stop if the synchronous follower is down. The first option describes asynchronous replication.',
    ),
    quiz(
      'rep-split-brain',
      'replication',
      'A network fault hides the leader, a follower is promoted, and the old leader is still running. Both accept writes. Why is that dangerous?',
      [
        'Reads become twice as slow',
        'The two copies diverge, and their conflicting writes cannot be cleanly merged afterwards',
        'The followers stop replicating for good',
        'Nothing; two leaders double the write capacity',
      ],
      1,
      'This is split brain. Each leader accepts changes the other never sees, so when the network heals there are two different histories and no correct way to combine them. Failover therefore has to guarantee the old leader is stopped or cut off first, usually by requiring a majority of nodes to agree on who leads.',
    ),
  ],
};

export const sharding = {
  id: 'sharding',
  title: 'Sharding',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'Splitting the data itself',
      visual: 'shard-keys',
      body: `Replication copies the same data to several machines. **Sharding** (or partitioning) splits the data, so each machine holds a different part. It is how you grow past what one machine can store or write.

Every row is assigned to a shard by its **shard key**, and that choice decides almost everything:

- A **hash** of the key spreads rows evenly, but rows that belong together in a range end up scattered.
- A **range** of the key keeps neighbours together, so range queries are cheap, but popular ranges become hot spots.

Switch the key above and compare how evenly the customers spread, and how many shards one query has to ask.`,
    },
    {
      kind: 'explain',
      title: 'Why you shard late',
      body: `- **Hot shards.** If one key is far busier than the rest (a celebrity, one huge customer), its shard is overloaded while the others idle.
- **Queries across shards.** Anything that is not looked up by the shard key has to ask every shard and merge the results. Joins and transactions across shards are slow or unavailable.
- **Rebalancing.** With "shard = hash(key) mod N", changing N moves most of the data. **Consistent hashing** is the technique that keeps that to a small fraction.
- **It is hard to undo.** The shard key is baked into how the application reads and writes.

So the usual order is: indexes, caching, read replicas, a bigger machine, and only then sharding. Saying that order out loud is a good sign in an interview.`,
    },
    quiz(
      'shard-vs-replication',
      'sharding',
      'How is sharding different from replication?',
      [
        'Sharding copies the same data to several machines; replication splits it',
        'Sharding splits the data so each machine holds a different part; replication copies the same data to several machines',
        'They are two names for the same thing',
        'Sharding is for reads and replication is for writes',
      ],
      1,
      'Replication is about copies: more read capacity and a spare if a machine dies. Sharding is about parts: more total storage and write capacity. Large systems use both, so each shard is itself a leader with followers.',
    ),
    quiz(
      'shard-hot',
      'sharding',
      'Posts are sharded by author id. One celebrity has 50 million followers reading their posts. What goes wrong?',
      [
        'The celebrity’s posts are spread too thinly across shards',
        'Writes from other users start failing validation',
        'That author’s shard gets far more traffic than the others',
        'Nothing; hashing makes every shard equally busy',
      ],
      2,
      'Hashing spreads keys evenly, not traffic. All of one author’s posts live on one shard, so a single very popular author makes it a hot shard. The usual answers are heavy caching for such keys, or treating the few huge accounts differently from everyone else.',
    ),
    quiz(
      'shard-range-query',
      'sharding',
      'Events are sharded by a hash of the event id. Which query becomes expensive?',
      [
        'Fetch one event by its id',
        'Insert a new event',
        'Delete one event by its id',
        'All events between 1 March and 7 March',
      ],
      3,
      'A hash scatters neighbouring values, so a date range has matching events on every shard, and the query must ask them all and merge the answers. Anything addressed by the id goes straight to one shard. If date ranges are the main query, the date belongs in the shard key.',
    ),
    quiz(
      'shard-rebalance',
      'sharding',
      'Rows are placed with "shard = hash(key) mod N". What happens when you go from 4 shards to 5?',
      [
        'Most keys now map to a different shard and have to be moved',
        'Only one fifth of the keys move',
        'Nothing moves; new keys simply use the new shard',
        'The hash function has to be replaced',
      ],
      0,
      'Changing N changes the result of "mod N" for most keys, so most of the data has to move at once. Consistent hashing is designed so that adding a shard moves only about one Nth of the keys. It is one of the terms interviewers expect you to name here.',
    ),
    quiz(
      'shard-when',
      'sharding',
      'A database is getting slow under read load. What should you try before sharding?',
      [
        'Nothing; sharding is the standard first step',
        'Indexes, caching and read replicas',
        'Moving everything to a NoSQL store',
        'A load balancer in front of the single database',
      ],
      1,
      'Read load is usually solved by making queries cheaper (indexes), avoiding them (caching) or spreading them (replicas), all of which leave the application mostly unchanged. Sharding adds lasting complexity and mainly helps when the data or the writes outgrow one machine.',
    ),
  ],
};

const READ_AFTER_WRITE = `[HttpPut("profile")]
public async Task<IActionResult> UpdateProfile(ProfileUpdate update)
{
    var user = await _primaryDb.Users.FindAsync(CurrentUserId);
    user.DisplayName = update.DisplayName;
    await _primaryDb.SaveChangesAsync();

    var saved = await _replicaDb.Users
        .AsNoTracking()
        .SingleAsync(u => u.Id == CurrentUserId);

    return Ok(new ProfileResponse(saved.DisplayName, saved.Email));
}`;

const LOST_UPDATE = `def reserve(product_id, quantity):
    cur = db.cursor()
    cur.execute("SELECT stock FROM products WHERE id = %s", (product_id,))
    stock = cur.fetchone()[0]

    if stock < quantity:
        raise OutOfStock(product_id)

    new_stock = stock - quantity
    cur.execute(
        "UPDATE products SET stock = %s WHERE id = %s",
        (new_stock, product_id),
    )
    db.commit()`;

export const consistency = {
  id: 'consistency',
  title: 'Consistency: what "eventual" costs',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'How current is a read?',
      visual: 'quorum',
      body: `Once data lives on several machines, a read can be answered by one that has not heard the latest write yet.

- **Strong consistency:** every read sees the latest confirmed write. Simple to reason about, but it costs latency, and availability when machines cannot reach each other.
- **Eventual consistency:** replicas converge once writes stop, and until then a read may return an older value. Fast and available, but your code has to cope with stale answers.

One way to tune between them is a **quorum**. With N replicas, a write waits for W of them and a read asks R of them. If **R + W > N**, any read overlaps at least one replica that took the latest write. Move the sliders above.`,
    },
    {
      kind: 'explain',
      title: 'CAP, said correctly',
      body: `The **CAP theorem** is often quoted as "pick two of consistency, availability and partition tolerance". That is misleading, because network faults between machines (partitions) are not something you can opt out of.

What it says is narrower. **While a partition is happening**, a system has to choose: refuse some requests so that it never gives a wrong answer, or keep answering everyone and accept that some answers are stale. When the network is healthy you can have both.

The useful interview move is to make that choice per feature:

- **Must be right:** account balances, stock that can sell out, unique usernames, anything about money.
- **Can be a little behind:** like counts, feeds, "last seen", recommendations, dashboards.`,
    },
    quiz(
      'cons-eventual',
      'consistency',
      'What does eventual consistency promise?',
      [
        'Every read returns the latest write',
        'If writes stop, all replicas end up with the same data; until then a read may return an older value',
        'No write is ever lost',
        'Data is made consistent once a day',
      ],
      1,
      'It promises convergence, not freshness. In practice "eventually" is often milliseconds, but the code cannot assume a read reflects the write that just happened. The first option is strong consistency, and durability of writes is a separate guarantee from either.',
    ),
    quiz(
      'cons-cap',
      'consistency',
      'What does the CAP theorem actually say?',
      [
        'You can always pick any two of consistency, availability and partition tolerance',
        'Consistent systems are always slower than available ones',
        'When the network splits replicas apart, a system must either refuse some requests to stay consistent, or keep answering with data that may be stale',
        'NoSQL databases cannot be consistent',
      ],
      2,
      'The choice only exists during a partition, and partitions cannot be designed away, so "pick any two" misstates it: nobody gets to give up partition tolerance. Outside a partition a system can be both consistent and available. Many databases, relational and NoSQL, let you choose which side to take.',
    ),
    quiz(
      'cons-quorum',
      'consistency',
      'There are 5 replicas and a write waits for 3 of them. What is the fewest a read must ask to be sure it sees the latest write?',
      ['1', '2', '3', '5'],
      2,
      'The rule is R + W > N, so R must be more than 5 − 3 = 2. Any 3 of the 5 replicas must include at least one of the 3 that took the write. Asking all 5 would also work, but then a read fails as soon as a single replica is down.',
    ),
    quiz(
      'cons-needs-strong',
      'consistency',
      'Which feature needs strong consistency?',
      [
        'Checking at sign-up that a username is not already taken',
        'The number of likes on a post',
        'A user’s "last seen" time',
        'Recommended products on the home page',
      ],
      0,
      'Two people must never both be told the same username is free, so that check has to see the latest state. A like count that is a few seconds behind harms nobody, and neither does a slightly old "last seen" or recommendation. Naming which parts can be stale is how you keep the strict, expensive path small.',
    ),
    {
      kind: 'bug',
      id: 'bug-read-after-write',
      topic: 'consistency',
      lang: 'csharp',
      code: READ_AFTER_WRITE,
      bugLines: [8],
      options: [
        'FindAsync cannot be used with a primary key',
        'AsNoTracking makes the query return null',
        'It reads the row back from a replica straight after writing to the primary, so it can return the old name',
        'SaveChangesAsync has to be called twice',
      ],
      answer: 2,
      why: 'The write goes to the primary, and the very next line reads from a replica that may not have received it yet. Under asynchronous replication the response sometimes carries the old display name, so the user sees their change apparently undone. It passes every test on a machine with one database.',
      fix: 'Build the response from the entity that was just saved (`user`), which already holds the new value. If a fresh read is really needed straight after a write, send it to the primary. Keep replicas for reads that can tolerate being a moment behind.',
    },
    {
      kind: 'bug',
      id: 'bug-lost-update',
      topic: 'consistency',
      lang: 'python',
      code: LOST_UPDATE,
      bugLines: [9, 11],
      options: [
        'The SELECT is open to SQL injection',
        'The cursor is never closed, so the UPDATE cannot run',
        'commit() has to come before the UPDATE',
        'Two requests can read the same stock, and the second write overwrites the first, so the product is oversold',
      ],
      answer: 3,
      why: 'Two requests for the last item both read stock = 1, both pass the check, and both write 0. One reservation has been lost and two customers have bought one item. The stock was calculated in the application from a value that was already out of date. The queries are parameterised, so injection is not the problem here.',
      fix: 'Let the database do the check and the subtraction in one statement: `UPDATE products SET stock = stock - %s WHERE id = %s AND stock >= %s`, then confirm that exactly one row was changed. Alternatives are `SELECT ... FOR UPDATE` inside a transaction, or a version column that the UPDATE must match.',
    },
  ],
};
