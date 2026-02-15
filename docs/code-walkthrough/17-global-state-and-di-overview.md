# Global Overview: State Management and Dependency Injection

This guide is intentionally broader than your project-specific notes.
It explains the ideas in a way that applies to mobile, web, and backend apps.

---

## 1. State Management (Global View)

## What "state" means

State is data that changes over time and affects behavior or UI.

Examples across app types:
- Logged-in user
- Current screen/route
- Shopping cart items
- Draft form values
- API loading/error status
- Feature flags

If a value can change and your app reacts to it, that value is state.

---

## Why state management is hard

As apps grow:
- More screens/components need the same data.
- Async operations finish at different times.
- Multiple updates can happen at once.
- Old data can overwrite newer data.

Good state management exists to prevent:
- inconsistent UI
- race conditions
- duplicated source of truth
- fragile code

---

## 2. Types of State (Most Useful Classification)

### Local UI state

Owned by one view/component.

Examples:
- modal open/close
- selected tab
- current text input

### Shared client state

Needed by multiple parts of the app.

Examples:
- auth session
- selected organization/workspace
- app theme

### Server state

Data that comes from API/database and can become stale.

Examples:
- user profile
- product list
- quiz attempts

Server state needs:
- caching
- refetch rules
- stale/error handling

### Derived state

Computed from other state.

Examples:
- `totalPrice = sum(cartItems)`
- `isEligible = score >= 50`

Best practice: derive instead of storing duplicates.

### Persistent state

State saved between app launches.

Examples:
- token in storage
- onboarding completed flag
- user preferences

---

## 3. Core Principles of Good State Management

### One source of truth

For important data, choose one authoritative place.
Everything else should read from it or derive from it.

### Explicit state transitions

State should change through clear actions/events.

Good:
- `startQuiz()`
- `submitAttemptSuccess(payload)`

Bad:
- random direct mutations from many places.

### Unidirectional data flow

Data usually flows:
1. Event happens
2. State updates
3. UI re-renders

This makes bugs easier to trace.

### Separate pure logic from side effects

Pure logic:
- computes next state

Side effects:
- API calls
- storage writes
- timers/listeners

Keeping them separate improves testability.

---

## 4. Common State Approaches (Framework-Agnostic)

### Simple local state

Best for small features.
Low setup, fast development.

### Context/provider-style shared state

Great for medium apps and shared concerns:
- auth
- settings
- current user/session

### Store-based state (Redux, Zustand, Pinia, etc.)

Useful when:
- many screens depend on same state
- complex events and debugging needs
- time-travel/logging/traceability matters

### Query/cache libraries (TanStack Query, SWR, RTK Query)

Best for server state:
- fetching
- caching
- retries
- stale revalidation

A common architecture uses both:
- local/store for UI/client state
- query library for server state

---

## 5. Dependency Injection (Global View)

## What DI means

Dependency Injection means a module receives what it needs from outside, instead of creating it internally.

Dependency examples:
- API client
- logger
- auth service
- analytics service
- storage service

Without DI:
- classes/functions tightly couple to concrete implementations.

With DI:
- logic depends on interfaces/contracts.
- implementations can be swapped (test, mock, prod).

---

## Why DI matters

DI improves:
- testability
- maintainability
- modularity
- environment switching (dev/staging/prod)

It reduces hidden coupling and "hardcoded globals everywhere."

---

## 6. DI Patterns

### Constructor injection

Dependency passed during object/module creation.
Most explicit and generally preferred.

### Method/parameter injection

Dependency passed only when needed to a function.

### Context/provider injection

Common in UI apps:
- provider exposes dependencies
- children consume via hooks/context.

### DI container

A registry that builds and resolves dependencies.
Common in large backend/enterprise apps.

### Service locator (use cautiously)

Global registry lookup at runtime.
Easy to start, but can hide real dependencies if overused.

---

## 7. State Management + DI Together

These are separate concerns:

- State management asks:
  - Where does data live?
  - How does it change?

- DI asks:
  - How does this module get tools/services it needs?

In robust architectures, you use both:
- state is predictable
- dependencies are replaceable

---

## 8. Architecture Blueprint (Practical)

A clean app often has layers:

### Presentation layer

Screens/components and view models.
Should focus on rendering and user events.

### Domain/application layer

Use-cases/business rules.
Should be mostly framework-independent.

### Data/infrastructure layer

API clients, repositories, storage adapters.
Injected upward into domain/presentation.

Benefits:
- easier testing
- easier refactoring
- lower coupling

---

## 9. Testing Benefits (Big Reason to Use DI)

Without DI:
- hard to test because code directly calls real network/storage.

With DI:
- inject fake repository/service
- test state transitions quickly and deterministically

Example idea:
- Inject `QuizRepository` fake returning known responses.
- Verify:
  - loading state
  - success state
  - error state

---

## 10. Common Mistakes

### Mistake 1: Too much global state

Not everything needs to be global.
Keep local state local.

### Mistake 2: Duplicating same state in many places

Creates sync bugs and inconsistent UI.

### Mistake 3: Mixing API side effects inside every UI callback

Hard to debug and test.
Move to service/use-case where possible.

### Mistake 4: No dependency boundaries

Direct imports to concrete services everywhere make changes expensive.

---

## 11. Decision Checklist

When adding a new feature, ask:

1. Is this state local or shared?
2. Is this client state or server state?
3. Do I need caching/retries/staleness handling?
4. What dependencies should be injected instead of hardcoded?
5. Can I test this behavior without real network/storage?

If answers are clear, implementation becomes much cleaner.

---

## 12. One-Sentence Summary

Good apps stay stable when:
- **state changes are predictable**, and
- **dependencies are explicit and replaceable**.
