# `src/components/QuizAction.jsx` Walkthrough

## Purpose
Reusable action card for quiz-result actions (continue, retry, mastery, explore).

## Line-by-line (simplified by ranges)

- `1-2`: Imports RN primitives and theme colors.
- `4-8`: Component props (`icon`, `title`, `description`).
- `9-22`: Renders icon + text content inside a card container.
- `24-67`: Styles for layout, alignment, and text colors.

## Why this file matters

- It is used in result screens for key next-step actions.
- Consistent behavior here keeps progression actions readable and stable.
