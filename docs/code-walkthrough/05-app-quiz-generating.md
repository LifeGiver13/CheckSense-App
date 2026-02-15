# `app/quiz-generating.jsx` Walkthrough

## Purpose
Builds a quiz-generation payload safely, sends it to the backend, and shows progress while polling context tracks publish status.

## Line-by-line (simplified by ranges)

- `1-10`: Imports icons, storage, router params, hooks, alert/ui, auth, generation context, theme constants.
- `12-20`: Rotating user-facing progress messages.
- `22-36`: Safe param/JSON/subject normalizers.
- `38-48`: `normalizeQuizType` maps variants to `mcq` or `saq`.
- `50-59`: Generic `normalizeText`.
- `61-81`: `normalizeSubtopicItem` converts subtopic values into `{name, description}` safely.
- `83-114`: `normalizeTopicItem` converts topic object into normalized API topic shape.
- `116-130`: `normalizeTopicsPayload` ensures fallback topic/subtopic always exists.
- `132-146`: Reads all route params:
  - supports `fromQuizId`, custom topic params, difficulty, duration, progression step.
- `148-166`: Computes requested difficulty and requested quiz type.
  - Forces `saq` for progression step `>= 4`.
- `168-199`: Builds `generationKey` so each unique generation request has a stable identity.
- `201-214`: Main state:
  - progress/timer/message,
  - `quizCreated`,
  - display subject/topic.
- `216-229`: Duration-to-question-count mapping and parsed subtopic payload.
- `231-247`: Loads user ID from AsyncStorage safely.
- `249-258`: Resets visual generation state when `generationKey` changes.
- `260-282`: Progress/timer animation effect.
  - Hard difficulty moves progress slower for realism.
- `284-459`: Core generation effect:
  - Stops if user not loaded.
  - Guards duplicate generation for same key.
  - Optional fetch of source quiz (`fromQuizId`).
  - Builds normalized topics from route params.
  - Fallback fetch from `/v2/topics` when only compact subtopic flags are provided.
  - Builds payload:
    - `subject`
    - `topics`
    - `totalQuestions`
    - `meta.difficulty`, `userId`
    - `quizType`
  - Sends `POST /v2/quiz`.
  - Parses response safely and extracts quiz ID.
  - Adds pending quiz to context for polling.
- `461-469`: AppState listener (debug note when app backgrounds).
- `471-495`: Render generation card UI.
- `497-534`: Styles.

## Why this file matters

- It is the central payload builder for quiz creation.
- Most generation crashes come from malformed params or duplicate effect runs; this file now guards both.
