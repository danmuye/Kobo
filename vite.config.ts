import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) return "chunk-recharts";
          if (id.includes("node_modules/framer-motion")) return "chunk-framer";
          if (id.includes("node_modules/firebase")) return "chunk-firebase";
          if (id.includes("node_modules/lucide-react")) return "chunk-icons";
          if (id.includes("node_modules/@radix-ui")) return "chunk-radix";
          if (id.includes("node_modules")) return "chunk-vendor";
        },
      },
    },
  },
});
