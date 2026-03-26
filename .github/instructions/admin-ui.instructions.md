---
applyTo: "packages/admin-ui/src/**/*.ts,packages/admin-ui/src/**/*.tsx,packages/admin-ui/src/**/*.js,packages/admin-ui/src/**/*.scss"
---

# Copilot Instructions for admin-ui

## Overview

- The `admin-ui` module is the React-based frontend for Dappnode Package Manager.
- All code should be written using TypeScript and React best practices.
- The project is migrating from Bootstrap/SCSS (legacy) to Tailwind CSS v4 + shadcn/ui (new pages).
- **Legacy pages** live in `src/pages/` — they must never be modified.
- **New pages** live in `src/pages-new/` — all new development happens here.

## Directory Structure Guidelines

### Entry Points

- Main app entry: `src/App.tsx`
- React root: `src/index.tsx`

### Pages

- **New pages**: Create under `src/pages-new/`, organised by context folder:
  - `src/pages-new/home/` — Home / landing pages
  - `src/pages-new/ai/` — AI section pages
  - Add new context folders as needed (e.g. `src/pages-new/staking/`)
- **Legacy pages** (`src/pages/`): **Do not modify**. They use Bootstrap/SCSS and are served under `/staking`.
- For wizard or onboarding flows, use `src/start-pages/`.

### Layouts

- Reusable layout wrappers live in `src/pages-new/layouts/`.
- `NewPageLayout` — base wrapper for all new pages. Provides `.tw-base` reset, `min-h-screen`, `bg-background`, and an optional decorative gradient-orb background.
- `DecorativeBackground` — standalone decorative layer that can be used independently.

### Components

- **Primitives** (shadcn components): `src/components/primitives/` (button, card, sidebar, sheet, tooltip, etc.)
- **Reusable app components**: `src/components/`. Use PascalCase for component files.

### Hooks

- Custom React hooks: `src/hooks/` with `use` prefix (e.g., `useUser.ts`).
- shadcn-specific hooks: `src/hooks/components/` (e.g., `use-mobile.ts`).

### Other Directories

- **API layer**: `src/api/` and `src/services/` — always use these for backend requests.
- **Utils**: `src/utils/`
- **Lib**: `src/lib/` — contains `utils.ts` with the `cn()` helper (clsx + tailwind-merge).
- **State Management**: `src/store.ts` for Redux, `src/rootReducer.ts` for reducers.
- **Types**: `src/types.ts` for shared/global types.
- **Mock Backend**: `src/__mock-backend__/`
- **Tests**: `src/__tests__/`

## Import Conventions

This project uses `baseUrl: "src"` in `tsconfig.json` with `vite-tsconfig-paths` for Vite resolution.

**Always use bare imports** (relative to `src/`):

## Styling

### New Pages (Tailwind CSS v4 + shadcn)

- All Tailwind classes use the `tw:` prefix (e.g., `tw:flex`, `tw:bg-primary`).
- Design tokens are defined in `src/styles/tailwind.css`.
- The `.tw-base` class provides a scoped CSS reset (box-sizing, font-family, etc.) since Tailwind preflight is disabled to avoid breaking legacy Bootstrap styles.
- Every new page must be wrapped with either:
  - `<NewPageLayout>` from `pages-new/layouts` (provides `.tw-base` + optional decorative background), or
  - A raw `<div className="tw-base">` wrapper if a custom layout is needed.

### Legacy Pages (Bootstrap/SCSS)

- Common styles: `src/dappnode_styles.scss`, `src/dappnode_colors.scss`, `src/layout.scss`, `src/light_dark.scss`.
- Bootstrap is scoped under `.legacy-bootstrap` via `src/styles/bootstrap-scoped.scss`.
- Do not use Tailwind classes in legacy pages.

## Design Tokens and Layout Consistency

All design tokens are defined in `src/styles/tailwind.css`. **Always reuse existing tokens** when building layouts or composing pages.

### Layout Spacing Tokens

These tokens are available as Tailwind spacing utilities:

| Token                  | CSS Variable       | Default  | Usage                                 |
| ---------------------- | ------------------ | -------- | ------------------------------------- |
| `tw:px-page-x`         | `--page-padding-x` | `1.5rem` | Horizontal page padding               |
| `tw:py-page-y`         | `--page-padding-y` | `2rem`   | Vertical page padding                 |
| `tw:gap-section`       | `--section-gap`    | `2rem`   | Gap between major page sections       |
| `tw:gap-card`          | `--card-gap`       | `1rem`   | Gap between cards / list items        |
| `tw:mt-header-gap`     | `--header-gap`     | `0.5rem` | Space between heading and description |
| `tw:h-topbar-h`        | `--topbar-height`  | `3rem`   | Height of top bars / app bars         |
| `tw:max-w-content-max` | `--content-max-w`  | `64rem`  | Max width for main content areas      |

### Brand Colors

Available as `tw:bg-dn-blue`, `tw:text-dn-cyan`, etc.:

- Blue `#00B1F4`, Cyan `#06D4E7`, Orange `#FC9E22`, Pink `#E60AF6`, Purple `#5231C6`

### Semantic Colors (shadcn)

`primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`, `sidebar-*`, etc. — all defined in `tailwind.css` with light/dark variants.

### Rules

- Always reuse existing tokens. Do not hardcode spacing values that already have a token.
- If a new token is needed, add it to `tailwind.css` following the existing pattern (CSS variable in `:root` + `--spacing-*` mapping in `@theme inline`).
- Components may still use specific margins/paddings as exceptions when the token doesn't apply.

## shadcn Component Installation

### Installing a New Component

1. Navigate to `packages/admin-ui`.
2. Run:
   ```bash
   yarn dlx shadcn@latest add [COMPONENT_NAME]
   ```
   Components will be placed in `src/components/primitives/` (configured via `components.json`).

### Required Post-Install Fixes

After importing any shadcn component, apply these fixes before the code will compile:

1. **Replace `@/` imports with bare imports.** shadcn generates `@/` prefixed imports which fail in the Docker build. Change them to bare imports:

   ```ts
   // Generated by shadcn:
   import { cn } from "@/lib/utils";
   // Fix to:
   import { cn } from "lib/utils";
   ```

```ts
// ✅ Correct
import { Button } from "components/primitives/button";
import { cn } from "lib/utils";
import { useIsMobile } from "hooks/components/use-mobile";

// ❌ Wrong — @/ prefix fails in Docker builds
import { Button } from "@/components/primitives/button";
```

Apply this to all `@/` prefixed imports in the generated file (`lib/utils`, `components/primitives/*`, `hooks/components/*`).

2. **Add `import * as React from "react"`.** Some generated components (e.g., `skeleton.tsx`) may be missing the React import. Add it at the top if the file uses JSX or `React.*` APIs.

3. **Fix `Slot.Root` ref type mismatches.** Components that use Radix UI's `Slot.Root` with `asChild` pattern (like `sidebar.tsx`) produce TypeScript errors due to ref type incompatibility with React 18. Fix by casting:

   ```ts
   // Generated:
   const Comp = asChild ? Slot.Root : "button";
   // Fix to:
   const Comp = (asChild ? Slot.Root : "button") as React.ElementType;
   ```

4. **Verify the `"use client"` directive.** Some components include `"use client"` at the top. This is harmless in a non-RSC environment (this project uses `rsc: false` in `components.json`) and can be left in place.

## Page Creation Rules

When creating a new page:

1. **Place it inside `src/pages-new/`** in the appropriate context folder.
2. **Wrap it with `<NewPageLayout>`** (or `<div className="tw-base">` for custom layouts).
3. **Use layout spacing tokens** (`tw:px-page-x`, `tw:py-page-y`, `tw:gap-section`, `tw:gap-card`, `tw:mt-header-gap`).
4. **Add a route** in `src/App.tsx` under the "New UI routes" section.
5. **Never modify legacy pages** in `src/pages/`.

### Standard Page Structure

```tsx
import { NewPageLayout } from "pages-new/layouts";

export function MyPage() {
  return (
    <NewPageLayout>
      <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
        <header>
          <h1 className="tw:text-3xl tw:font-bold tw:tracking-tight tw:text-foreground">Title</h1>
          <p className="tw:mt-header-gap tw:text-muted-foreground tw:max-w-2xl">Description</p>
        </header>
        {/* Page content */}
      </div>
    </NewPageLayout>
  );
}
```

## API Integration

- Use `api` instance from `src/api/index.ts` for imperative calls (mutations, actions).
- Use `useApi` hook from `src/api/index.ts` for data fetching with SWR (auto-revalidation).
- Use `apiRoutes` from `src/api/index.ts` for URL helpers (e.g., `apiRoutes.containerLogsUrl`, `apiRoutes.fileDownloadUrl`, `apiRoutes.downloadUrl`, `apiRoutes.uploadFile`).
- For toasts in new pages, use **Sonner** (`import { toast } from "sonner"`), not the legacy `withToast`/`withToastNoThrow`.
- For destructive confirmation dialogs, use the `AlertDialog` primitive, not the legacy `confirm()` helper.

## Sidebar & Routing (AI Section)

The AI section (`/ai/*`) uses `AiLayout.tsx` as the master layout. To add a new page:

1. Create the page component under `src/pages-new/ai/[context]/`.
2. Add a `<Route>` entry in `AiLayout.tsx` inside the `<Routes>` block.
3. To make it appear in the sidebar, add an entry to the `navItems` array.
4. The `isActive` check uses `startsWith` for prefix matching—sub-routes are automatically highlighted.

### Package Detail Page Pattern

For pages with sub-tabs (like package detail), use this pattern:

- The parent route uses a wildcard: `<Route path="packages/:id/*" element={<PackageDetailPage />} />`
- Inside the detail page, use `<NavLink>` elements with a bottom-border active style as the tab bar.
- Each tab is a nested `<Route>` rendered inside the detail component.
- Include a `<Navigate>` fallback to redirect to the default tab.

## UI/UX Guidelines

- Use shared components from `src/components/` and `src/components/primitives/` whenever possible.
- Ensure accessibility: use semantic HTML, proper ARIA attributes, and keyboard navigation.
- Use `lucide-react` for icons (the project's configured icon library).
- Use `prettyDnpName()` from `utils/format` to display human-readable package names.
- Use `parseContainerState()` from `pages/packages/components/StateBadge/utils` for container status display (returns `{variant, state, title}`).
- For navigation between new and legacy pages, use `withLegacyBase(path)` from `utils/path` which prepends the legacy route base (`/staking`).

## Typography Primitives

The project provides typography components in `src/components/primitives/typography.tsx`:

- `TypographyH1` through `TypographyH4` — heading elements with consistent styling.
- `TypographyMuted` — muted paragraph text for descriptions.
- `TypographyInlineCode` — inline code snippets.
- Use these instead of raw `<h1>`, `<p>` elements in new pages for consistent typography.

## Coding Conventions

- Use explicit TypeScript types; avoid `any`.
- Use hooks for all state and effect logic.
- Keep components focused and reusable.
- Prefer functional components.
- Avoid placing business logic in UI components—delegate to hooks, services, or utilities.
