# `app/quiz/[id]/results.jsx` Walkthrough

## Purpose
Legacy results route (older path style) that still shows attempt review and simple actions.

## Line-by-line (simplified by ranges)

- `1-13`: Imports router/hooks, UI primitives, auth, theme, API URL.
- `15-24`: Component setup:
  - pulls `id` param
  - derives `attemptId`
  - state for attempt/quiz/loading.
- `26-67`: Fetches attempt then quiz by `attempt.quizId`.
- `69-89`: Loading/empty fallback views.
- `91-100`: Local computed values (`questions`, totals, `formatTime`).
- `102-152`: Renders question-by-question review card with user/correct answers.
- `154-164`: Footer actions:
  - back to quizzes
  - take another quiz.
- `166-190`: `Stat` helper and styles.

## Why this file matters

- Even if your main flow uses `app/quiz-results/[attemptId].jsx`, this file prevents broken legacy links.
