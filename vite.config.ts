import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const cursorAssetsRoot =
  "C:/Users/hosipowicz/.cursor/projects/c-Users-hosipowicz-Downloads-Wiosna-php-vue-Wiosna-php-vue/assets";

export default defineConfig({
  base: "/przygodnik/",
  plugins: [vue()],
  server: {
    fs: {
      allow: [projectRoot, cursorAssetsRoot]
    },
  }
});
