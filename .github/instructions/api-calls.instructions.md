---
applyTo: "packages/types/src/routes.ts,packages/dappmanager/src/calls/**/*.ts,packages/admin-ui/src/**/*.tsx"
---

## Creating a New Frontend-Backend API Call

- **Definition:** A frontend-backend API call is any function that fetches or sends data between the frontend (`admin-ui`) and backend (`dappmanager`), e.g., REST, GraphQL, or RPC endpoints.

### 1. Define API Call Logic
- Create a new file under `packages/dappmanager/src/calls/` with a descriptive, camelCase name (e.g., `getUser.ts`).
- If logic becomes complex or reusable, import code from shared modules instead of implementing all logic in `dappmanager`.

**Example:**
```ts
// packages/dappmanager/src/calls/chainDataGet.ts
import { getChainsData } from "@dappnode/chains";
import { ChainData } from "@dappnode/types";

export async function chainDataGet(): Promise<ChainData[]> {
  return await getChainsData();
}

```

### 2. Register the API Call
- Add a corresponding route/type/interface to `packages/types/src/routes.ts` so it can be used by the frontend.
- Use camelCase for route names and document the request/response types.

**Example:**
```ts
// packages/types/src/routes.ts
  chainDataGet(): Promise<ChainData[]>;
```

### 3. Use the API Call in the Frontend
- In `packages/admin-ui/src/`, import and use the API call according to the route definition.

**Example:**
```tsx
// packages/admin-ui/src/hooks/chainData.tsx
import { useApi } from "api";
import { ChainData } from "@dappnode/types";
import { useEffect } from "react";

/**
 * Fetches chainData from api.chainDataGet() and repository status from redux
 *
 * Common function for
 * - top nav bar dropdown chains
 * - Dashboard chains
 */
export function useChainData(): ChainData[] {
  const chainDataRes = useApi.chainDataGet();

  useEffect(() => {
    const interval = setInterval(chainDataRes.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [chainDataRes]);

  if (!chainDataRes.data) {
    return [];
  }

  return chainDataRes.data;
}
```

### 4. Guidelines
- Do not place full API logic inside the dappmanager module; use imports for shared code when code becomes complex.
- Document new APIs in the README or main docs if needed.
- Follow existing naming and file structure conventions.