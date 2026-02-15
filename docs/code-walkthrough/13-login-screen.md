# `src/screens/LoginScreen.jsx` Walkthrough

## Purpose
Handles user login and navigation into the protected quiz flow.

## Line-by-line (simplified by ranges)

- `1-14`: Imports icons/router/hooks/ui/auth/theme.
- `16-22`: Component state:
  - `loginData` (username/password)
  - loading state
  - password visibility
  - error text.
- `24-51`: `handleLogin`:
  - validates empty fields
  - calls `login` from auth context
  - alerts success/failure
  - routes to `/arrange-quiz` on success.
- `53-124`: UI:
  - logo/header
  - username input
  - password input + eye toggle
  - login button
  - sign-up link
  - back home button.
- `126-235`: Styles.

## Why this file matters

- It is the authentication gate to all quiz features.
- Error handling here improves user recovery when auth fails.
