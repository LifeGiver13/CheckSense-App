# `app/dashboard.jsx` Walkthrough

## Purpose
This is the main dashboard screen shown after login. It greets the user and offers entry points into quiz-related flows.

## Line-by-line (simplified by ranges)

- `1-7`: Imports icons, storage, routing, React hooks, UI primitives, and `ActionCard`.
- `9-14`: `safeParseJSON` helper safely parses stored JSON without crashing.
- `16-18`: Starts `Dashboard` component with router + `username` state.
- `21-38`: `useEffect` loads `auth_user` from AsyncStorage:
  - Parses safely.
  - Uses `username` first, then `firstName`.
- `40-102`: Main UI:
  - Greeting header (`Hi, {username}`).
  - `ActionCard` for `Explore Subjects` -> `/browse-subjects`.
  - `ActionCard` for `Quizzes` -> `/quizzes` and `/arrange-quiz`.
  - `ActionCard` for `Games` currently routes to `/browse-subjects`.
- `104-184`: Style definitions.

## Why this file matters

- It is the first decision point in your user flow.
- Any bad route push here affects multiple quiz pipelines.
