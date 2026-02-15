# `app/browse-subjects.jsx` Walkthrough

## Purpose
Lets users pick a class/subject and jump to `subject-topics` with safe filtering.

## Line-by-line (simplified by ranges)

- `1-14`: Imports icons, storage, picker, router, hooks, UI, colors, API base URL.
- `16-22`: JSON parse helper with fallback.
- `24-31`: `normalizeSubjectName` handles string/object subject formats.
- `33-38`: `normalizeSubjectList` sanitizes subjects from user profile.
- `40-47`: Component state:
  - `classLevel`, `userSubjects`, `selectedSubject`
  - `subjectsWithTopics`, `loading`
- `49-82`: Load user profile from AsyncStorage:
  - Pulls default class and profile subjects.
  - Sets initial selected subject.
- `84-166`: Fetches subjects and topics based on selected class/subject:
  - Builds `where` query objects.
  - Calls `/v2/subjects` and `/v2/topics` in parallel.
  - Counts valid topic totals by subject.
  - Merges counts into subject cards.
- `168-172`: `renderedSubjects` memo keeps only subjects with at least one topic.
- `174-239`: UI:
  - Class picker.
  - Subject picker.
  - Subject cards with `router.push('/subject-topics', {subject, classLevel})`.
- `241-277`: Styles.

## Why this file matters

- This is the start of the dashboard quiz-generation flow.
- Data normalization here prevents downstream param/type crashes.
