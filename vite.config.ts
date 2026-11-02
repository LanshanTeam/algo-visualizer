import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // pathname 会把中文等非 ASCII 字符转成 %XX，需先解码，否则 @/ 别名指向不存在的目录
      "@": decodeURIComponent(new URL("./src", import.meta.url).pathname).replace(/^\/(\w:)/, "$1"),
    },
  },
  base: "./",
});
