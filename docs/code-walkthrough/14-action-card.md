# `src/components/ActionCard.jsx` Walkthrough

## Purpose
Reusable dashboard card component with icon, title, description, and up to two action buttons.

## Line-by-line (simplified by ranges)

- `1-2`: Imports RN primitives and theme colors.
- `4-9`: Component props (`icon`, `title`, `description`, `buttons`).
- `10-39`: Render logic:
  - card shell
  - title area with icon
  - description
  - button row (max two buttons)
  - per-button type (`primary`/`secondary`).
- `41-115`: Styles for card, title row, button row, and button variants.

## Why this file matters

- Used by dashboard entry points.
- Stable component behavior keeps top-level navigation predictable.
