import * as modal from "./modal.js";

function getReduxState() {
  // 找到任意 React 挂载的节点
  const root =
    document.querySelector('[class*="gui_"]') || document.querySelector("#app") || document.body.firstElementChild;

  // 找 React Fiber key
  const fiberKey = Object.keys(root).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
  );
  if (!fiberKey) return null;

  let fiber = root[fiberKey];
  // 向上遍历找到有 stateNode.store 的节点（Redux Provider）
  while (fiber) {
    const state = fiber?.memoizedState?.element?.props?.store?.getState?.();
    if (state?.scratchGui?.vm) return state;
    // 或者直接在 stateNode 上找
    if (fiber.stateNode?.store) {
      const s = fiber.stateNode.store.getState();
      if (s?.scratchGui?.vm) return s;
    }
    fiber = fiber.return;
  }
  return null;
}

async function getBlockly() {
  // ---- 依赖：获取 React 内部 Fiber key ----
  function getInternalKey(elem) {
    const REACT_INTERNAL_PREFIXES = ["__reactFiber$"];
    return Object.keys(elem).find((key) => REACT_INTERNAL_PREFIXES.some((prefix) => key.startsWith(prefix)));
  }

  // ---- 依赖：从 wrapper 元素中找到持有 ScratchBlocks 的组件 ----
  function getBlocksComponent(wrapper) {
    const internal = wrapper[getInternalKey(wrapper)];
    let childable = internal;
    while (((childable = childable.child), !childable || !childable.stateNode || !childable.stateNode.ScratchBlocks)) {}
    return childable;
  }

  // ---- 依赖：等待目标元素出现（轮询实现） ----
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

  // ---- 主逻辑：getBlockly ----
  const BLOCKS_CLASS = '[class*="gui_blocks-wrapper_"]';
  let elem = document.querySelector(BLOCKS_CLASS);
  if (!elem) {
    elem = await waitForElement(BLOCKS_CLASS);
  }

  const childable = getBlocksComponent(elem);
  const Blockly = childable.stateNode.ScratchBlocks;

  console.log("Blockly instance:", Blockly);
  return Blockly;
}

// ---- scratchClass ----

function convertScratchToGandiClassName(className) {
  // 这个映射表的类名不是完全对应的，而是实际情况编写的
  // 无相应类名的，返回 "null"，以免发生错误
  const GANDI_CLASS_NAME_MAP = {
    // 菜单栏按钮
    "menu-bar_menu-bar-item": "gandi_project-title-input_title-field",
    "menu-bar_no-offset": "gandi_project-title-input_title-text",
    // 标签页
    gui_tabs: "gandi_editor-wrapper_tabList",
    "react-tabs_react-tabs__tab-list": "null",
    "gui_tab-list": "null",
    gui_tab: "null",
    "react-tabs_react-tabs__tab-panel": "null",
    "gui_tab-panel": "null",
    "gui_is-selected": "null",
    "react-tabs_react-tabs__tab": "react-tabs_react-gandi_editor-wrapper_tab",
    "react-tabs_react-tabs__tab--selected": "gandi_editor-wrapper_selected",
    // 对话框
    "modal_modal-overlay": "gandi_modal_modal-overlay",
  };
  if (window.location.href.startsWith("https://www.ccw.site/gandi/project/")) {
    return GANDI_CLASS_NAME_MAP[className] || "gandi_" + className;
  }
  console.warn(`[text2blocks] No class name mapping for "${className}" in this environment`);
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
  if (window.location.href.startsWith("https://www.ccw.site/gandi/project/")) {
    return arr.reverse(); // 反转数组，使得后面定义的类名优先匹配
  } else {
    return arr; // 不反转，保持原有顺序
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
      if (classNameToFind === "null") return "null";
      res +=
        classNamesArr.find(
          (className) => className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
        ) || "";
      res += " ";
    });

  // 处理末尾的 options 对象 { others: ... }
  if (args.length > 0 && typeof args[args.length - 1] === "object") {
    const options = args[args.length - 1];
    const others = Array.isArray(options.others) ? options.others : [options.others];
    others.forEach((string) => (res += string + " "));
  }

  res = res.slice(0, -1);
  res = res.replace(/"/g, ""); // 安全过滤
  return res;
}

export async function getAddonApi() {
  let reduxState, vm, workspace, api;
  // __SB2S_DESKTOP_TURBOWARP__ 由桌面版修补程序注入
  if (window.location.host === "turbowarp.org" || window.__SB2S_DESKTOP_TURBOWARP__) {
    api = {
      Blockly: window.ScratchBlocks,
      reduxState: window.ReduxStore.getState(),
      vm: window.vm,
      workspace: window.ScratchBlocks.getMainWorkspace(),
    };
  } else {
    reduxState = getReduxState();
    vm = reduxState?.scratchGui?.vm;
    workspace = window.Blockly.getMainWorkspace();
    api = { reduxState, vm, workspace };
    if (window.location.href.startsWith("https://www.ccw.site/gandi/project/")) {
      api.Blockly = workspace.getScratchBlocks();
    } else {
      api.Blockly = await getBlockly();
    }
  }

  const tab = {
    scratchClass,
    Blockly: api.Blockly,
    scratchMessage: (m) =>
      api.Blockly?.ScratchMsgs?.locales?.[api.Blockly?.ScratchMsgs?.currentLocale_]?.[m] ||
      api.reduxState?.locales?.messages?.[m] ||
      m,
  };

  function prompt(title, message, defaultValue, opts) {
    return modal.prompt(tab, title, message, defaultValue, opts);
  }

  function confirm(title, message, opts) {
    return modal.confirm(tab, title, message, opts);
  }

  function createModal(title, { isOpen = false } = {}) {
    return modal.createEditorModal(tab, title, { isOpen });
  }

  tab.prompt = prompt;
  tab.confirm = confirm;
  tab.createModal = createModal;

  api.tab = tab;
  return api;
}
