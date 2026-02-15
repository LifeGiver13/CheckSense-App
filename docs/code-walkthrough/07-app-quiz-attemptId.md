# `app/quiz/[attemptId].jsx` Walkthrough

## Purpose
Runs the active quiz attempt screen: fetches attempt + quiz, renders questions, handles answering, progress saving, and submission.

## Line-by-line (simplified by ranges)

- `1-15`: Imports router/hooks, RN UI, auth, theme constants.
- `17-58`: Helper functions:
  - param extraction
  - subject text normalization
  - robust value-to-string helper
  - array/question normalizers.
- `60-83`: Component setup and state:
  - attempt/quiz data
  - question index and answers
  - feedback/hints/timer/loading/saving
  - refs for auto-submit + save guard.
- `85-95`: Reset local quiz state whenever `attemptId` changes.
- `97-144`: Fetch attempt + quiz:
  - `GET /v2/quiz-attempt/{attemptId}`
  - `GET /v2/quiz/{quizId}`
  - normalizes questions once before storing.
- `146-154`: Derives exam mode, question array, current question pointer.
- `156-160`: Keeps question index in bounds when question list changes.
- `162-171`: Determines question mode (MCQ vs SAQ).
- `173-187`: Exam timer countdown logic.
- `189-206`: Builds answer payload array with `marksAwarded`.
- `208-241`: Final submit handler:
  - computes score
  - updates attempt as completed
  - routes to results.
- `243-249`: Auto-submit when exam timer reaches zero.
- `251-266`: Answer and answer-check handlers.
- `268-295`: `saveProgress` handler with overlap guard.
- `297-304`: Saves progress when app backgrounds.
- `306-317`: `Next` handler:
  - moves question forward
  - saves every 4th question or on last question.
- `319-321`: Previous handler.
- `323-344`: Loading and empty-quiz fallback UIs.
- `346-591`: Main quiz render:
  - header/progress
  - question body
  - MCQ options or SAQ text input
  - feedback + hints in practice mode
  - navigation controls + direct question jump chips.
- `593-656`: Styles.

## Why this file matters

- This is the heaviest runtime screen.
- Throttled saves + normalized questions reduce hard-step crash pressure.
