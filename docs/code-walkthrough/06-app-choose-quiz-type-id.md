# `app/choose-quiz-type/[id].jsx` Walkthrough

## Purpose
Loads one generated quiz, lets user choose practice/exam mode, creates a quiz attempt, then routes to the live quiz screen.

## Line-by-line (simplified by ranges)

- `1-14`: Imports router hooks, React hooks, RN UI, auth, theme, API URL.
- `16-22`: Basic helpers:
  - param extraction
  - subject normalization.
- `24-30`: `safeParseJSON` for robust response parsing.
- `32-35`: `normalizeQuizType` returns only `mcq` or `saq`.
- `37-47`: Component setup:
  - reads `quizId` from route
  - state for loading, selected mode, and start button state.
- `49-85`: Fetch quiz details (`GET /v2/quiz/{quizId}`).
- `88-101`: Derives `summary` values for display and payload.
- `103-170`: `handleStartQuiz`:
  - Validates required values.
  - Builds compact attempt payload.
  - Logs request payload.
  - Calls `POST /v2/quiz-attempt`.
  - Reads raw response text, safely parses JSON.
  - Logs response status/body.
  - Extracts attempt ID from multiple possible response shapes.
  - Routes to `/quiz/[attemptId]`.
- `172-187`: Loading and “quiz not found” fallback views.
- `189-257`: Main UI:
  - Shows quiz summary.
  - Lets user choose practice/exam.
  - Start button.
- `259-314`: Styles.

## Why this file matters

- This is where dashboard flow previously crashed while starting attempts.
- Sending compact topic payload + robust response parsing makes this step safer.
