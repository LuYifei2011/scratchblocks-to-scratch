import * as modal from "./modal.js";

const isTurboWarp = window.location.host === "turbowarp.org" || !!window.__SB2S_DESKTOP_TURBOWARP__;
const isCCW = window.location.href.startsWith("https://www.ccw.site");
const isGandi = window.location.href.startsWith("https://www.ccw.site/gandi");

// ---- 默认设置（硬编码） ----
const DEFAULT_SETTINGS = {
  autoPaste: true,
};

// ---- Redux State ----

function getReduxState() {
  if (isTurboWarp) return window.ReduxStore.getState();

  const root =
    document.querySelector('[class*="gui_"]') || document.querySelector("#app") || document.body.firstElementChild;

  const fiberKey = Object.keys(root).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
  );
  if (!fiberKey) return null;

  let fiber = root[fiberKey];
  while (fiber) {
    const state = fiber?.memoizedState?.element?.props?.store?.getState?.();
    if (state?.scratchGui?.vm) return state;
    if (fiber.stateNode?.store) {
      const s = fiber.stateNode.store.getState();
      if (s?.scratchGui?.vm) return s;
    }
    fiber = fiber.return;
  }
  return null;
}

// ---- Blockly（从 React Fiber 中获取） ----

async function getBlocklyFromFiber() {
  function getInternalKey(elem) {
    const REACT_INTERNAL_PREFIXES = ["__reactFiber$", "__reactInternalInstance$"];
    return Object.keys(elem).find((key) => REACT_INTERNAL_PREFIXES.some((prefix) => key.startsWith(prefix)));
  }

  function getBlocksComponent(wrapper) {
    const internal = wrapper[getInternalKey(wrapper)];
    let childable = internal;
    while (((childable = childable.child), !childable || !childable.stateNode || !childable.stateNode.ScratchBlocks)) {}
    return childable;
  }

  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
      }, timeout);
    });
  }

  const BLOCKS_CLASS = '[class*="gui_blocks-wrapper_"]';
  let elem = document.querySelector(BLOCKS_CLASS);
  if (!elem) {
    elem = await waitForElement(BLOCKS_CLASS);
  }

  const childable = getBlocksComponent(elem);
  return childable.stateNode.ScratchBlocks;
}

// ---- scratchClass ----

function convertScratchToGandiClassName(className) {
  const GANDI_CLASS_NAME_MAP = {
    gui_tabs: "gandi_editor-wrapper_tabList",
    "react-tabs_react-tabs__tab-list": "null",
    "gui_tab-list": "gandi_editor-wrapper_tabList",
    gui_tab: "null",
    "react-tabs_react-tabs__tab-panel": "null",
    "gui_tab-panel": "gandi_editor-wrapper_tabPanel",
    "gui_is-selected": "null",
    "react-tabs_react-tabs__tab": "gandi_editor-wrapper_tab",
    "react-tabs_react-tabs__tab--selected": "gandi_editor-wrapper_selected",
    "react-tabs_react-tabs__tab-panel--selected": "null",
    "modal_modal-overlay": "gandi_modal_modal-overlay",
  };
  if (isGandi) {
    return (
      GANDI_CLASS_NAME_MAP[className] ||
      console.warn(`[text2blocks] No class name mapping for "${className}" in this environment`) ||
      "gandi_" + className
    );
  }
  return className;
}

function loadScratchClassNames() {
  function getAllRules(e) {
    let result = [];
    if (e instanceof CSSStyleRule) result.push(e);
    try {
      result = [...result, [...e.cssRules].map((e) => getAllRules(e)).flat()];
    } catch {}
    return result.flat();
  }

  const arr = [
    ...new Set(
      [...document.styleSheets]
        .filter(
          (styleSheet) =>
            !(
              styleSheet.ownerNode.textContent.startsWith(
                "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
              ) &&
              (styleSheet.ownerNode.textContent.includes("input_input-form") ||
                styleSheet.ownerNode.textContent.includes("label_input-group_"))
            )
        )
        .map((e) => getAllRules(e))
        .flat()
        .map((e) => e.selectorText)
        .filter((e) => e)
        .map((e) => e.match(/(([\w-]+?)_([\w-]+)_(([\w\d-]|\\\+)+))/g))
        .filter((e) => e)
        .flat()
        .map((e) => e.replace(/\\\+/g, "+"))
    ),
  ];
  if (isGandi) {
    return arr.reverse();
  } else {
    return arr;
  }
}

let _scratchClassNamesCache = null;

function scratchClass(...args) {
  if (!_scratchClassNamesCache) {
    _scratchClassNamesCache = loadScratchClassNames();
  }
  const classNamesArr = _scratchClassNamesCache;

  let res = "";

  args
    .filter((arg) => typeof arg === "string")
    .forEach((classNameToFind) => {
      classNameToFind = convertScratchToGandiClassName(classNameToFind);
      if (classNameToFind === "null") res += "null";
      res +=
        classNamesArr.find(
          (className) => className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
        ) || "";
      res += " ";
    });

  if (args.length > 0 && typeof args[args.length - 1] === "object") {
    const options = args[args.length - 1];
    const others = Array.isArray(options.others) ? options.others : [options.others];
    others.forEach((string) => (res += string + " "));
  }

  res = res.slice(0, -1);
  res = res.replace(/"/g, "");
  return res;
}

// ---- createBlockContextMenu（从 SA Tab.js 移植，去除 addonId 依赖） ----

const contextMenuCallbacks = [];
let createdAnyBlockContextMenus = false;

function setupBlockContextMenu(ScratchBlocks) {
  if (ScratchBlocks.registry) {
    // new Blockly
    const oldGenerateContextMenu = ScratchBlocks.BlockSvg.prototype.generateContextMenu;
    ScratchBlocks.BlockSvg.prototype.generateContextMenu = function (...args) {
      let items = oldGenerateContextMenu.call(this, ...args);
      for (const { callback, blocks, flyout } of contextMenuCallbacks) {
        const injectMenu = (blocks && !this.isInFlyout) || (flyout && this.isInFlyout);
        if (injectMenu) {
          try {
            items = callback(items, this);
          } catch (e) {
            console.error("Error while calling context menu callback: ", e);
          }
        }
      }
      return items;
    };
    return;
  }

  // old Blockly (Scratch / Gandi / CCW 等)
  const oldShow = ScratchBlocks.ContextMenu.show;
  ScratchBlocks.ContextMenu.show = function (event, items, rtl) {
    const gesture = ScratchBlocks.mainWorkspace.currentGesture_;
    const block = gesture.targetBlock_;

    for (const { callback, workspace, blocks, flyout, comments } of contextMenuCallbacks) {
      const injectMenu =
        (workspace && !block && !gesture.flyout_ && !gesture.startBubble_) ||
        (blocks && block && !gesture.flyout_) ||
        (flyout && gesture.flyout_) ||
        (comments && gesture.startBubble_);
      if (injectMenu) {
        try {
          items = callback(items, block);
        } catch (e) {
          console.error("Error while calling context menu callback: ", e);
        }
      }
    }

    if (!isTurboWarp && !isCCW) {
      // 原版 Scratch（可能安装了 SA）：将 separator 属性展开为单独的分隔项，
      // 兼容 SA 的 createWidget_ 覆写方式（分隔线作为独立项，padding: 0）
      const expandedItems = [];
      for (const item of items) {
        if (item.separator && item.text) {
          expandedItems.push({ separator: true, enabled: false, text: "" });
          const { separator: _, ...rest } = item;
          expandedItems.push(rest);
        } else {
          expandedItems.push(item);
        }
      }
      items = expandedItems;

      const oldCreateWidget = ScratchBlocks.ContextMenu.createWidget_;
      ScratchBlocks.ContextMenu.createWidget_ = function (...args) {
        oldCreateWidget.call(this, ...args);
        const blocklyContextMenu = ScratchBlocks.WidgetDiv.DIV.firstChild;
        items.forEach((item, i) => {
          if (item.separator) {
            const itemElt = blocklyContextMenu.children[i];
            itemElt.setAttribute("role", "separator");
            itemElt.style.padding = "0";
            if (i !== 0) {
              itemElt.style.borderTop = "1px solid hsla(0, 0%, 0%, 0.15)";
            }
          }
        });
      };

      oldShow.call(this, event, items, rtl);

      ScratchBlocks.ContextMenu.createWidget_ = oldCreateWidget;
    } else {
      // TW/CCW（含 Gandi）：渲染后给带有 separator 属性的菜单项添加分隔线样式
      // （与 TW addons 的 createBlockContextMenu 行为一致）
      oldShow.call(this, event, items, rtl);

      const blocklyContextMenu = ScratchBlocks.WidgetDiv.DIV.firstChild;
      items.forEach((item, i) => {
        if (i !== 0 && item.separator) {
          const itemElt = blocklyContextMenu.children[i];
          itemElt.style.paddingTop = "2px";
          itemElt.classList.add("sa-blockly-menu-item-border");
          itemElt.style.borderTop = "1px solid var(--ui-black-transparent, hsla(0, 0%, 0%, 0.15))";
        }
      });
    }
  };
}

// ---- 主入口：构建 SA 兼容 API ----

export async function getAddonApi() {
  // 1. 获取核心对象：Blockly, reduxState, vm, workspace
  let BlocklyInstance, reduxState, vm, workspace;

  if (isTurboWarp) {
    BlocklyInstance = window.ScratchBlocks;
    reduxState = window.ReduxStore.getState();
    vm = window.vm;
    workspace = BlocklyInstance.getMainWorkspace();
  } else {
    reduxState = getReduxState();
    vm = reduxState?.scratchGui?.vm;
    workspace = window.Blockly.getMainWorkspace();
    if (isGandi) {
      BlocklyInstance = workspace.getScratchBlocks();
    } else {
      BlocklyInstance = await getBlocklyFromFiber();
    }
  }

  // 2. 构建 tab.traps（兼容 SA Trap 类接口）
  const traps = {
    getBlockly: () => Promise.resolve(BlocklyInstance),
    getWorkspace: () => workspace,
    get vm() {
      return vm;
    },
  };

  // 3. 构建 tab.redux（兼容 SA ReduxHandler 接口）
  const redux = {
    get state() {
      // TurboWarp 的 ReduxStore 每次 getState() 获取最新状态
      if (isTurboWarp) return window.ReduxStore.getState();
      return getReduxState();
    },
  };

  // 4. 构建 tab 对象（兼容 SA Tab 类接口）
  const tab = {
    // ---- 从 SA Tab 移植的属性 ----
    Blockly: BlocklyInstance,
    editorMode: "editor",
    clientVersion: "scratch-www",

    get direction() {
      const rtlLocales = ["ar", "ckb", "fa", "he"];
      const locale = redux.state?.locales?.locale || "en";
      const lang = locale.split("-")[0];
      return rtlLocales.includes(lang) ? "rtl" : "ltr";
    },

    // ---- 从 SA Tab 移植的方法 ----
    traps,
    redux,
    scratchClass,

    scratchMessage(m) {
      return (
        BlocklyInstance?.ScratchMsgs?.locales?.[BlocklyInstance?.ScratchMsgs?.currentLocale_]?.[m] ||
        reduxState?.locales?.messages?.[m] ||
        m
      );
    },

    createModal(title, { isOpen = false } = {}) {
      return modal.createEditorModal(tab, title, { isOpen });
    },

    prompt(title, message, defaultValue, opts) {
      return modal.prompt(tab, title, message, defaultValue, opts);
    },

    confirm(title, message, opts) {
      return modal.confirm(tab, title, message, opts);
    },

    createBlockContextMenu(callback, { workspace = false, blocks = false, flyout = false, comments = false } = {}) {
      contextMenuCallbacks.push({ callback, workspace, blocks, flyout, comments });

      if (createdAnyBlockContextMenus) return;
      createdAnyBlockContextMenus = true;

      setupBlockContextMenu(BlocklyInstance);
    },
  };

  // 5. 构建完整的 SA 兼容 addon 对象
  return {
    tab,
    settings: {
      get(key) {
        return DEFAULT_SETTINGS[key];
      },
    },
    self: {
      disabled: false,
    },
  };
}
