import { getAddonApi } from "./scratch-api.js";
import text2Blocks from "./text2blocks/userscript.js";
import "./style.js";

import msgs from "./i18n/index.js";

async function main() {
  const api = (window.api = await getAddonApi());
  console.log("[text2blocks] API", api);
  text2Blocks({
    addon: api,
    console: {
      log: (...args) => console.log("[text2blocks]", ...args),
      error: (...args) => console.error("[text2blocks]", ...args),
    },
    msg: (t, vars) => {
      let str = msgs[api?.tab?.redux?.state?.locales?.locale]?.[t] || msgs["en"]?.[t] || t;
      if (vars) {
        for (const [key, val] of Object.entries(vars)) {
          str = str.replaceAll(`{${key}}`, val);
        }
      }
      return str;
    },
  });
}

function waitForLoaded() {
  if (document.querySelector(".blocklyWorkspace") && (window.Blockly || window.ScratchBlocks)) {
    setTimeout(main, 1000);
  } else {
    setTimeout(waitForLoaded, 100);
  }
}

waitForLoaded();
