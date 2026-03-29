import { getAddonApi } from "./scratch-api.js";
import text2Blocks from "./text2blocks/userscript.js";
import "./style.js";

import zhCN from "./i18n/zh-cn.js";

setTimeout(async () => {
  const api = (window.api = await getAddonApi());
  console.log("[text2blocks] API", api);
  text2Blocks({
    addon: api,
    console: {
      log: (...args) => console.log("[text2blocks]", ...args),
      error: (...args) => console.error("[text2blocks]", ...args),
    },
    msg: (t) => zhCN[t] || t,
  });
}, 2000);
