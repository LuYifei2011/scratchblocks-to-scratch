import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        name: "将 scratchblocks 转换为 Scratch 积木块",
        // icon: "https://vitejs.dev/logo.svg",
        namespace: "https://luyifei2011.github.io/",
        author: "Lu Yifei",
        description: "将 scratchblocks 代码转换为 Scratch 积木块",
        homepage: "https://github.com/LuYifei2011/scratchblocks-to-scratch",
        supportURL: "https://github.com/LuYifei2011/scratchblocks-to-scratch/issues",
        updateURL: "https://luyifei2011.github.io/scratchblocks-to-scratch/scratchblocks-to-scratch.user.js",
        copyright: "2025-2026, Lu Yifei (https://github.com/LuYifei2011), licensed under GPL-3.0",
        match: [
          "https://turbowarp.org/editor*",
          "https://scratch.mit.edu/projects/*/editor*",
          "https://scratch.mit.edu/projects/editor*",
          "https://www.ccw.site/creator*",
          "https://www.ccw.site/gandi*",
        ],
        grant: ["GM_addStyle", "GM_getResourceText"],
      },
    }),
  ],
});
