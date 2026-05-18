import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    viteTsconfigPaths(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5176,
    strictPort: false,
  },
});
