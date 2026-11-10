export type StepResult = { correct?: boolean; selfGrade?: number };
export type StepProps<S> = { step: S; onDone: (result?: StepResult) => void };
