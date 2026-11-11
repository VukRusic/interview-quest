import type { MockStep, StoryStep } from '../content/types';
import type { Star } from '../state/progress';

/**
 * Builds a prompt the user pastes into any AI chat themselves. No API, no key, no cost:
 * the app never sends anything anywhere.
 */
export function mockReviewPrompt(step: MockStep, answer: string): string {
  return `You are an experienced interviewer at a product company, reviewing a system design answer from a software developer with about 5 years of experience (upper-mid to senior level).

Question: ${step.prompt}
${step.followUps.length ? `\nFollow-up questions asked:\n${step.followUps.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
My answer (follow-up answers are under ### headings):
"""
${answer.trim() || '(no answer written yet)'}
"""

Grade my answer against this rubric. For each item say covered, partly, or missing, with one sentence why:
${step.rubric.map((r) => `- ${r}`).join('\n')}

Then list the two changes that would most improve the answer, and one follow-up question a real interviewer would likely ask next. Be direct and specific.`;
}

export function storyReviewPrompt(step: StoryStep, star: Star): string {
  return `You are an experienced interviewer giving feedback on a behavioural answer from a software developer with about 5 years of experience.

Question: ${step.prompt}

My answer in STAR form:
Situation: ${star.situation.trim() || '(empty)'}
Task: ${star.task.trim() || '(empty)'}
Action: ${star.action.trim() || '(empty)'}
Result: ${star.result.trim() || '(empty)'}

Check it against:
- Has a number or a concrete result
- Says what I did ("I"), not only "we"
- Can be said in under 2 minutes (about 300 words)
- Shows a real decision or trade-off I made

Say what works, what is weak, and rewrite the weakest part as an example. Keep my facts; do not invent achievements.`;
}
