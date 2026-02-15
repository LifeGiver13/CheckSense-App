# `src/screens/ArrangeQuizScreen.jsx` Walkthrough

## Purpose
Manual quiz setup screen: user picks class, subject, topic, optional subtopics, duration, and question type, then routes to generation.

## Line-by-line (simplified by ranges)

- `1-18`: Imports picker/hooks/ui/icons/auth/theme/components.
- `20-29`: Static class options.
- `31-56`: Component setup and all state variables.
- `58-65`: `normalizeText` helper for safe string conversion.
- `67-78`: `resetForm` resets all selection and loading states.
- `80-85`: Resets form on screen focus.
- `88-125`: Fetch subjects by class level.
- `127-166`: Fetch topics by selected class + subject.
- `168-173`: Updates subtopic list when topic changes.
- `175-179`: Toggle subtopic selection.
- `181-238`: `handleContinue`:
  - validates required fields
  - normalizes values
  - builds compact `subtopicNames` payload
  - routes to `/quiz-generating`.
- `241-387`: Screen UI:
  - class picker
  - subject picker
  - topic picker
  - subtopic chips
  - duration cards
  - quiz-type cards
  - continue button.
- `390-460`: Styles.

## Why this file matters

- Clean setup payload here makes generation stable downstream.
- Focus reset avoids stale previous selections.
