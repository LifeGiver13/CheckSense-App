# `app/subject-topics.jsx` Walkthrough

## Purpose
Displays topics and subtopics for a subject/class, then routes to quiz generation with compact params.

## Line-by-line (simplified by ranges)

- `1-12`: Imports router hooks, React hooks, RN UI, colors, API URL.
- `14-18`: Duration options (`short`, `medium`, `long`).
- `20`: `getParamValue` handles route param arrays.
- `22-40`: `sanitizeTopicList`:
  - Keeps only valid topic objects.
  - Ensures each topic has non-empty subtopics.
  - Returns normalized topic structure.
- `42-50`: Reads route params (`subject`, `classLevel`) and sets state.
- `52-89`: Fetches topics from `/v2/topics` with `where={subject,classLevel}`.
- `91`: `topicCount` memo for display.
- `93-121`: `handleDurationSelect(...)`:
  - Validates selection.
  - Marks selected duration state.
  - Builds compact route params:
    - `subtopicName`
    - `includeAllSubtopics` (`1` or `0`)
  - Pushes to `/quiz-generating`.
- `123-181`: Renders topic cards:
  - “All subtopics” row.
  - Individual subtopic rows.
  - Duration buttons for each row.
- `184-241`: Styles.

## Why this file matters

- Compact params reduce memory/route payload pressure.
- This change helps prevent crashes in dashboard -> generation flow.
