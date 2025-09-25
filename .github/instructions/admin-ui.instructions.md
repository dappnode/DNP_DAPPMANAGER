---
applyTo: "packages/admin-ui/src/**/*.ts,packages/admin-ui/src/**/*.tsx,packages/admin-ui/src/**/*.js,packages/admin-ui/src/**/*.scss"
---
# Copilot Instructions for admin-ui

## Overview
- The `admin-ui` module is the React-based frontend for Dappnode Package Manager.
- All code should be written using TypeScript and React best practices.

## Directory Structure Guidelines
- **Entry Points:**  
  - Main app entry: `src/App.tsx`  
  - React root: `src/index.tsx`
- **Pages:**  
  - Add new UI views under `src/pages/`. Use PascalCase for file names (e.g., `UserManagement.tsx`).
  - For wizard or onboarding flows, use `src/start-pages/`.
- **Components:**  
  - Reusable components go in `src/components/`. Use PascalCase for component files.
- **Hooks:**  
  - Custom React hooks should be placed in `src/hooks/` and named with the `use` prefix (e.g., `useUser.ts`).
- **API layer:**  
  - API calls and logic reside in `src/api/` and `src/services/`.
  - Always use functions from these directories when making backend requests.
- **Utils:**  
  - Utility helpers should go in `src/utils/`.
- **State Management:**  
  - Use `src/store.ts` for Redux or main store logic, and `src/rootReducer.ts` for reducers.
- **Types:**  
  - Shared/global types should go in `src/types.ts`.
- **Mock Backend:**  
  - For tests and development, use `src/__mock-backend__/`.
- **Tests:**  
  - Place all tests in `src/__tests__/`.

## Styling
- Use SCSS for styling.  
  - Common styles: `src/dappnode_styles.scss`, `src/dappnode_colors.scss`, `src/layout.scss`, `src/light_dark.scss`.
  - Prefer CSS modules or SCSS imports over inline styles.

## API Integration
- Use api instance from `src/api/index.ts` for making api calls.
- Use `useApi` instance from `src/api/index.ts` for making api calls with SWR.

## UI/UX Guidelines
- Use shared components from `src/components/` whenever possible.
- Ensure accessibility: use semantic HTML, proper ARIA attributes, and keyboard navigation.
- When adding new pages, update navigation menus as required (in `src/components/Sidebar.tsx` or similar).

## Coding Conventions
- Use explicit TypeScript types; avoid `any`.
- Use hooks for all state and effect logic.
- Keep components focused and reusable.
- Prefer functional components.
- Avoid placing business logic in UI components—delegate to hooks, services, or utilities.

