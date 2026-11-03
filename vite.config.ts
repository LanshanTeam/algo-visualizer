import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // pathname 里的中文、空格是百分号转义，先 decodeURI 再交给打包器。
      "@": decodeURI(new URL("./src", import.meta.url).pathname).replace(
        /^\/(\w:)/,
        "$1",
      ),
    },
  },
  base: "./",
});
