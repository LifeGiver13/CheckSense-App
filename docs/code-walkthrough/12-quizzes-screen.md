# `src/screens/Quizzes.jsx` Walkthrough

## Purpose
Shows the user’s quiz attempts with tabs (pending, challenges, completed), actions (start/review/retake), and pagination.

## Line-by-line (simplified by ranges)

- `1-16`: Imports icons/router/hooks/ui/auth/theme.
- `18`: Page size constant.
- `20-39`: Text/topic normalization helpers for resilient rendering.
- `41-56`: Component state setup:
  - loading/tab/attempt list
  - pagination metadata.
- `57-60`: Date formatter helper for timestamp display.
- `62-94`: `fetchQuizAttempts`:
  - builds `where={userId}`
  - fetches `/v2/my/quiz-attempt`
  - stores list + pagination safely.
- `96-109`: Refreshes attempts on screen focus.
- `111-120`: Builds `pending`, `completed`, `challenges` filtered arrays.
- `122-130`: `startQuiz` and `dismissQuiz` handlers.
- `132-144`: Pagination math and loading fallback.
- `146-296`: Main list UI:
  - tab buttons
  - list item card
  - normalized top-line text
  - review/retake for completed
  - start/continue for in-progress.
- `298-323`: Pagination controls.
- `327-338`: `TabButton` helper component.
- `341-433`: Styles.

## Why this file matters

- It is the “my quizzes” control center.
- Robust normalization here avoids object-in-text rendering crashes.
