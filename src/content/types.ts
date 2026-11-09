import { z } from 'zod';

export const PillarSchema = z.enum(['design', 'review', 'algo', 'stack', 'stories']);
export type Pillar = z.infer<typeof PillarSchema>;

export const ExplainStepSchema = z.object({
  kind: z.literal('explain'),
  title: z.string(),
  body: z.string(),
  /** Key into the visuals registry (src/ui/visuals). */
  visual: z.string().optional(),
});

export const QuizStepSchema = z.object({
  kind: z.literal('quiz'),
  id: z.string(),
  topic: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.number().int(),
  why: z.string(),
});

export const BugStepSchema = z.object({
  kind: z.literal('bug'),
  id: z.string(),
  topic: z.string(),
  lang: z.enum(['csharp', 'typescript', 'python']),
  code: z.string(),
  /** 1-based line numbers that contain the bug. */
  bugLines: z.array(z.number().int()).min(1),
  options: z.array(z.string()).min(2),
  answer: z.number().int(),
  why: z.string(),
  fix: z.string(),
});

export const PythonTestSchema = z.object({ args: z.array(z.unknown()), expected: z.unknown() });

export const PythonStepSchema = z.object({
  kind: z.literal('python'),
  id: z.string(),
  topic: z.string(),
  prompt: z.string(),
  fn: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  starter: z.string(),
  tests: z.array(PythonTestSchema).min(1),
  walkthrough: z.array(
    z.object({ line: z.number().int(), vars: z.record(z.string(), z.string()), note: z.string() }),
  ),
  reference: z.string(),
});

export const SandboxStepSchema = z.object({
  kind: z.literal('sandbox'),
  id: z.string(),
  topic: z.string(),
  scenarioId: z.string(),
});

export const MockStepSchema = z.object({
  kind: z.literal('mock'),
  id: z.string(),
  topic: z.string(),
  prompt: z.string(),
  followUps: z.array(z.string()),
  rubric: z.array(z.string()).min(1),
});

export const StoryStepSchema = z.object({
  kind: z.literal('story'),
  id: z.string(),
  topic: z.string(),
  prompt: z.string(),
  hints: z.array(z.string()),
});

export const StepSchema = z.discriminatedUnion('kind', [
  ExplainStepSchema,
  QuizStepSchema,
  BugStepSchema,
  PythonStepSchema,
  SandboxStepSchema,
  MockStepSchema,
  StoryStepSchema,
]);

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  pillar: PillarSchema,
  slot: z.enum(['lesson', 'practice', 'extra']),
  steps: z.array(StepSchema).min(1),
});

export const UnitSchema = z.object({
  id: z.string(),
  title: z.string(),
  lessons: z.array(LessonSchema).min(1),
});

export type ExplainStep = z.infer<typeof ExplainStepSchema>;
export type QuizStep = z.infer<typeof QuizStepSchema>;
export type BugStep = z.infer<typeof BugStepSchema>;
export type PythonStep = z.infer<typeof PythonStepSchema>;
export type SandboxStep = z.infer<typeof SandboxStepSchema>;
export type MockStep = z.infer<typeof MockStepSchema>;
export type StoryStep = z.infer<typeof StoryStepSchema>;
export type Step = z.infer<typeof StepSchema>;
export type ItemStep = Exclude<Step, ExplainStep>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Unit = z.infer<typeof UnitSchema>;

export const AUTO_KINDS = ['quiz', 'bug', 'python', 'sandbox'] as const;
export const SELF_KINDS = ['mock', 'story'] as const;
export const REVIEWABLE_KINDS = ['quiz', 'bug'] as const;
