import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", ".next", "dist"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "@inspectos/domains": resolve(__dirname, "../../packages/domains"),
      "@inspectos/platform": resolve(__dirname, "../../packages/platform"),
    },
  },
});
