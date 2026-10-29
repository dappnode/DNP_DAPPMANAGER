import { defineConfig } from "vitest/config";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [viteTsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/__tests__/pages/vpn/*tailscale*.test.ts", "src/__tests__/pages/vpn/TailscaleVpn.test.tsx"],
    restoreMocks: true
  }
});
