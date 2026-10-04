import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/klb-roadside/",
  build: {
    sourcemap: true,
  },
});
