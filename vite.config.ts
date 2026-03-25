import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "./",
  plugins: [vue()],
  server: {
    fs: {
      allow: [
        "C:/Users/hosipowicz/Downloads/Wiosna - php vue/Wiosna - php vue",
        "C:/Users/hosipowicz/.cursor/projects/c-Users-hosipowicz-Downloads-Wiosna-php-vue-Wiosna-php-vue/assets"
      ]
    }
  }
});
