import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      // In dev mode, proxy API calls to Vercel CLI dev server (port 3000)
      // or use vercel dev which handles both
      proxy: process.env.PROXY_API
        ? {
            "/api": {
              target: process.env.PROXY_API || "http://localhost:3000",
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
