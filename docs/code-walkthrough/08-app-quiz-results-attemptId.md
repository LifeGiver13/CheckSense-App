# `app/quiz-results/[attemptId].jsx` Walkthrough

## Purpose
Shows completed attempt results, computes progression step, and offers continue/retry actions.

## Line-by-line (simplified by ranges)

- `1-14`: Imports router/hooks, list UI, auth, action card component, theme constants.
- `16-22`: Param and subject normalization helpers.
- `24-42`: Difficulty and quiz-type normalization helpers.
- `44-52`: Infer quiz type from question structure.
- `54-61`: Infer difficulty from question count fallback.
- `63-69`: Progression table (6 steps):
  - MCQ easy/medium/hard
  - SAQ easy/medium/hard.
- `71-82`: Component setup and state.
- `84-121`: Fetch attempt + related quiz.
- `123-132`: Compute score totals and pass/fail.
- `134-139`: Derive reusable identifiers (`quizId`, class, subject).
- `141-170`: Infer current difficulty/type and map to progression step index.
- `172-180`: Compute `nextConfig` if passed.
- `182-190`: Build current and next step labels + time formatter.
- `192-229`: Renders each question review card with correctness/explanation.
- `231-246`: Loading and unavailable states.
- `248-351`: Main result list:
  - header stats
  - retry action when failed
  - continue action when passed and next step exists
  - mastery card when final step is complete
  - explore topics action.
- `353-378`: Shared `Stat` component + styles.

## Why this file matters

- It controls learning progression.
- It now handles inconsistent backend fields and still computes correct step transitions.
