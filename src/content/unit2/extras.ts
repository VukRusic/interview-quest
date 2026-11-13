/** Unit 2 AI lesson, mock interview and story. Validated when unit2.ts assembles the unit. */

export const aiTokens = {
  id: 'ai-tokens',
  title: 'Tokens and context windows',
  pillar: 'ai',
  slot: 'lesson',
  steps: [
    {
      kind: 'explain',
      title: 'What a model actually receives',
      visual: 'token-window',
      body: `Language models such as Claude read and write text in **tokens**: chunks that are often a word or a piece of a word. Usage, limits and prices are all counted in tokens, and the same text can come to a different number of tokens on different models.

The **context window** is the most tokens a model can work with in one request. It has to hold everything: your instructions, any documents, the conversation so far, and the reply being written.

The API keeps **no memory between requests**. A chat only feels continuous because the application sends the whole conversation again on every turn. Add turns above and watch what each request carries, and what you have sent in total.`,
    },
    {
      kind: 'explain',
      title: 'What it costs, and how to spend less',
      body: `Input tokens (what you send) and output tokens (what the model writes) are billed separately, and **output costs several times more per token**. On models that reason before answering, that reasoning is billed as output too.

Four habits cover most of it:

- **Send less.** Give the model the pieces that matter for this question, not the whole knowledge base. Finding those pieces first is what **retrieval** means. Summarise or drop old turns in long conversations.
- **Ask for less.** Say how long the answer should be and in what format. The output limit you set on a request is a hard cut-off that the model does not plan around, so on its own it gives you a truncated answer, not a shorter one.
- **Cache what repeats.** If every request starts with the same long instructions or document, **prompt caching** lets that identical beginning be reused at a fraction of the price. It only works on an unchanged beginning, so put anything that varies at the end.
- **Measure.** Providers offer a call that counts the tokens in a request before you send it. Guessing from characters or words is only a rough guide.`,
    },
    {
      kind: 'quiz',
      id: 'ai-tok-what',
      topic: 'ai-tokens',
      prompt: 'What is a token?',
      options: [
        'Exactly one character',
        'Exactly one word',
        'A chunk of text, often a word or part of a word, that the model reads, writes and is billed in',
        'One request to the API',
      ],
      answer: 2,
      why: 'Models split text into tokens before doing anything with it. A short common word is usually one token; a long or rare word, a piece of code or a non-English word is often several. Different models split text differently, which is why you count with the provider’s own counter when the number matters.',
      lookUp: 'LLM tokenization and token counting',
    },
    {
      kind: 'quiz',
      id: 'ai-tok-resend',
      topic: 'ai-tokens',
      prompt: 'A chat has had 30 turns. What does the model receive when the user sends turn 31?',
      options: [
        'The whole conversation so far plus the new message',
        'Only the new message; the model remembers the rest',
        'A summary the model stored after turn 30',
        'The last five turns',
      ],
      answer: 0,
      why: 'The model keeps nothing between requests, so the application resends the full history every time. That is why each turn of a long chat costs more than the one before, and why long conversations eventually hit the context window. Dropping or summarising old turns is something your application has to decide to do.',
      lookUp: 'stateless LLM API and conversation history',
    },
    {
      kind: 'quiz',
      id: 'ai-tok-output-cost',
      topic: 'ai-tokens',
      prompt: 'Per token removed, which change usually saves the most money?',
      options: [
        'Writing the prompt in lower case',
        'Asking for a shorter answer, because output tokens are priced several times higher than input tokens',
        'Removing punctuation from the prompt',
        'Shortening the system prompt by the same number of tokens',
      ],
      answer: 1,
      why: 'Input and output are billed at different rates, and output is the expensive side. Trimming a thousand tokens from an answer saves several times what trimming a thousand tokens from the prompt does. Lower case and missing punctuation barely change the token count and can make the result worse.',
      lookUp: 'input vs output token pricing',
    },
    {
      kind: 'quiz',
      id: 'ai-tok-cache',
      topic: 'ai-tokens',
      prompt: 'Every request begins with the same long instructions and reference document. How do you avoid paying full price for them each time?',
      options: [
        'Move the document to the end of the prompt',
        'Send the document once and rely on the model remembering it',
        'Compress the document before sending it',
        'Use prompt caching, keeping that part identical and at the start of every request',
      ],
      answer: 3,
      why: 'Prompt caching reuses an unchanged beginning of a request at a much lower price. It matches from the start, so anything that changes before the cached part, even a timestamp, breaks it, and content that varies belongs at the end. The model has no memory to rely on, and it cannot read compressed text.',
      lookUp: 'prompt caching and cache-friendly prompt structure',
    },
    {
      kind: 'quiz',
      id: 'ai-tok-budget',
      topic: 'ai-tokens',
      prompt: 'An interviewer asks you to fit a prompt inside a token budget. What do you cut first?',
      options: [
        'Background the model does not need for this task, repeated instructions and oversized examples',
        'The description of the output format',
        'The task itself, keeping the examples',
        'Nothing; just set a lower output limit',
      ],
      answer: 0,
      why: 'A good prompt under a budget keeps the task, the constraints and the output format, and spends what is left on the most useful context. Padding, repetition and long examples go first. A lower output limit does not shrink the prompt at all; it only cuts the reply off.',
      lookUp: 'prompt engineering under a token budget',
    },
  ],
};

export const mockNotifications = {
  id: 'mock-notifications',
  title: 'Mock interview: notification system',
  pillar: 'design',
  slot: 'extra',
  steps: [
    {
      kind: 'mock',
      id: 'mock-notify',
      topic: 'design-notifications',
      prompt:
        'Design a notification service. Other teams send it events such as "order shipped" or "password reset requested", and it delivers push notifications, emails and SMS to users. Walk me through your design.',
      followUps: [
        'Say 10 million users and about 5 notifications per user per day, with big spikes during campaigns. Roughly how many per second on average and at peak, and what does that tell you about the design?',
        'Your SMS provider starts timing out. What happens to the messages in flight, and what do you do about it?',
        'A worker crashes right after the email provider accepted a message, but before the worker recorded that. How do you avoid sending the email twice?',
        'Users complain about getting too many notifications. Where do preferences and per-user limits live, and at what point are they checked?',
        'A login code and a marketing push arrive together while a million campaign messages are queued. How do you make sure the login code is not stuck behind them?',
      ],
      rubric: [
        'Asked about requirements first (channels, volume, how fast, whether every message must arrive)',
        'Gave rough numbers for average and peak load',
        'Put a queue between accepting an event and sending it, and said why',
        'Handled a failing provider with timeouts, backoff with jitter and a dead-letter queue',
        'Prevented duplicate sends with an idempotency key or a record of what was sent',
        'Checked user preferences and rate limits before sending',
        'Kept urgent messages apart from bulk ones (separate queues or priorities)',
        'Named at least one trade-off, such as at-least-once delivery meaning a rare duplicate',
      ],
    },
  ],
};

export const storyIncident = {
  id: 'story-production-incident',
  title: 'Your story: when production broke',
  pillar: 'stories',
  slot: 'extra',
  steps: [
    {
      kind: 'story',
      id: 'story-incident',
      topic: 'behavioural',
      prompt: 'Tell me about a time something broke in production. What did you do?',
      hints: [
        'Start with how you found out and what users were seeing.',
        'Say what you checked and ruled out, not only the final cause.',
        'Describe the fix, then what you changed so it would not happen again: a test, an alert, a process.',
        'It does not have to be your bug. How you acted under pressure is the story.',
      ],
    },
  ],
};
