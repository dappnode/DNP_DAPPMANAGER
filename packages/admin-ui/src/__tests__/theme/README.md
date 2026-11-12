Run `yarn mock-standalone` from the repository root, then open these URLs on the Vite port:

- `/theme-contrast.html`: renders Tailscale connection states and shared components, then measures both themes. Expected title: `0 contrast failures`.
- `/theme-pages.html`: visits the mock application screens in light and dark mode, using the real theme switch. The final page displays JSON with contrast findings and mock loading/error states. Allow about two minutes. It never submits forms or changes a real Dappnode.

Both entries are development test pages, excluded from the production build. The scanner measures browser-computed foreground/background colors, alpha and ancestor opacity. It requires 4.5:1 for normal text and 3:1 for large text. Disabled controls, invisible layout placeholders, and text over images/gradients are excluded; the latter still needs visual review. Hidden dialogs and alternate data states need fixtures or manual checks.

For a local automation runner, `/theme-pages.html?report=1` also POSTs the mock results to an optional listener at `http://127.0.0.1:5186/results`. Without that flag, all results stay on the test page.
