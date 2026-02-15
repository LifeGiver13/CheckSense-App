# `app/_layout.jsx` Walkthrough

## Purpose
This file defines your app shell: auth provider, quiz generation provider, drawer navigation, and the custom drawer content.

## Line-by-line (simplified by ranges)

- `1-11`: Imports React, drawer tools, auth/context providers, and shared UI components/colors.
- `13-15`: Starts `RootLayout` and gets current path (`usePathname`) to know which menu item is active.
- `17-18`: `isActive(route)` checks if a drawer route matches the current path.
- `20-46`: `renderLink(...)` builds one drawer item with icon + label and active styling.
- `48-116`: `DrawerContent` custom drawer panel.
- `49`: Pulls auth actions/state (`logout`, `verifySession`, `isAuthenticated`, `isLoading`).
- `51`: Stores drawer navigation in `navigationRef` for link helper usage.
- `54-66`: Session checker effect:
  - Calls `verifySession` on open and every minute.
  - If invalid, alerts, logs out, and redirects to login.
- `68`: Returns `null` while auth is loading.
- `70-116`: Renders drawer UI:
  - Logo, username, links (`arrange-quiz`, `quizzes`, `settings`, `dashboard`)
  - Bottom action button for logout/login.
- `118-169`: Main provider tree and drawer config:
  - `AuthProvider` wraps everything.
  - `QuizGenerationProvider` wraps navigation.
  - Drawer header/menu setup and registered drawer screens.
- `172`: Global `navigationRef` declaration.
- `174-220`: Styles for drawer layout, links, spacing, and active states.

## Why this file matters

- If drawer behavior is wrong, routing can break globally.
- If session checking misbehaves, users can be forced out unexpectedly.
