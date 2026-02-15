# State Management and Dependency Injection (App Development Guide)

This guide explains two core concepts:
- **State management**: how your app stores and updates data over time.
- **Dependency injection (DI)**: how your app receives external things (APIs, auth, services) in a clean way.

The goal is practical understanding using patterns from your project.

---

## 1. What is "state" in an app?

State is any data that can change while the app is running.

Examples:
- Current user (`user`, `token`)
- Selected subject/topic
- Quiz progress (`currentQuestion`, `answers`)
- Loading flags (`loading`, `starting`, `submitting`)

If data changes and UI should update, that data is usually state.

---

## 2. Levels of state (from smallest to largest)

### A) Local component state

Use `useState` when data is used only inside one screen/component.

Example from your app:
- `app/choose-quiz-type/[id].jsx`
  - `selectedMode`
  - `starting`
  - `quizData`

This keeps state simple and close to where it is used.

### B) Derived state

Use `useMemo` for values computed from state/props.

Example:
- `summary` in `choose-quiz-type`
- `nextConfig` in `quiz-results`

Why:
- Avoid repeated expensive calculations.
- Keep render logic clean.

### C) Shared app state

Use Context when many screens need the same state.

In your app:
- `AuthContext` shares user/token/session methods.
- `QuizGenerationContext` shares pending quiz polling.

If several distant screens need the same data, context is often the right choice.

---

## 3. State lifecycle in React Native

### `useEffect`

Runs side effects (API calls, timers, subscriptions).

Common pattern:
1. Start effect.
2. Do async work.
3. Handle success/error.
4. Cleanup on unmount.

Your code uses `AbortController` + cleanup, which is good:
- prevents stale updates
- prevents leaks
- reduces crashes

### `useFocusEffect` (Expo Router)

Runs when a screen gains focus.

Good for:
- refresh on return
- reset temporary form state

Used in your app for form reset and refetch behavior.

---

## 4. Good state management rules (practical)

### Rule 1: Keep state minimal

Store only what you need.
If it can be computed from existing state, use `useMemo`.

### Rule 2: Normalize incoming API data

Backend data can vary (`id` vs `_id`, `quizType` vs `type`).
Normalize once early, then use normalized shape everywhere.

You already do this in:
- `quiz-generating`
- `quiz-results`
- `quiz/[attemptId]`

### Rule 3: Guard transitions

Avoid duplicate submissions with flags:
- `if (starting) return`
- `if (submitting) return`
- `isSavingProgressRef`

This prevents race conditions and repeated API calls.

### Rule 4: Throttle noisy updates

Saving on every tap can overload runtime/network.
Your quiz screen now saves every few steps + backgrounding.

### Rule 5: Always cleanup effects

Timers, listeners, and pending requests must be cleaned up.

Checklist:
- `clearInterval`
- `subscription.remove()`
- `controller.abort()`

---

## 5. Common state mistakes (and fixes)

### Mistake: Duplicated source of truth

Example:
- storing both raw and transformed versions and keeping both updated manually.

Fix:
- keep one source (raw or normalized), derive the rest.

### Mistake: Stale closure

Effect uses old variables because dependency array is incomplete.

Fix:
- include all dependencies
- or move logic into stable callbacks/memos

### Mistake: Large route params

Sending huge JSON through navigation can crash app/dev runtime.

Fix:
- send compact params (`id`, flags, names)
- reconstruct full payload after navigation

You now use this pattern in `subject-topics -> quiz-generating`.

---

## 6. What is dependency injection (DI)?

Dependency injection means:
- a module **receives** what it needs
- instead of creating everything inside itself

Simple idea:
- "Don't hardcode the dependency in the function if you can provide it from outside."

Benefits:
- easier testing
- cleaner architecture
- less coupling

---

## 7. DI in React Native (real-world style)

React does DI mostly through:
- **Context Providers**
- **Custom hooks**
- **Props**

### In your app

#### A) Context-based DI

- `AuthProvider` injects auth values/actions (`token`, `login`, `logout`) to all children.
- `QuizGenerationProvider` injects generation polling methods.

Any child can call:
- `useAuth()`
- `useQuizGeneration()`

That is dependency injection via context.

#### B) Configuration DI

- `API_BASE_URL` is imported from constants.
- You can later inject env-specific config (dev/staging/prod).

#### C) Component DI via props

- `ActionCard` gets behavior (`buttons`, `onPress`) from parent.
- The card does not own business logic.

---

## 8. Why DI matters for your quiz app

Without DI:
- each screen would create its own auth/session logic
- each screen would duplicate polling logic
- changing API/auth behavior would require editing many files

With DI:
- auth logic is centralized in `AuthContext`
- generation/polling logic is centralized in `QuizgenerationContext`
- screens focus on UI + flow

---

## 9. "State management + DI" working together

Think of it like this:

- **State management** answers:  
  "Where is this data stored, and how does it change?"

- **Dependency injection** answers:  
  "How does this screen get access to the services/data it needs?"

Example flow in your app:
1. User chooses topic -> local state in screen.
2. Screen navigates with compact params.
3. `quiz-generating` builds payload and calls API (using injected token/config).
4. `QuizGenerationContext` polls status (shared injected service).
5. Start quiz screen reads attempt and manages local interactive state.

---

## 10. Practical architecture template for future features

When adding a new feature, use this checklist:

1. Define state scope:
   - local screen only?
   - multiple screens?
2. Normalize API shape at boundary.
3. Keep payloads/navigation compact.
4. Add request guards for buttons.
5. Cleanup effects and listeners.
6. Place shared logic in context/service, not every screen.

---

## 11. Suggested next improvement (optional)

If you want more structure later:
- create an `api/` folder with small request helpers
- keep UI screens mostly declarative
- move payload normalization into helper modules

This makes code easier to read during maintenance.

---

## 12. Quick revision summary

- Use `useState` for local changing UI data.
- Use `useMemo` for derived values.
- Use `useEffect`/`useFocusEffect` for side effects.
- Use Context for shared global concerns.
- Inject dependencies through context/props/config.
- Normalize data and guard async actions to avoid crashes.

If you want, I can also create a second guide with diagrams for your exact quiz flow (from dashboard tap to quiz submission).
