import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

// In dev the dashboard is served by Vite, so the proxy adds the API token
// the server would otherwise inject into the page.
const token = (() => {
  try {
    return fs.readFileSync(path.resolve(__dirname, "../data/api-token"), "utf8").trim();
  } catch {
    return "";
  }
})();

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  build: { outDir: path.resolve(__dirname, "dist"), emptyOutDir: true, chunkSizeWarningLimit: 1500 },
  server: {
    port: 5318,
    proxy: { "/api": { target: "http://127.0.0.1:5317", changeOrigin: true, headers: token ? { "X-Coach-Token": token } : {} } },
  },
});
