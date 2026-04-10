# Gate Password Design

**Date:** 2026-04-10
**Status:** Approved

## Overview

Add a simple PIN gate screen to prevent anonymous access until Fincs authentication is implemented. Users enter a 4-digit PIN once per device; the result is persisted in localStorage.

## Design

### Component: GateScreen

Added to `client/src/App.jsx`.

- On app load, check `localStorage.getItem('jta_gate') === '1'`
- If not set, render `GateScreen` instead of the normal app
- `GateScreen` shows a 4-digit PIN input
- On submit: if PIN === `'8787'`, set `localStorage.setItem('jta_gate', '1')` and proceed
- On wrong PIN: show error message, clear input

### Persistence

localStorage — persists per device until cache/storage cleared. No expiry.

### Files Changed

- `client/src/App.jsx` — add `GateScreen` component, gate check in `App`

## Out of Scope

- Backend validation
- PIN rotation
- Per-user tracking
