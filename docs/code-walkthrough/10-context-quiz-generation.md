# `contexts/QuizgenerationContext.jsx` Walkthrough

## Purpose
Central polling manager for generated quizzes. It tracks pending quizzes and shows “Quiz Ready” prompt when publish status becomes ready.

## Line-by-line (simplified by ranges)

- `1-12`: Imports hooks/router/alert/API URL/auth context.
- `14-16`: Context and polling constants:
  - interval
  - timeout.
- `18-24`: `useQuizGeneration` hook with provider guard.
- `26-31`: Provider setup:
  - state for pending quizzes
  - ref map for active interval IDs
  - router + token.
- `33-41`: `removePendingQuiz` removes quiz and clears interval.
- `43-78`: `pollQuizStatus`:
  - fetches `/v2/quiz/{id}` with auth
  - handles auth errors
  - shows “Quiz Ready” alert and routes to choose type
  - handles failed generation status.
- `80-119`: `addPendingQuiz`:
  - deduplicates pending IDs
  - starts polling interval
  - triggers immediate first poll
  - enforces timeout and shows “Still generating” message if long-running.
- `121-127`: Cleanup effect clears all intervals on unmount.
- `129-134`: Exposes context values.

## Why this file matters

- It prevents forgotten generation states.
- It decouples quiz creation screen from publish-status polling logic.
