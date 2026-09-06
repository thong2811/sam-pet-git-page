import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  publicDir: "public",
  server: {
    host: true,
    port: 3000,
    open: true
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        grooming: resolve(__dirname, "grooming.html")
      }
    }
  }
});
