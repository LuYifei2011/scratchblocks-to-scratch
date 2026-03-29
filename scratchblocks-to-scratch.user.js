// ==UserScript==
// @name         将 scratchblocks 转换为 Scratch 积木块
// @namespace    https://luyifei2011.github.io/
// @version      0.0.1-alpha
// @author       Lu Yifei
// @description  将 scratchblocks 代码转换为 Scratch 积木块
// @copyright    2025-2026, Lu Yifei (https://github.com/LuYifei2011), licensed under GPL-3.0
// @homepage     https://github.com/LuYifei2011/scratchblocks-to-scratch
// @supportURL   https://github.com/LuYifei2011/scratchblocks-to-scratch/issues
// @updateURL    https://luyifei2011.github.io/scratchblocks-to-scratch/scratchblocks-to-scratch.user.js
// @match        https://turbowarp.org/editor/*
// @match        https://turbowarp.org/editor
// @match        https://scratch.mit.edu/projects/*/editor
// @match        https://scratch.mit.edu/projects/editor
// @match        https://www.ccw.site/creator/project/*
// @match        https://www.ccw.site/creator
// @match        https://www.ccw.site/creator/
// @match        https://www.ccw.site/gandi/project/*
// @match        https://www.ccw.site/gandi
// @match        https://www.ccw.site/gandi/
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(async function () {
  'use strict';

  const icons = {
    "close-s3": "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3LjQ4IDcuNDgiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDpub25lO3N0cm9rZTojZmZmO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6MnB4O308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi0tYWRkPC90aXRsZT48bGluZSBjbGFzcz0iY2xzLTEiIHgxPSIzLjc0IiB5MT0iNi40OCIgeDI9IjMuNzQiIHkyPSIxIi8+PGxpbmUgY2xhc3M9ImNscy0xIiB4MT0iMSIgeTE9IjMuNzQiIHgyPSI2LjQ4IiB5Mj0iMy43NCIvPjwvc3ZnPg==",
    "close-gandi": '<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.657 6.112L6.343 17.426m0-11.314l11.314 11.314" stroke="#566276" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
  };
  const isGandi = window.location.href.startsWith("https://www.ccw.site/gandi/project/");
  const createEditorModal = (tab, title, { isOpen = false } = {}) => {
    const container = Object.assign(document.createElement("div"), {
      className: tab.scratchClass("modal_modal-overlay"),
      dir: tab.direction
    });
    container.style.display = "none";
    document.body.appendChild(container);
    const modal = Object.assign(document.createElement("div"), {
      className: tab.scratchClass("modal_modal-content")
    });
    modal.addEventListener("click", (e) => e.stopPropagation());
    container.appendChild(modal);
    const header = Object.assign(document.createElement("div"), {
      className: tab.scratchClass("modal_header")
    });
    modal.appendChild(header);
    header.appendChild(
      Object.assign(document.createElement("div"), {
        className: tab.scratchClass("modal_header-item", "modal_header-item-title"),
        innerText: title
      })
    );
    const closeContainer = Object.assign(document.createElement("div"), {
      className: tab.scratchClass("modal_header-item", "modal_header-item-close")
    });
    header.appendChild(closeContainer);
    const closeButton = Object.assign(document.createElement("div"), {
      className: tab.scratchClass("close-button_close-button", "close-button_large")
    });
    closeContainer.appendChild(closeButton);
    if (isGandi) {
      closeButton.innerHTML = icons["close-gandi"];
    } else {
      closeButton.appendChild(
        Object.assign(document.createElement("img"), {
          className: tab.scratchClass("close-button_close-icon"),
          src: icons["close-s3"],
          draggable: false
        })
      );
    }
    const content = Object.assign(document.createElement("div"), {
      className: "sa-editor-modal-content",
      style: `
      background-color: var(--editorDarkMode-accent, white);
      color: var(--editorDarkMode-accent-text, #575e75);
    `
    });
    modal.appendChild(content);
    const open = () => {
      container.style.display = "";
      if (tab.editorMode === "editor") {
        tab.Blockly.hideChaff();
      }
    };
    if (isOpen) open();
    return {
      container: modal,
      content,
      backdrop: container,
      closeButton,
      open,
      close: () => {
        container.style.display = "none";
      },
      remove: container.remove.bind(container)
    };
  };
  const createButtonRow = (tab, mode, { okButtonLabel, cancelButtonLabel } = {}) => {
    const buttonRow = Object.assign(document.createElement("div"), {
      className: {
        editor: tab.scratchClass("prompt_button-row"),
        "scratch-www": "action-buttons",
        scratchr2: "modal-footer"
      }[mode]
    });
    const cancelButton = Object.assign(document.createElement("button"), {
      className: { "scratch-www": "button action-button close-button white" }[mode] || "",
      innerText: cancelButtonLabel || tab.scratchMessage(
        {
          editor: "gui.prompt.cancel",
          "scratch-www": "general.cancel",
          scratchr2: "Cancel"
        }[mode]
      )
    });
    buttonRow.appendChild(cancelButton);
    const okButton = Object.assign(document.createElement("button"), {
      className: {
        editor: tab.scratchClass("prompt_ok-button"),
        "scratch-www": "button action-button submit-button"
      }[mode],
      innerText: okButtonLabel || tab.scratchMessage(
        {
          editor: "gui.prompt.ok",
          "scratch-www": "general.okay",
          scratchr2: "OK"
        }[mode]
      )
    });
    buttonRow.appendChild(okButton);
    return { buttonRow, cancelButton, okButton };
  };
  const confirm = (tab, title, message, { useEditorClasses = false, okButtonLabel, cancelButtonLabel } = {}) => {
    const { remove, container, content, backdrop, closeButton } = tab.createModal(title, {
      isOpen: true,
      useEditorClasses,
      useSizesClass: true
    });
    const mode = tab.editorMode !== null && useEditorClasses ? "editor" : tab.clientVersion;
    if (mode === "editor") {
      container.classList.add(tab.scratchClass("prompt_modal-content"));
      content.classList.add(tab.scratchClass("prompt_body"));
    }
    content.appendChild(
      Object.assign(document.createElement("div"), {
        className: {
          editor: tab.scratchClass("prompt_label"),
          "scratch-www": "sa-confirm-text"
        }[mode] || "",
        style: { "scratch-www": "margin: .9375rem 0.8275rem 0 .8275rem" }[mode] || "",
        innerText: message
      })
    );
    const { buttonRow, cancelButton, okButton } = createButtonRow(tab, mode, {
      okButtonLabel,
      cancelButtonLabel
    });
    if (mode === "scratchr2") container.appendChild(buttonRow);
    else content.appendChild(buttonRow);
    okButton.focus();
    return new Promise((resolve) => {
      const cancel = () => {
        remove();
        resolve(false);
      };
      const ok = () => {
        remove();
        resolve(true);
      };
      backdrop.addEventListener("click", cancel);
      closeButton.addEventListener("click", cancel);
      cancelButton.addEventListener("click", cancel);
      okButton.addEventListener("click", ok);
      container.addEventListener("keydown", (e) => {
        if (e.key === "Enter") ok();
        if (e.key === "Escape") cancel();
      });
    });
  };
  const prompt = (tab, title, message, defaultValue = "", { useEditorClasses = false } = {}) => {
    const { remove, container, content, backdrop, closeButton } = tab.createModal(title, {
      isOpen: true,
      useEditorClasses,
      useSizesClass: true
    });
    const mode = tab.editorMode !== null && useEditorClasses ? "editor" : tab.clientVersion;
    if (mode === "editor") {
      container.classList.add(tab.scratchClass("prompt_modal-content"));
      content.classList.add(tab.scratchClass("prompt_body"));
    }
    content.appendChild(
      Object.assign(document.createElement("div"), {
        className: { editor: tab.scratchClass("prompt_label") }[mode] || "",
        style: { "scratch-www": "margin: .9375rem 0.8275rem 1.125rem .8275rem" }[mode] || "",
        innerText: message
      })
    );
    const input = Object.assign(document.createElement("input"), {
      className: { editor: tab.scratchClass("prompt_variable-name-text-input"), "scratch-www": "input" }[mode] || "",
      style: {
        "scratch-www": `
      width: calc(100% - 1.655rem);
      margin: 0 0.8275rem;
    `,
        scratchr2: "width: calc(100% - 10px)"
      }[mode] || "",
      value: defaultValue
    });
    content.appendChild(input);
    input.focus();
    input.select();
    const { buttonRow, cancelButton, okButton } = createButtonRow(tab, mode);
    if (mode === "scratchr2") container.appendChild(buttonRow);
    else content.appendChild(buttonRow);
    return new Promise((resolve) => {
      const cancel = () => {
        remove();
        resolve(null);
      };
      const ok = () => {
        remove();
        resolve(input.value);
      };
      backdrop.addEventListener("click", cancel);
      closeButton.addEventListener("click", cancel);
      cancelButton.addEventListener("click", cancel);
      okButton.addEventListener("click", ok);
      container.addEventListener("keydown", (e) => {
        if (e.key === "Enter") ok();
        if (e.key === "Escape") cancel();
      });
    });
  };
  function getReduxState() {
    const root = document.querySelector('[class*="gui_"]') || document.querySelector("#app") || document.body.firstElementChild;
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
  async function getBlockly() {
    function getInternalKey(elem2) {
      const REACT_INTERNAL_PREFIXES = ["__reactFiber$"];
      return Object.keys(elem2).find((key) => REACT_INTERNAL_PREFIXES.some((prefix) => key.startsWith(prefix)));
    }
    function getBlocksComponent(wrapper) {
      const internal = wrapper[getInternalKey(wrapper)];
      let childable2 = internal;
      while (childable2 = childable2.child, !childable2 || !childable2.stateNode || !childable2.stateNode.ScratchBlocks) {
      }
      return childable2;
    }
    function waitForElement(selector, timeout = 1e4) {
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
    const Blockly = childable.stateNode.ScratchBlocks;
    console.log("Blockly instance:", Blockly);
    return Blockly;
  }
  function convertScratchToGandiClassName(className) {
    const GANDI_CLASS_NAME_MAP = {
"menu-bar_menu-bar-item": "gandi_project-title-input_title-field",
      "menu-bar_no-offset": "gandi_project-title-input_title-text",
gui_tabs: "gandi_editor-wrapper_tabList",
      "react-tabs_react-tabs__tab-list": "null",
      "gui_tab-list": "null",
      gui_tab: "null",
      "react-tabs_react-tabs__tab-panel": "null",
      "gui_tab-panel": "null",
      "gui_is-selected": "null",
      "react-tabs_react-tabs__tab": "react-tabs_react-gandi_editor-wrapper_tab",
      "react-tabs_react-tabs__tab--selected": "gandi_editor-wrapper_selected",
"modal_modal-overlay": "gandi_modal_modal-overlay"
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
        result = [...result, [...e.cssRules].map((e2) => getAllRules(e2)).flat()];
      } catch {
      }
      return result.flat();
    }
    const arr = [
      ...new Set(
        [...document.styleSheets].filter(
          (styleSheet) => !(styleSheet.ownerNode.textContent.startsWith(
            "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
          ) && (styleSheet.ownerNode.textContent.includes("input_input-form") || styleSheet.ownerNode.textContent.includes("label_input-group_")))
        ).map((e) => getAllRules(e)).flat().map((e) => e.selectorText).filter((e) => e).map((e) => e.match(/(([\w-]+?)_([\w-]+)_(([\w\d-]|\\\+)+))/g)).filter((e) => e).flat().map((e) => e.replace(/\\\+/g, "+"))
      )
    ];
    if (window.location.href.startsWith("https://www.ccw.site/gandi/project/")) {
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
    args.filter((arg) => typeof arg === "string").forEach((classNameToFind) => {
      classNameToFind = convertScratchToGandiClassName(classNameToFind);
      if (classNameToFind === "null") return "null";
      res += classNamesArr.find(
        (className) => className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
      ) || "";
      res += " ";
    });
    if (args.length > 0 && typeof args[args.length - 1] === "object") {
      const options = args[args.length - 1];
      const others = Array.isArray(options.others) ? options.others : [options.others];
      others.forEach((string) => res += string + " ");
    }
    res = res.slice(0, -1);
    res = res.replace(/"/g, "");
    return res;
  }
  async function getAddonApi() {
    let reduxState, vm, workspace, api;
    if (window.location.host === "turbowarp.org" || window.__SB2S_DESKTOP_TURBOWARP__) {
      api = {
        Blockly: window.ScratchBlocks,
        reduxState: window.ReduxStore.getState(),
        vm: window.vm,
        workspace: window.ScratchBlocks.getMainWorkspace()
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
      scratchMessage: (m) => m
    };
    function prompt$1(title, message, defaultValue, opts) {
      return prompt(tab, title, message, defaultValue, opts);
    }
    function confirm$1(title, message, opts) {
      return confirm(tab, title, message, opts);
    }
    function createModal(title, { isOpen = false } = {}) {
      return createEditorModal(tab, title, { isOpen });
    }
    tab.prompt = prompt$1;
    tab.confirm = confirm$1;
    tab.createModal = createModal;
    api.tab = tab;
    return api;
  }
  const BOOLEAN = 0;
  const SCRIPT = 1;
  const DROPDOWN = 7;
  const FIELD_DROPDOWN = 8;
  const BACKDROP_OPTIONS = {
    LOOKS_NEXTBACKDROP: "next backdrop",
    LOOKS_PREVIOUSBACKDROP: "previous backdrop",
    LOOKS_RANDOMBACKDROP: "random backdrop"
  };
  const NUMBER_NAME_OPTIONS = {
    LOOKS_NUMBERNAME_NUMBER: "number",
    LOOKS_NUMBERNAME_NAME: "name"
  };
  const KEY_OPTIONS = {
    EVENT_WHENKEYPRESSED_SPACE: "space",
    EVENT_WHENKEYPRESSED_LEFT: "left arrow",
    EVENT_WHENKEYPRESSED_RIGHT: "right arrow",
    EVENT_WHENKEYPRESSED_UP: "up arrow",
    EVENT_WHENKEYPRESSED_DOWN: "down arrow",
    EVENT_WHENKEYPRESSED_ANY: "any"
  };
  const PEN_COLOR_PARAM_OPTIONS = {
    "pen.colorMenu.color": "color",
    "pen.colorMenu.saturation": "saturation",
    "pen.colorMenu.brightness": "brightness",
    "pen.colorMenu.transparency": "transparency"
  };
  const FACE_PART_OPTIONS = {
    "faceSensing.leftEye": "0",
    "faceSensing.rightEye": "1",
    "faceSensing.nose": "2",
    "faceSensing.mouth": "3",
    "faceSensing.leftEar": "4",
    "faceSensing.rightEar": "5",
    "faceSensing.betweenEyes": "6",
    "faceSensing.topOfHead": "7"
  };
  const MICROBIT_BUTTON_OPTIONS = {
    "raw:A": "A",
    "raw:B": "B",
    "microbit.buttonsMenu.any": "any"
  };
  const MICROBIT_TILT_DIRECTION_OPTIONS = {
    "microbit.tiltDirectionMenu.left": "left",
    "microbit.tiltDirectionMenu.right": "right",
    "microbit.tiltDirectionMenu.front": "front",
    "microbit.tiltDirectionMenu.back": "back"
  };
  const MICROBIT_TILT_DIRECTION_ANY_OPTIONS = {
    ...MICROBIT_TILT_DIRECTION_OPTIONS,
    "microbit.tiltDirectionMenu.any": "any"
  };
  const EV3_MOTOR_PORTS_OPTIONS = {
    "raw:A": "0",
    "raw:B": "1",
    "raw:C": "2",
    "raw:D": "3"
  };
  const EV3_SENSOR_PORTS_OPTIONS = {
    "raw:1": "1",
    "raw:2": "2",
    "raw:3": "3",
    "raw:4": "4"
  };
  const WEDO2_MOTOR_ID_OPTIONS = {
    "wedo2.motorId.default": "motor",
    "wedo2.motorId.a": "motor A",
    "wedo2.motorId.b": "motor B",
    "wedo2.motorId.all": "all motors"
  };
  const WEDO2_TILT_DIRECTION_OPTIONS = {
    "wedo2.tiltDirection.up": "up",
    "wedo2.tiltDirection.down": "down",
    "wedo2.tiltDirection.left": "left",
    "wedo2.tiltDirection.right": "right"
  };
  const GDXFORD_AXIS_OPTIONS = {
    "raw:x": "x",
    "raw:y": "y",
    "raw:z": "z"
  };
  const BOOST_MOTOR_ID_OPTIONS = {
    "raw:A": "A",
    "raw:B": "B",
    "raw:C": "C",
    "raw:D": "D",
    "raw:AB": "AB",
    "raw:ABCD": "ABCD"
  };
  const BOOST_TILT_DIRECTION_OPTIONS = {
    "boost.tiltDirection.left": "left",
    "boost.tiltDirection.right": "right",
    "boost.tiltDirection.up": "up",
    "boost.tiltDirection.down": "down"
  };
  const MOTOR_ID_PARAM = {
    name: "MOTOR_ID",
    opcode: "boost_menu_MOTOR_ID",
    type: DROPDOWN,
    options: BOOST_MOTOR_ID_OPTIONS
  };
  const COLOR_PARAM = {
    name: "COLOR",
    opcode: "boost_menu_COLOR",
    type: DROPDOWN,
    options: {
      "boost.color.any": "any",
      "boost.color.red": "red",
      "boost.color.blue": "blue",
      "boost.color.green": "green",
      "boost.color.yellow": "yellow",
      "boost.color.white": "white",
      "boost.color.black": "black"
    }
  };
  const TILT_DIRECTION_ANY_PARAM = {
    name: "TILT_DIRECTION_ANY",
    opcode: "boost_menu_TILT_DIRECTION_ANY",
    type: DROPDOWN,
    options: {
      "boost.tiltDirection.left": "left",
      "boost.tiltDirection.right": "right",
      "boost.tiltDirection.up": "up",
      "boost.tiltDirection.down": "down",
      "boost.tiltDirection.any": "any"
    }
  };
  const TILT_DIRECTION_PARAM = {
    name: "TILT_DIRECTION",
    opcode: "boost_menu_TILT_DIRECTION",
    type: DROPDOWN,
    options: BOOST_TILT_DIRECTION_OPTIONS
  };
  const EV3_MOTOR_PORT_PARAM = {
    name: "PORT",
    internal_field_name: "motorPorts",
    opcode: "ev3_menu_motorPorts",
    type: DROPDOWN,
    options: EV3_MOTOR_PORTS_OPTIONS
  };
  const EV3_SENSOR_PORT_PARAM = {
    name: "PORT",
    internal_field_name: "sensorPorts",
    opcode: "ev3_menu_sensorPorts",
    type: DROPDOWN,
    options: EV3_SENSOR_PORTS_OPTIONS
  };
  const WEDO2_MOTOR_ID_PARAM = {
    name: "MOTOR_ID",
    opcode: "wedo2_menu_MOTOR_ID",
    type: DROPDOWN,
    options: WEDO2_MOTOR_ID_OPTIONS
  };
  const WEDO2_TILT_DIRECTION_PARAM = {
    name: "TILT_DIRECTION",
    opcode: "wedo2_menu_TILT_DIRECTION",
    type: DROPDOWN,
    options: WEDO2_TILT_DIRECTION_OPTIONS
  };
  const GDXFORD_TILT_ANY_PARAM = {
    name: "TILT",
    internal_field_name: "tiltAnyOptions",
    opcode: "gdxfor_menu_tiltAnyOptions",
    type: DROPDOWN,
    options: {
      "gdxfor.tiltDirectionMenu.front": "front",
      "gdxfor.tiltDirectionMenu.back": "back",
      "gdxfor.tiltDirectionMenu.left": "left",
      "gdxfor.tiltDirectionMenu.right": "right",
      "gdxfor.tiltDirectionMenu.any": "any"
    }
  };
  const GDXFORD_AXIS_PARAM = {
    name: "DIRECTION",
    internal_field_name: "axisOptions",
    opcode: "gdxfor_menu_axisOptions",
    type: DROPDOWN,
    options: GDXFORD_AXIS_OPTIONS
  };
  const MICROBIT_BUTTON_PARAM = {
    name: "BTN",
    internal_field_name: "buttons",
    opcode: "microbit_menu_buttons",
    type: DROPDOWN,
    options: MICROBIT_BUTTON_OPTIONS
  };
  const MICROBIT_TILT_DIRECTION_ANY_PARAM = {
    name: "DIRECTION",
    internal_field_name: "tiltDirectionAny",
    opcode: "microbit_menu_tiltDirectionAny",
    type: DROPDOWN,
    options: MICROBIT_TILT_DIRECTION_ANY_OPTIONS
  };
  const FACE_PART_PARAM = {
    name: "PART",
    type: FIELD_DROPDOWN,
    options: FACE_PART_OPTIONS
  };
  const PEN_COLOR_PARAM_PARAM = {
    name: "COLOR_PARAM",
    internal_field_name: "colorParam",
    opcode: "pen_menu_colorParam",
    type: DROPDOWN,
    options: PEN_COLOR_PARAM_OPTIONS
  };
  const NUMBER_NAME_PARAM = {
    name: "NUMBER_NAME",
    type: FIELD_DROPDOWN,
    options: NUMBER_NAME_OPTIONS
  };
  const EFFECT_PARAM = {
    name: "EFFECT",
    type: FIELD_DROPDOWN,
    options: {
      LOOKS_EFFECT_COLOR: "COLOR",
      LOOKS_EFFECT_FISHEYE: "FISHEYE",
      LOOKS_EFFECT_WHIRL: "WHIRL",
      LOOKS_EFFECT_PIXELATE: "PIXELATE",
      LOOKS_EFFECT_MOSAIC: "MOSAIC",
      LOOKS_EFFECT_BRIGHTNESS: "BRIGHTNESS",
      LOOKS_EFFECT_GHOST: "GHOST"
    }
  };
  const blocks_info = {
    motion_movesteps: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "STEPS",
          opcode: "math_number"
        }
      ]
    },
    motion_turnright: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "DEGREES",
          opcode: "math_number"
        }
      ]
    },
    motion_turnleft: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "DEGREES",
          opcode: "math_number"
        }
      ]
    },
    motion_pointindirection: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "DIRECTION",
          opcode: "math_angle"
        }
      ]
    },
    motion_pointtowards: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "TOWARDS",
          opcode: "motion_pointtowards_menu",
          type: DROPDOWN,
          options: {
            MOTION_POINTTOWARDS_POINTER: "_mouse_",
            MOTION_POINTTOWARDS_RANDOM: "_random_"
          },
          dynamicOptions: "sprites"
        }
      ]
    },
    motion_gotoxy: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "X",
          opcode: "math_number"
        },
        {
          name: "Y",
          opcode: "math_number"
        }
      ]
    },
    motion_goto: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "TO",
          opcode: "motion_goto_menu",
          type: DROPDOWN,
          options: {
            MOTION_GOTO_POINTER: "_mouse_",
            MOTION_GOTO_RANDOM: "_random_"
          },
          dynamicOptions: "sprites"
        }
      ]
    },
    motion_glidesecstoxy: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "SECS",
          opcode: "math_positive_number"
        },
        {
          name: "X",
          opcode: "math_number"
        },
        {
          name: "Y",
          opcode: "math_number"
        }
      ]
    },
    motion_glideto: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "TO",
          opcode: "motion_goto_menu",
          type: DROPDOWN,
          options: {
            MOTION_GLIDETO_POINTER: "_mouse_",
            MOTION_GLIDETO_RANDOM: "_random_"
          },
          dynamicOptions: "sprites"
        },
        {
          name: "SECS",
          opcode: "math_positive_number"
        }
      ]
    },
    motion_changexby: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "DX",
          opcode: "math_number"
        }
      ]
    },
    motion_setx: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "X",
          opcode: "math_number"
        }
      ]
    },
    motion_changeyby: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "DY",
          opcode: "math_number"
        }
      ]
    },
    motion_sety: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "Y",
          opcode: "math_number"
        }
      ]
    },
    motion_ifonedgebounce: {
      shape: "stack",
      category: "motion",
      params: []
    },
    motion_setrotationstyle: {
      shape: "stack",
      category: "motion",
      params: [
        {
          name: "STYLE",
          type: FIELD_DROPDOWN,
          options: {
            MOTION_SETROTATIONSTYLE_LEFTRIGHT: "left-right",
            MOTION_SETROTATIONSTYLE_DONTROTATE: "don't rotate",
            MOTION_SETROTATIONSTYLE_ALLAROUND: "all around"
          }
        }
      ]
    },
    motion_xposition: {
      shape: "reporter",
      category: "motion",
      params: []
    },
    motion_yposition: {
      shape: "reporter",
      category: "motion",
      params: []
    },
    motion_direction: {
      shape: "reporter",
      category: "motion",
      params: []
    },
    looks_sayforsecs: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "MESSAGE",
          opcode: "text"
        },
        {
          name: "SECS",
          opcode: "math_number"
        }
      ]
    },
    looks_say: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "MESSAGE",
          opcode: "text"
        }
      ]
    },
    looks_thinkforsecs: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "MESSAGE",
          opcode: "text"
        },
        {
          name: "SECS",
          opcode: "math_number"
        }
      ]
    },
    looks_think: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "MESSAGE",
          opcode: "text"
        }
      ]
    },
    looks_show: {
      shape: "stack",
      category: "looks",
      params: []
    },
    looks_hide: {
      shape: "stack",
      category: "looks",
      params: []
    },
    looks_switchcostumeto: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "COSTUME",
          opcode: "looks_costume",
          type: DROPDOWN,
          dynamicOptions: "costumes"
        }
      ]
    },
    looks_nextcostume: {
      shape: "stack",
      category: "looks",
      params: []
    },
    looks_nextbackdrop_block: {
      shape: "stack",
      category: "looks",
      params: []
    },
    looks_switchbackdropto: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "BACKDROP",
          opcode: "looks_backdrops",
          type: DROPDOWN,
          options: BACKDROP_OPTIONS,
          dynamicOptions: "backdrops"
        }
      ]
    },
    looks_switchbackdroptoandwait: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "BACKDROP",
          opcode: "looks_backdrops",
          type: DROPDOWN,
          options: BACKDROP_OPTIONS,
          dynamicOptions: "backdrops"
        }
      ]
    },
    looks_changeeffectby: {
      shape: "stack",
      category: "looks",
      params: [
        EFFECT_PARAM,
        {
          name: "CHANGE",
          opcode: "math_number"
        }
      ]
    },
    looks_seteffectto: {
      shape: "stack",
      category: "looks",
      params: [
        EFFECT_PARAM,
        {
          name: "VALUE",
          opcode: "math_number"
        }
      ]
    },
    looks_cleargraphiceffects: {
      shape: "stack",
      category: "looks",
      params: []
    },
    looks_changesizeby: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "CHANGE",
          opcode: "math_number"
        }
      ]
    },
    looks_setsizeto: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "SIZE",
          opcode: "math_number"
        }
      ]
    },
    looks_gotofrontback: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "FRONT_BACK",
          type: FIELD_DROPDOWN,
          options: {
            LOOKS_GOTOFRONTBACK_FRONT: "front",
            LOOKS_GOTOFRONTBACK_BACK: "back"
          }
        }
      ]
    },
    looks_goforwardbackwardlayers: {
      shape: "stack",
      category: "looks",
      params: [
        {
          name: "FORWARD_BACKWARD",
          type: FIELD_DROPDOWN,
          options: {
            LOOKS_GOFORWARDBACKWARDLAYERS_FORWARD: "forward",
            LOOKS_GOFORWARDBACKWARDLAYERS_BACKWARD: "backward"
          }
        },
        {
          name: "NUM",
          opcode: "math_integer"
        }
      ]
    },
    looks_costumenumbername: {
      shape: "reporter",
      category: "looks",
      params: [NUMBER_NAME_PARAM]
    },
    looks_backdropnumbername: {
      shape: "reporter",
      category: "looks",
      params: [NUMBER_NAME_PARAM]
    },
    looks_size: {
      shape: "reporter",
      category: "looks",
      params: []
    },
    sound_play: {
      shape: "stack",
      category: "sound",
      params: [
        {
          name: "SOUND_MENU",
          opcode: "sound_sounds_menu",
          type: DROPDOWN,
          dynamicOptions: "sounds"
        }
      ]
    },
    sound_changeeffectby: {
      shape: "stack",
      category: "sound",
      params: [
        {
          name: "EFFECT",
          type: FIELD_DROPDOWN,
          options: {
            SOUND_EFFECTS_PITCH: "PITCH",
            SOUND_EFFECTS_PAN: "PAN"
          }
        },
        {
          name: "VALUE",
          opcode: "math_number"
        }
      ]
    },
    sound_seteffecto: {
      shape: "stack",
      category: "sound",
      params: []
    },
    sound_cleareffects: {
      shape: "stack",
      category: "sound",
      params: []
    },
    sound_playuntildone: {
      shape: "stack",
      category: "sound",
      params: [
        {
          name: "SOUND_MENU",
          opcode: "sound_sounds_menu",
          type: DROPDOWN,
          dynamicOptions: "sounds"
        }
      ]
    },
    sound_stopallsounds: {
      shape: "stack",
      category: "sound",
      params: []
    },
    sound_changevolumeby: {
      shape: "stack",
      category: "sound",
      params: []
    },
    sound_setvolumeto: {
      shape: "stack",
      category: "sound",
      params: [
        {
          name: "VOLUME",
          opcode: "math_number"
        }
      ]
    },
    sound_volume: {
      shape: "reporter",
      category: "sound",
      params: []
    },
    event_whenflagclicked: {
      shape: "hat",
      category: "events",
      params: []
    },
    event_whenkeypressed: {
      shape: "hat",
      category: "events",
      params: [
        {
          name: "KEY_OPTION",
          type: FIELD_DROPDOWN,
          options: KEY_OPTIONS,
          dynamicOptions: "keys"
        }
      ]
    },
    event_whenthisspriteclicked: {
      shape: "hat",
      category: "events",
      params: []
    },
    event_whenstageclicked: {
      shape: "hat",
      category: "events",
      params: []
    },
    event_whenbackdropswitchesto: {
      shape: "hat",
      category: "events",
      params: [
        {
          name: "BACKDROP",
          type: FIELD_DROPDOWN,
          dynamicOptions: "backdrops"
        }
      ]
    },
    event_whengreaterthan: {
      shape: "hat",
      category: "events",
      params: [
        {
          name: "WHENGREATERTHANMENU",
          type: FIELD_DROPDOWN,
          options: {
            EVENT_WHENGREATERTHAN_LOUDNESS: "loudness",
            EVENT_WHENGREATERTHAN_TIMER: "timer"
          }
        },
        {
          name: "VALUE",
          opcode: "math_number"
        }
      ]
    },
    event_whenbroadcastreceived: {
      shape: "hat",
      category: "events",
      params: [
        {
          name: "BROADCAST_OPTION",
          type: FIELD_DROPDOWN,
          dynamicOptions: "messages"
        }
      ]
    },
    event_broadcast: {
      shape: "stack",
      category: "events",
      params: [
        {
          name: "BROADCAST_INPUT",
          internal_field_name: "BROADCAST_OPTION",
          opcode: "event_broadcast_menu",
          type: DROPDOWN,
          dynamicOptions: "messages"
        }
      ]
    },
    event_broadcastandwait: {
      shape: "stack",
      category: "events",
      params: [
        {
          name: "BROADCAST_INPUT",
          internal_field_name: "BROADCAST_OPTION",
          opcode: "event_broadcast_menu",
          type: DROPDOWN,
          dynamicOptions: "messages"
        }
      ]
    },
    control_wait: {
      shape: "stack",
      category: "control",
      params: [
        {
          name: "DURATION",
          opcode: "math_positive_number"
        }
      ]
    },
    control_repeat: {
      shape: "c-block",
      category: "control",
      params: [
        {
          name: "TIMES",
          opcode: "math_whole_number"
        },
        {
          name: "SUBSTACK",
          type: SCRIPT
        }
      ]
    },
    control_forever: {
      shape: "c-block cap",
      category: "control",
      params: [
        {
          name: "SUBSTACK",
          type: SCRIPT
        }
      ]
    },
    control_if: {
      shape: "c-block",
      category: "control",
      params: [
        {
          name: "CONDITION",
          type: BOOLEAN
        },
        {
          name: "SUBSTACK",
          type: SCRIPT
        }
      ]
    },
    control_if_else: {
      shape: "c-block",
      category: "control",
      params: [
        {
          name: "CONDITION",
          type: BOOLEAN
        },
        {
          name: "SUBSTACK",
          type: SCRIPT
        },
        {
          name: "SUBSTACK2",
          type: SCRIPT
        }
      ],
      skipLocaleBuild: true
    },
    control_wait_until: {
      id: "CONTROL_WAITUNTIL",
      shape: "stack",
      category: "control",
      params: [
        {
          name: "CONDITION",
          type: BOOLEAN
        }
      ]
    },
    control_repeat_until: {
      id: "CONTROL_REPEATUNTIL",
      shape: "c-block",
      category: "control",
      params: [
        {
          name: "CONDITION",
          type: BOOLEAN
        },
        {
          name: "SUBSTACK",
          type: SCRIPT
        }
      ]
    },
    control_stop: {
      shape: "cap",
      category: "control",
      params: [
        {
          name: "STOP_OPTION",
          type: FIELD_DROPDOWN,
          options: {
            CONTROL_STOP_ALL: "all",
            CONTROL_STOP_THIS: "this script",
            CONTROL_STOP_OTHER: "other scripts in sprite"
          }
        }
      ]
    },
    control_start_as_clone: {
      id: "CONTROL_STARTASCLONE",
      shape: "hat",
      category: "control",
      params: []
    },
    control_create_clone_of: {
      id: "CONTROL_CREATECLONEOF",
      shape: "stack",
      category: "control",
      params: [
        {
          name: "CLONE_OPTION",
          opcode: "control_create_clone_of_menu",
          type: DROPDOWN,
          options: {
            CONTROL_CREATECLONEOF_MYSELF: "_myself_"
          },
          dynamicOptions: "sprites"
        }
      ]
    },
    control_delete_this_clone: {
      id: "CONTROL_DELETETHISCLONE",
      shape: "cap",
      category: "control",
      params: []
    },
    data_variable: {
      shape: "reporter",
      category: "variables",
      params: [],
      skipLocaleBuild: true
    },
    data_setvariableto: {
      shape: "stack",
      category: "variables",
      params: [
        {
          name: "VARIABLE",
          type: FIELD_DROPDOWN,
          dynamicOptions: "variables"
        },
        {
          name: "VALUE",
          opcode: "text"
        }
      ]
    },
    data_changevariableby: {
      shape: "stack",
      category: "variables",
      params: [
        {
          name: "VARIABLE",
          type: FIELD_DROPDOWN,
          dynamicOptions: "variables"
        },
        {
          name: "VALUE",
          opcode: "math_number"
        }
      ]
    },
    data_showvariable: {
      shape: "stack",
      category: "variables",
      params: [
        {
          name: "VARIABLE",
          type: FIELD_DROPDOWN,
          dynamicOptions: "variables"
        }
      ]
    },
    data_hidevariable: {
      shape: "stack",
      category: "variables",
      params: [
        {
          name: "VARIABLE",
          type: FIELD_DROPDOWN,
          dynamicOptions: "variables"
        }
      ]
    },
    data_listcontents: {
      shape: "reporter",
      category: "list",
      params: [],
      skipLocaleBuild: true
    },
    data_addtolist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        },
        {
          name: "ITEM",
          opcode: "text"
        }
      ]
    },
    data_deleteoflist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        },
        {
          name: "INDEX",
          opcode: "math_integer"
        }
      ]
    },
    data_deletealloflist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_insertatlist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "ITEM",
          opcode: "text"
        },
        {
          name: "INDEX",
          opcode: "math_integer"
        },
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_replaceitemoflist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "INDEX",
          opcode: "math_integer"
        },
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        },
        {
          name: "ITEM",
          opcode: "text"
        }
      ]
    },
    data_showlist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_hidelist: {
      shape: "stack",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_itemoflist: {
      shape: "reporter",
      category: "list",
      params: [
        {
          name: "INDEX",
          opcode: "math_integer"
        },
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_itemnumoflist: {
      shape: "reporter",
      category: "list",
      params: [
        {
          name: "ITEM",
          opcode: "text"
        },
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_lengthoflist: {
      shape: "reporter",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        }
      ]
    },
    data_listcontainsitem: {
      shape: "boolean",
      category: "list",
      params: [
        {
          name: "LIST",
          type: FIELD_DROPDOWN,
          dynamicOptions: "lists"
        },
        {
          name: "ITEM",
          opcode: "text"
        }
      ]
    },
    sensing_touchingobject: {
      shape: "boolean",
      category: "sensing",
      params: [
        {
          name: "TOUCHINGOBJECTMENU",
          opcode: "sensing_touchingobjectmenu",
          type: DROPDOWN,
          options: {
            SENSING_TOUCHINGOBJECT_POINTER: "_mouse_",
            SENSING_TOUCHINGOBJECT_EDGE: "_edge_"
          },
          dynamicOptions: "sprites"
        }
      ]
    },
    sensing_touchingcolor: {
      shape: "boolean",
      category: "sensing",
      params: [
        {
          name: "COLOR",
          opcode: "colour_picker"
        }
      ]
    },
    sensing_coloristouchingcolor: {
      shape: "boolean",
      category: "sensing",
      params: [
        {
          name: "COLOR",
          opcode: "colour_picker"
        },
        {
          name: "COLOR2",
          opcode: "colour_picker"
        }
      ]
    },
    sensing_distanceto: {
      shape: "reporter",
      category: "sensing",
      params: [
        {
          name: "DISTANCETOMENU",
          opcode: "sensing_distancetomenu",
          type: DROPDOWN,
          options: {
            SENSING_DISTANCETO_POINTER: "_mouse_"
          },
          dynamicOptions: "sprites"
        }
      ]
    },
    sensing_answer: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_keypressed: {
      shape: "boolean",
      category: "sensing",
      params: [
        {
          name: "KEY_OPTION",
          opcode: "sensing_keyoptions",
          type: DROPDOWN,
          options: KEY_OPTIONS,
          dynamicOptions: "keys"
        }
      ]
    },
    sensing_mousedown: {
      shape: "boolean",
      category: "sensing",
      params: []
    },
    sensing_mousex: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_mousey: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_setdragmode: {
      shape: "stack",
      category: "sensing",
      params: [
        {
          name: "DRAG_MODE",
          type: FIELD_DROPDOWN,
          options: {
            SENSING_SETDRAGMODE_DRAGGABLE: "draggable",
            SENSING_SETDRAGMODE_NOTDRAGGABLE: "not draggable"
          }
        }
      ]
    },
    sensing_loudness: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_timer: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_resettimer: {
      shape: "stack",
      category: "sensing",
      params: []
    },
    sensing_of: {
      shape: "reporter",
      category: "sensing",
      params: [
        {
          name: "PROPERTY",
          type: FIELD_DROPDOWN,
          options: {
            SENSING_OF_XPOSITION: "x position",
            SENSING_OF_YPOSITION: "y position",
            SENSING_OF_DIRECTION: "direction",
            SENSING_OF_COSTUMENUMBER: "costume #",
            SENSING_OF_COSTUMENAME: "costume name",
            SENSING_OF_SIZE: "size",
            SENSING_OF_VOLUME: "volume",
            SENSING_OF_BACKDROPNUMBER: "backdrop #",
            SENSING_OF_BACKDROPNAME: "backdrop name"
          },
          dynamicOptions: "targetVariables"
        },
        {
          name: "OBJECT",
          opcode: "sensing_of_object_menu",
          type: DROPDOWN,
          options: {
            SENSING_OF_STAGE: "_stage_"
          },
          dynamicOptions: "sprites"
        }
      ]
    },
    sensing_current: {
      shape: "reporter",
      category: "sensing",
      params: [
        {
          name: "CURRENTMENU",
          type: FIELD_DROPDOWN,
          options: {
            SENSING_CURRENT_YEAR: "YEAR",
            SENSING_CURRENT_MONTH: "MONTH",
            SENSING_CURRENT_DATE: "DATE",
            SENSING_CURRENT_DAYOFWEEK: "DAYOFWEEK",
            SENSING_CURRENT_HOUR: "HOUR",
            SENSING_CURRENT_MINUTE: "MINUTE",
            SENSING_CURRENT_SECOND: "SECOND"
          }
        }
      ]
    },
    sensing_dayssince2000: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_online: {
      shape: "boolean",
      category: "sensing",
      params: []
    },
    sensing_username: {
      shape: "reporter",
      category: "sensing",
      params: []
    },
    sensing_askandwait: {
      shape: "stack",
      category: "sensing",
      params: [
        {
          name: "QUESTION",
          opcode: "text"
        }
      ]
    },
    operator_add: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "NUM1",
          opcode: "math_number"
        },
        {
          name: "NUM2",
          opcode: "math_number"
        }
      ]
    },
    operator_subtract: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "NUM1",
          opcode: "math_number"
        },
        {
          name: "NUM2",
          opcode: "math_number"
        }
      ]
    },
    operator_multiply: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "NUM1",
          opcode: "math_number"
        },
        {
          name: "NUM2",
          opcode: "math_number"
        }
      ]
    },
    operator_divide: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "NUM1",
          opcode: "math_number"
        },
        {
          name: "NUM2",
          opcode: "math_number"
        }
      ]
    },
    operator_random: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "FROM",
          opcode: "math_number"
        },
        {
          name: "TO",
          opcode: "math_number"
        }
      ]
    },
    operator_lt: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "OPERAND1",
          opcode: "text"
        },
        {
          name: "OPERAND2",
          opcode: "text"
        }
      ]
    },
    operator_equals: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "OPERAND1",
          opcode: "text"
        },
        {
          name: "OPERAND2",
          opcode: "text"
        }
      ]
    },
    operator_gt: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "OPERAND1",
          opcode: "text"
        },
        {
          name: "OPERAND2",
          opcode: "text"
        }
      ]
    },
    operator_and: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "OPERAND1",
          type: BOOLEAN
        },
        {
          name: "OPERAND2",
          type: BOOLEAN
        }
      ]
    },
    operator_or: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "OPERAND1",
          type: BOOLEAN
        },
        {
          name: "OPERAND2",
          type: BOOLEAN
        }
      ]
    },
    operator_not: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "OPERAND",
          type: BOOLEAN
        }
      ]
    },
    operator_join: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "STRING1",
          opcode: "text"
        },
        {
          name: "STRING2",
          opcode: "text"
        }
      ]
    },
    operator_letterof: {
      shape: "reporter",
      category: "operators",
      params: []
    },
    operator_length: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "STRING",
          opcode: "text"
        }
      ]
    },
    operator_mod: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "NUM1",
          opcode: "math_number"
        },
        {
          name: "NUM2",
          opcode: "math_number"
        }
      ]
    },
    operator_round: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "NUM",
          opcode: "math_number"
        }
      ]
    },
    operator_mathop: {
      shape: "reporter",
      category: "operators",
      params: [
        {
          name: "OPERATOR",
          type: FIELD_DROPDOWN,
          options: {
            OPERATORS_MATHOP_ABS: "abs",
            OPERATORS_MATHOP_FLOOR: "floor",
            OPERATORS_MATHOP_CEILING: "ceiling",
            OPERATORS_MATHOP_SQRT: "sqrt",
            OPERATORS_MATHOP_SIN: "sin",
            OPERATORS_MATHOP_COS: "cos",
            OPERATORS_MATHOP_TAN: "tan",
            OPERATORS_MATHOP_ASIN: "asin",
            OPERATORS_MATHOP_ACOS: "acos",
            OPERATORS_MATHOP_ATAN: "atan",
            OPERATORS_MATHOP_LN: "ln",
            OPERATORS_MATHOP_LOG: "log",
            OPERATORS_MATHOP_EEXP: "e ^",
            OPERATORS_MATHOP_10EXP: "10 ^"
          }
        },
        {
          name: "NUM",
          opcode: "math_number"
        }
      ]
    },
    operator_contains: {
      shape: "boolean",
      category: "operators",
      params: [
        {
          name: "STRING1",
          opcode: "text"
        },
        {
          name: "STRING2",
          opcode: "text"
        }
      ]
    },
    music_getTempo: {
      shape: "reporter",
      category: "music",
      params: []
    },
    music_playDrumForBeats: {
      shape: "stack",
      category: "music",
      params: [
        {
          name: "DRUM",
          opcode: "music_menu_DRUM",
          type: DROPDOWN,
          options: {
            "music.drumSnare": "1",
            "music.drumBass": "2",
            "music.drumSideStick": "3",
            "music.drumCrashCymbal": "4",
            "music.drumOpenHiHat": "5",
            "music.drumClosedHiHat": "6",
            "music.drumTambourine": "7",
            "music.drumHandClap": "8",
            "music.drumClaves": "9",
            "music.drumWoodBlock": "10",
            "music.drumCowbell": "11",
            "music.drumTriangle": "12",
            "music.drumBongo": "13",
            "music.drumConga": "14",
            "music.drumCabasa": "15",
            "music.drumGuiro": "16",
            "music.drumVibraslap": "17",
            "music.drumCuica": "18"
          }
        },
        {
          name: "BEATS",
          opcode: "math_number"
        }
      ]
    },
    music_restForBeats: {
      shape: "stack",
      category: "music",
      params: [
        {
          name: "BEATS",
          opcode: "math_number"
        }
      ]
    },
    music_playNoteForBeats: {
      shape: "stack",
      category: "music",
      params: [
        {
          name: "NOTE",
          opcode: "note"
        },
        {
          name: "BEATS",
          opcode: "math_number"
        }
      ]
    },
    music_setInstrument: {
      shape: "stack",
      category: "music",
      params: [
        {
          name: "INSTRUMENT",
          opcode: "music_menu_INSTRUMENT",
          type: DROPDOWN,
          options: {
            "music.instrumentPiano": "1",
            "music.instrumentElectricPiano": "2",
            "music.instrumentOrgan": "3",
            "music.instrumentGuitar": "4",
            "music.instrumentElectricGuitar": "5",
            "music.instrumentBass": "6",
            "music.instrumentPizzicato": "7",
            "music.instrumentCello": "8",
            "music.instrumentTrombone": "9",
            "music.instrumentClarinet": "10",
            "music.instrumentSaxophone": "11",
            "music.instrumentFlute": "12",
            "music.instrumentWoodenFlute": "13",
            "music.instrumentBassoon": "14",
            "music.instrumentChoir": "15",
            "music.instrumentVibraphone": "16",
            "music.instrumentMusicBox": "17",
            "music.instrumentSteelDrum": "18",
            "music.instrumentMarimba": "19",
            "music.instrumentSynthLead": "20",
            "music.instrumentSynthPad": "21"
          }
        }
      ]
    },
    music_changeTempo: {
      shape: "stack",
      category: "music",
      params: [
        {
          name: "TEMPO",
          opcode: "math_number"
        }
      ]
    },
    music_setTempo: {
      shape: "stack",
      category: "music",
      params: [
        {
          name: "TEMPO",
          opcode: "math_number"
        }
      ]
    },
    pen_clear: {
      shape: "stack",
      category: "pen",
      params: []
    },
    pen_stamp: {
      shape: "stack",
      category: "pen",
      params: []
    },
    pen_penDown: {
      shape: "stack",
      category: "pen",
      params: []
    },
    pen_penUp: {
      shape: "stack",
      category: "pen",
      params: []
    },
    pen_setPenColorToColor: {
      id: "pen.setColor",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "COLOR",
          opcode: "colour_picker"
        }
      ]
    },
    pen_changePenHueBy: {
      id: "pen.changeHue",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "HUE",
          opcode: "math_number"
        }
      ]
    },
    pen_setPenColorParamTo: {
      id: "pen.setColorParam",
      shape: "stack",
      category: "pen",
      params: [
        PEN_COLOR_PARAM_PARAM,
        {
          name: "VALUE",
          opcode: "math_number"
        }
      ]
    },
    pen_changePenColorParamBy: {
      id: "pen.changeColorParam",
      shape: "stack",
      category: "pen",
      params: [
        PEN_COLOR_PARAM_PARAM,
        {
          name: "VALUE",
          opcode: "math_number"
        }
      ]
    },
    pen_setPenHueToNumber: {
      id: "pen.setHue",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "HUE",
          opcode: "math_number"
        }
      ]
    },
    pen_changePenShadeBy: {
      id: "pen.changeShade",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "SHADE",
          opcode: "math_number"
        }
      ]
    },
    pen_setPenShadeToNumber: {
      id: "pen.setShade",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "SHADE",
          opcode: "math_number"
        }
      ]
    },
    pen_changePenSizeBy: {
      id: "pen.changeSize",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "SIZE",
          opcode: "math_number"
        }
      ]
    },
    pen_setPenSizeTo: {
      id: "pen.setSize",
      shape: "stack",
      category: "pen",
      params: [
        {
          name: "SIZE",
          opcode: "math_number"
        }
      ]
    },
    videoSensing_videoToggle: {
      shape: "stack",
      category: "video",
      params: [
        {
          name: "VIDEO_STATE",
          opcode: "videoSensing_menu_VIDEO_STATE",
          type: DROPDOWN,
          options: {
            "videoSensing.on": "on",
            "videoSensing.off": "off",
            "videoSensing.onFlipped": "on-flipped"
          }
        }
      ]
    },
    videoSensing_setVideoTransparency: {
      shape: "stack",
      category: "video",
      params: [
        {
          name: "TRANSPARENCY",
          opcode: "math_number"
        }
      ]
    },
    videoSensing_whenMotionGreaterThan: {
      shape: "hat",
      category: "video",
      params: [
        {
          name: "REFERENCE",
          opcode: "math_number"
        }
      ]
    },
    videoSensing_videoOn: {
      shape: "reporter",
      category: "video",
      params: [
        {
          name: "ATTRIBUTE",
          opcode: "videoSensing_menu_ATTRIBUTE",
          type: DROPDOWN,
          options: {
            "videoSensing.motion": "motion",
            "videoSensing.direction": "direction"
          }
        },
        {
          name: "SUBJECT",
          opcode: "videoSensing_menu_SUBJECT",
          type: DROPDOWN,
          options: {
            "videoSensing.stage": "Stage",
            "videoSensing.sprite": "this sprite"
          }
        }
      ]
    },
    faceSensing_goToPart: {
      shape: "stack",
      category: "faceSensing",
      params: [FACE_PART_PARAM]
    },
    faceSensing_pointInFaceTiltDirection: {
      shape: "stack",
      category: "faceSensing",
      params: []
    },
    faceSensing_setSizeToFaceSize: {
      shape: "stack",
      category: "faceSensing",
      params: []
    },
    faceSensing_whenTilted: {
      shape: "hat",
      category: "faceSensing",
      params: [
        {
          name: "DIRECTION",
          type: FIELD_DROPDOWN,
          options: {
            "faceSensing.left": "left",
            "faceSensing.right": "right"
          }
        }
      ]
    },
    faceSensing_whenSpriteTouchesPart: {
      shape: "hat",
      category: "faceSensing",
      params: [FACE_PART_PARAM]
    },
    faceSensing_whenFaceDetected: {
      shape: "hat",
      category: "faceSensing",
      params: []
    },
    faceSensing_faceIsDetected: {
      id: "faceSensing.faceDetected",
      shape: "boolean",
      category: "faceSensing",
      params: []
    },
    faceSensing_faceTilt: {
      shape: "reporter",
      category: "faceSensing",
      params: []
    },
    faceSensing_faceSize: {
      shape: "reporter",
      category: "faceSensing",
      params: []
    },
    text2speech_speakAndWait: {
      id: "text2speech.speakAndWaitBlock",
      shape: "stack",
      category: "tts",
      params: [
        {
          name: "WORDS",
          opcode: "text"
        }
      ]
    },
    text2speech_setVoice: {
      id: "text2speech.setVoiceBlock",
      shape: "stack",
      category: "tts",
      params: [
        {
          name: "VOICE",
          internal_field_name: "voices",
          opcode: "text2speech_menu_voices",
          type: DROPDOWN,
          options: {
            "text2speech.alto": "ALTO",
            "text2speech.tenor": "TENOR",
            "text2speech.squeak": "SQUEAK",
            "text2speech.giant": "GIANT",
            "text2speech.kitten": "KITTEN"
          }
        }
      ]
    },
    text2speech_setLanguage: {
      id: "text2speech.setLanguageBlock",
      shape: "stack",
      category: "tts",
      params: [
        {
          name: "LANGUAGE",
          internal_field_name: "languages",
          opcode: "text2speech_menu_languages",
          type: DROPDOWN,
          options: {
}
        }
      ]
    },
    translate_getTranslate: {
      id: "translate.translateBlock",
      shape: "reporter",
      category: "translate",
      params: [
        {
          name: "WORDS",
          opcode: "text"
        },
        {
          name: "LANGUAGE",
          internal_field_name: "languages",
          opcode: "translate_menu_languages",
          type: DROPDOWN,
          options: {
}
        }
      ]
    },
    translate_getViewerLanguage: {
      id: "translate.viewerLanguage",
      shape: "reporter",
      category: "translate",
      params: []
    },
    makeymakey_whenMakeyKeyPressed: {
      id: "makeymakey.whenKeyPressed",
      shape: "hat",
      category: "makeymakey",
      params: [
        {
          name: "KEY",
          opcode: "makeymakey_menu_KEY",
          type: DROPDOWN,
          options: {
            EVENT_WHENKEYPRESSED_SPACE: "SPACE",
            EVENT_WHENKEYPRESSED_LEFT: "LEFT",
            EVENT_WHENKEYPRESSED_RIGHT: "RIGHT",
            EVENT_WHENKEYPRESSED_UP: "UP",
            EVENT_WHENKEYPRESSED_DOWN: "DOWN"
          },
          dynamicOptions: "keys"
        }
      ]
    },
    makeymakey_whenCodePressed: {
      id: "makeymakey.whenKeysPressedInOrder",
      shape: "hat",
      category: "makeymakey",
      params: [
        {
          name: "SEQUENCE",
          opcode: "makeymakey_menu_SEQUENCE",
          type: DROPDOWN,
          dynamicOptions: "makeymakeySequences"
        }
      ]
    },
    microbit_whenButtonPressed: {
      shape: "hat",
      category: "microbit",
      params: [MICROBIT_BUTTON_PARAM]
    },
    microbit_isButtonPressed: {
      shape: "boolean",
      category: "microbit",
      params: [MICROBIT_BUTTON_PARAM]
    },
    microbit_whenGesture: {
      shape: "hat",
      category: "microbit",
      params: [
        {
          name: "GESTURE",
          internal_field_name: "gestures",
          opcode: "microbit_menu_gestures",
          type: DROPDOWN,
          options: {
            "microbit.gesturesMenu.moved": "moved",
            "microbit.gesturesMenu.shaken": "shaken",
            "microbit.gesturesMenu.jumped": "jumped"
          }
        }
      ]
    },
    microbit_displaySymbol: {
      shape: "stack",
      category: "microbit",
      params: [
        {
          name: "MATRIX",
          opcode: "matrix",
          type: DROPDOWN
}
      ]
    },
    microbit_displayText: {
      shape: "stack",
      category: "microbit",
      params: [
        {
          name: "TEXT",
          opcode: "text"
        }
      ]
    },
    microbit_displayClear: {
      id: "microbit.clearDisplay",
      shape: "stack",
      category: "microbit",
      params: []
    },
    microbit_whenTilted: {
      shape: "hat",
      category: "microbit",
      params: [MICROBIT_TILT_DIRECTION_ANY_PARAM]
    },
    microbit_isTilted: {
      shape: "boolean",
      category: "microbit",
      params: [MICROBIT_TILT_DIRECTION_ANY_PARAM]
    },
    microbit_getTiltAngle: {
      id: "microbit.tiltAngle",
      shape: "reporter",
      category: "microbit",
      params: [
        {
          name: "DIRECTION",
          internal_field_name: "tiltDirection",
          opcode: "microbit_menu_tiltDirection",
          type: DROPDOWN,
          options: MICROBIT_TILT_DIRECTION_OPTIONS
        }
      ]
    },
    microbit_whenPinConnected: {
      shape: "hat",
      category: "microbit",
      params: [
        {
          name: "PIN",
          internal_field_name: "touchPins",
          opcode: "microbit_menu_touchPins",
          type: DROPDOWN,
          options: {
            "raw:0": "0",
            "raw:1": "1",
            "raw:2": "2"
          }
        }
      ]
    },
    ev3_motorTurnClockwise: {
      shape: "stack",
      category: "ev3",
      params: [
        EV3_MOTOR_PORT_PARAM,
        {
          name: "TIME",
          opcode: "math_number"
        }
      ]
    },
    ev3_motorTurnCounterClockwise: {
      shape: "stack",
      category: "ev3",
      params: [
        EV3_MOTOR_PORT_PARAM,
        {
          name: "TIME",
          opcode: "math_number"
        }
      ]
    },
    ev3_motorSetPower: {
      shape: "stack",
      category: "ev3",
      params: [
        EV3_MOTOR_PORT_PARAM,
        {
          name: "POWER",
          opcode: "math_number"
        }
      ]
    },
    ev3_getMotorPosition: {
      shape: "reporter",
      category: "ev3",
      params: [EV3_MOTOR_PORT_PARAM]
    },
    ev3_whenButtonPressed: {
      shape: "hat",
      category: "ev3",
      params: [EV3_SENSOR_PORT_PARAM]
    },
    ev3_whenDistanceLessThan: {
      shape: "hat",
      category: "ev3",
      params: [
        {
          name: "DISTANCE",
          opcode: "math_number"
        }
      ]
    },
    ev3_whenBrightnessLessThan: {
      shape: "hat",
      category: "ev3",
      params: [
        {
          name: "DISTANCE",
          opcode: "math_number"
        }
      ]
    },
    ev3_buttonPressed: {
      shape: "boolean",
      category: "ev3",
      params: [EV3_SENSOR_PORT_PARAM]
    },
    ev3_getDistance: {
      shape: "reporter",
      category: "ev3",
      params: []
    },
    ev3_getBrightness: {
      shape: "reporter",
      category: "ev3",
      params: []
    },
    ev3_beep: {
      id: "ev3.beepNote",
      shape: "stack",
      category: "ev3",
      params: [
        {
          name: "NOTE",
          opcode: "note"
        },
        {
          name: "TIME",
          opcode: "math_number"
        }
      ]
    },
    wedo2_motorOn: {
      shape: "stack",
      category: "wedo",
      params: [WEDO2_MOTOR_ID_PARAM]
    },
    wedo2_motorOff: {
      shape: "stack",
      category: "wedo",
      params: [WEDO2_MOTOR_ID_PARAM]
    },
    wedo2_startMotorPower: {
      shape: "stack",
      category: "wedo",
      params: [
        WEDO2_MOTOR_ID_PARAM,
        {
          name: "POWER",
          opcode: "math_number"
        }
      ]
    },
    wedo2_setMotorDirection: {
      shape: "stack",
      category: "wedo",
      params: [
        WEDO2_MOTOR_ID_PARAM,
        {
          name: "MOTOR_DIRECTION",
          opcode: "wedo2_menu_MOTOR_DIRECTION",
          type: DROPDOWN,
          options: {
            "wedo2.motorDirection.forward": "this way",
            "wedo2.motorDirection.backward": "that way",
            "wedo2.motorDirection.reverse": "reverse"
          }
        }
      ]
    },
    wedo2_whenDistance: {
      shape: "hat",
      category: "wedo",
      params: [
        {
          name: "OP",
          opcode: "wedo2_menu_OP",
          type: DROPDOWN,
          options: {
            "raw:<": "<",
            "raw:>": ">"
          }
        },
        {
          name: "REFERENCE",
          opcode: "math_number"
        }
      ]
    },
    wedo2_getDistance: {
      shape: "reporter",
      category: "wedo",
      params: []
    },
    wedo2_motorOnFor: {
      shape: "stack",
      category: "wedo",
      params: [
        WEDO2_MOTOR_ID_PARAM,
        {
          name: "DURATION",
          opcode: "math_number"
        }
      ]
    },
    wedo2_setLightHue: {
      shape: "stack",
      category: "wedo",
      params: [
        {
          name: "HUE",
          opcode: "math_number"
        }
      ]
    },
    wedo2_playNoteFor: {
      shape: "stack",
      category: "wedo",
      params: []
    },
    wedo2_whenTilted: {
      shape: "hat",
      category: "wedo",
      params: []
    },
    wedo2_isTilted: {
      shape: "boolean",
      category: "wedo",
      params: [
        {
          name: "TILT_DIRECTION_ANY",
          opcode: "wedo2_menu_TILT_DIRECTION_ANY",
          type: DROPDOWN,
          options: {
            "wedo2.tiltDirection.up": "up",
            "wedo2.tiltDirection.down": "down",
            "wedo2.tiltDirection.left": "left",
            "wedo2.tiltDirection.right": "right",
            "wedo2.tiltDirection.any": "any"
          }
        }
      ]
    },
    wedo2_getTiltAngle: {
      shape: "reporter",
      category: "wedo",
      params: [WEDO2_TILT_DIRECTION_PARAM]
    },
    gdxfor_whenGesture: {
      shape: "hat",
      category: "gdxfor",
      params: [
        {
          name: "GESTURE",
          internal_field_name: "gestureOptions",
          opcode: "gdxfor_menu_gestureOptions",
          type: DROPDOWN,
          options: {
            "gdxfor.shaken": "shaken",
            "gdxfor.startedFalling": "started falling",
            "gdxfor.turnedFaceUp": "turned face up",
            "gdxfor.turnedFaceDown": "turned face down"
          }
        }
      ]
    },
    gdxfor_whenForcePushedOrPulled: {
      shape: "hat",
      category: "gdxfor",
      params: [
        {
          name: "PUSH_PULL",
          internal_field_name: "pushPullOptions",
          opcode: "gdxfor_menu_pushPullOptions",
          type: DROPDOWN,
          options: {
            "gdxfor.pushed": "pushed",
            "gdxfor.pulled": "pulled"
          }
        }
      ]
    },
    gdxfor_getForce: {
      shape: "reporter",
      category: "gdxfor",
      params: []
    },
    gdxfor_whenTilted: {
      shape: "hat",
      category: "gdxfor",
      params: [GDXFORD_TILT_ANY_PARAM]
    },
    gdxfor_isTilted: {
      shape: "boolean",
      category: "gdxfor",
      params: [GDXFORD_TILT_ANY_PARAM]
    },
    gdxfor_getTilt: {
      shape: "reporter",
      category: "gdxfor",
      params: [
        {
          name: "TILT",
          internal_field_name: "tiltOptions",
          opcode: "gdxfor_menu_tiltOptions",
          type: DROPDOWN,
          options: {
            "gdxfor.tiltDirectionMenu.front": "front",
            "gdxfor.tiltDirectionMenu.back": "back",
            "gdxfor.tiltDirectionMenu.left": "left",
            "gdxfor.tiltDirectionMenu.right": "right"
          }
        }
      ]
    },
    gdxfor_isFreeFalling: {
      shape: "boolean",
      category: "gdxfor",
      params: []
    },
    gdxfor_getSpinSpeed: {
      id: "gdxfor.getSpin",
      shape: "reporter",
      category: "gdxfor",
      params: [GDXFORD_AXIS_PARAM]
    },
    gdxfor_getAcceleration: {
      shape: "reporter",
      category: "gdxfor",
      params: [GDXFORD_AXIS_PARAM]
    },
    boost_motorOnFor: {
      shape: "stack",
      category: "boost",
      params: [
        MOTOR_ID_PARAM,
        {
          name: "DURATION",
          opcode: "math_number"
        }
      ]
    },
    boost_motorOnForRotation: {
      shape: "stack",
      category: "boost",
      params: [
        MOTOR_ID_PARAM,
        {
          name: "ROTATION",
          opcode: "math_number"
        }
      ]
    },
    boost_motorOn: {
      shape: "stack",
      category: "boost",
      params: [MOTOR_ID_PARAM]
    },
    boost_motorOff: {
      shape: "stack",
      category: "boost",
      params: [MOTOR_ID_PARAM]
    },
    boost_setMotorPower: {
      shape: "stack",
      category: "boost",
      params: [
        MOTOR_ID_PARAM,
        {
          name: "POWER",
          opcode: "math_number"
        }
      ]
    },
    boost_setMotorDirection: {
      shape: "stack",
      category: "boost",
      params: [
        MOTOR_ID_PARAM,
        {
          name: "MOTOR_DIRECTION",
          opcode: "boost_menu_MOTOR_DIRECTION",
          type: DROPDOWN,
          options: {
            "boost.motorDirection.forward": "this way",
            "boost.motorDirection.backward": "that way",
            "boost.motorDirection.reverse": "reverse"
          }
        }
      ]
    },
    boost_getMotorPosition: {
      shape: "reporter",
      category: "boost",
      params: [
        {
          name: "MOTOR_REPORTER_ID",
          opcode: "boost_menu_MOTOR_REPORTER_ID",
          type: DROPDOWN,
          options: {
            "raw:A": "A",
            "raw:B": "B",
            "raw:C": "C",
            "raw:D": "D"
          }
        }
      ]
    },
    boost_whenColor: {
      shape: "hat",
      category: "boost",
      params: [COLOR_PARAM]
    },
    boost_seeingColor: {
      shape: "boolean",
      category: "boost",
      params: [COLOR_PARAM]
    },
    boost_whenTilted: {
      shape: "hat",
      category: "boost",
      params: [TILT_DIRECTION_ANY_PARAM]
    },
    boost_getTiltAngle: {
      shape: "reporter",
      category: "boost",
      params: [TILT_DIRECTION_PARAM]
    },
    boost_setLightHue: {
      shape: "stack",
      category: "boost",
      params: [
        {
          name: "HUE",
          opcode: "math_number"
        }
      ]
    },
    procedures_definition: {
      shape: "procdef",
      category: "custom",
      params: [
        {
          name: "custom_block",
          opcode: "procedures_prototype"
        }
      ],
      skipLocaleBuild: true
    },
    "scratchblocks:control_else": {
      id: "CONTROL_ELSE",
      shape: "celse",
      category: "control"
    },
    "scratchblocks:end": {
      id: "scratchblocks:end",
      shape: "cend",
      category: "control"
    },
    "scratchblocks:ellipsis": {
      id: "scratchblocks:ellipsis",
      shape: "stack",
      category: "grey"
    }
  };
  const specialOpcodesMap = {};
  for (const [opcode, block] of Object.entries(blocks_info)) {
    if (block.id) {
      specialOpcodesMap[block.id] = opcode;
    }
  }
  const toOpcode = (str) => {
    if (!str) return "";
    if (str.includes(".")) {
      return str.replace(".", "_");
    } else if (specialOpcodesMap[str]) {
      return specialOpcodesMap[str];
    }
    return str.toLowerCase().replace("operators_", "operator_");
  };
  const movedExtensions = {
    pen: "pen",
    video: "sensing",
    music: "sound"
  };
  const extensions = {
    ...movedExtensions,
    faceSensing: "faceSensing",
    tts: "tts",
    translate: "translate",
    microbit: "microbit",
    gdxfor: "gdxfor",
    wedo: "wedo",
    makeymakey: "makeymakey",
    ev3: "ev3",
    boost: "boost"
  };
  const aliasExtensions = {
    wedo2: "wedo",
    text2speech: "tts"
  };
  const extensionList = Object.keys(extensions);
  const overrideCategories = [
    "motion",
    "looks",
    "sound",
    "variables",
    "list",
    "events",
    "control",
    "sensing",
    "operators",
    "custom",
    "custom-arg",
    "extension",
    "grey",
    "obsolete",
    ...Object.keys(extensions),
    ...Object.keys(aliasExtensions)
  ];
  const overrideShapes = ["hat", "cap", "stack", "boolean", "reporter", "ring", "cat"];
  const rtlLanguages = ["ar", "ckb", "fa", "he"];
  const inputPat = /(%[a-zA-Z0-9](?:\.[a-zA-Z0-9]+)?)/;
  const inputPatGlobal = new RegExp(inputPat.source, "g");
  const iconPat = /(@[a-zA-Z]+)/;
  const hexColorPat = /^#(?:[0-9a-fA-F]{3}){1,2}?$/;
  function hashSpec(spec) {
    return minifyHash(spec.replace(inputPatGlobal, " _ "));
  }
  function minifyHash(hash) {
    return hash.replace(/_/g, " _ ").replace(/ +/g, " ").replace(/[,%?:]/g, "").replace(/ß/g, "ss").replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(". . .", "...").replace(/^…$/, "...").trim().toLowerCase();
  }
  const blocksById = {};
  for (const [opcode, def] of Object.entries(blocks_info)) {
    if (def.skipLocaleBuild) {
      continue;
    }
    const id = def.id || (extensionList.includes(def.category) ? opcode.replace("_", ".") : opcode.replace("operator_", "operators_").toUpperCase());
    const info = {
      id,
      shape: def.shape,
      category: def.category
    };
    if (blocksById[info.id]) {
      throw new Error(`Duplicate ID: ${info.id}`);
    }
    blocksById[info.id] = info;
  }
  const unicodeIcons = {
    "@greenFlag": "⚑",
    "@turnRight": "↻",
    "@turnLeft": "↺",
    "@addInput": "▸",
    "@delInput": "◂"
  };
  const allLanguages = {};
  function loadLanguage(code, language) {
    const blocksByHash = language.blocksByHash = {};
    Object.keys(language.commands).forEach((blockId) => {
      const nativeSpec = language.commands[blockId];
      const block = blocksById[blockId];
      const nativeHash = hashSpec(nativeSpec);
      if (!blocksByHash[nativeHash]) {
        blocksByHash[nativeHash] = [];
      }
      blocksByHash[nativeHash].push(block);
      const m = iconPat.exec(nativeSpec);
      if (m) {
        const image = m[0];
        const hash = nativeHash.replace(hashSpec(image), unicodeIcons[image]);
        if (!blocksByHash[hash]) {
          blocksByHash[hash] = [];
        }
        blocksByHash[hash].push(block);
      }
    });
    language.nativeAliases = {};
    Object.keys(language.aliases).forEach((alias) => {
      const blockId = language.aliases[alias];
      const block = blocksById[blockId];
      if (block === void 0) {
        throw new Error(`Invalid alias '${blockId}'`);
      }
      const aliasHash = hashSpec(alias);
      if (!blocksByHash[aliasHash]) {
        blocksByHash[aliasHash] = [];
      }
      blocksByHash[aliasHash].push(block);
      if (!language.nativeAliases[blockId]) {
        language.nativeAliases[blockId] = [];
      }
      language.nativeAliases[blockId].push(alias);
    });
    Object.keys(language.renamedBlocks || {}).forEach((alt) => {
      const id = language.renamedBlocks[alt];
      if (!blocksById[id]) {
        throw new Error(`Unknown ID: ${id}`);
      }
      const block = blocksById[id];
      const hash = hashSpec(alt);
      if (!language.blocksByHash[hash]) {
        language.blocksByHash[hash] = [];
      }
      language.blocksByHash[hash].push(block);
    });
    language.nativeDropdowns = {};
    Object.keys(language.dropdowns).forEach((name) => {
      const nativeName = language.dropdowns[name];
      language.nativeDropdowns[nativeName] = name;
    });
    language.code = code;
    allLanguages[code] = language;
  }
  function loadLanguages(languages) {
    Object.keys(languages).forEach((code) => loadLanguage(code, languages[code]));
  }
  function registerCheck(id, func) {
    if (!blocksById[id]) {
      throw new Error(`Unknown ID: ${id}`);
    }
    blocksById[id].accepts = func;
  }
  function specialCase(id, func) {
    if (!blocksById[id]) {
      throw new Error(`Unknown ID: ${id}`);
    }
    blocksById[id].specialCase = func;
  }
  function disambig(id1, id2, test) {
    registerCheck(id1, (_, children, lang) => {
      return test(children, lang);
    });
    registerCheck(id2, (_, children, lang) => {
      return !test(children, lang);
    });
  }
  disambig("OPERATORS_MATHOP", "SENSING_OF", (children, lang) => {
    const first = children[0];
    if (!first.isInput) {
      return;
    }
    const name = first.value;
    return lang.math.includes(name);
  });
  disambig("SOUND_CHANGEEFFECTBY", "LOOKS_CHANGEEFFECTBY", (children, lang) => {
    for (const child of children) {
      if (child.shape === "dropdown") {
        const name = child.value;
        for (const effect of lang.soundEffects) {
          if (minifyHash(effect) === minifyHash(name)) {
            return true;
          }
        }
      }
    }
    return false;
  });
  disambig("SOUND_SETEFFECTO", "LOOKS_SETEFFECTTO", (children, lang) => {
    for (const child of children) {
      if (child.shape === "dropdown") {
        const name = child.value;
        for (const effect of lang.soundEffects) {
          if (minifyHash(effect) === minifyHash(name)) {
            return true;
          }
        }
      }
    }
    return false;
  });
  disambig("DATA_LENGTHOFLIST", "OPERATORS_LENGTH", (children, _lang) => {
    const last = children[children.length - 1];
    if (!last.isInput) {
      return;
    }
    return last.shape === "dropdown";
  });
  disambig("DATA_LISTCONTAINSITEM", "OPERATORS_CONTAINS", (children, _lang) => {
    const first = children[0];
    if (!first.isInput) {
      return;
    }
    return first.shape === "dropdown";
  });
  disambig("faceSensing.goToPart", "MOTION_GOTO", (children, lang) => {
    for (const child of children) {
      if (child.shape === "dropdown") {
        const name = child.value;
        for (const effect of lang.faceParts) {
          if (minifyHash(effect) === minifyHash(name)) {
            return true;
          }
        }
      }
    }
    return false;
  });
  disambig("microbit.whenGesture", "gdxfor.whenGesture", (children, lang) => {
    for (const child of children) {
      if (child.shape === "dropdown") {
        const name = child.value;
        for (const effect of lang.microbitWhen) {
          if (minifyHash(effect) === minifyHash(name)) {
            return true;
          }
        }
      }
    }
    return false;
  });
  disambig("ev3.buttonPressed", "microbit.isButtonPressed", (children, _lang) => {
    for (const child of children) {
      if (child.shape === "dropdown") {
        switch (minifyHash(child.value)) {
          case "1":
          case "2":
          case "3":
          case "4":
            return true;
        }
      }
    }
    return false;
  });
  specialCase("CONTROL_STOP", (_, children, lang) => {
    const last = children[children.length - 1];
    if (!last.isInput) {
      return;
    }
    const value = last.value;
    if (lang.osis.includes(value)) {
      return { ...blocksById.CONTROL_STOP, shape: "stack" };
    }
  });
  function lookupHash(hash, info, children, languages, categoryOverride = null) {
    for (const lang of languages) {
      if (Object.prototype.hasOwnProperty.call(lang.blocksByHash, hash)) {
        const collisions = lang.blocksByHash[hash];
        for (let block of collisions) {
          if (info.shape === "reporter" && block.shape !== "reporter" && block.shape !== "ring") {
            continue;
          }
          if (info.shape === "boolean" && block.shape !== "boolean") {
            continue;
          }
          if (collisions.length > 1) {
            if (categoryOverride) {
              if (block.category !== categoryOverride) {
                continue;
              }
            } else {
              if (block.accepts && !block.accepts(info, children, lang)) {
                continue;
              }
            }
          }
          if (block.specialCase) {
            block = block.specialCase(info, children, lang) || block;
          }
          return { type: block, lang };
        }
      }
    }
    if (categoryOverride) {
      return lookupHash(hash, info, children, languages, null);
    }
  }
  function applyOverrides(info, overrides) {
    const originalCategory = info.category;
    const originalShape = info.shape;
    for (const name of overrides) {
      if (hexColorPat.test(name)) {
        info.color = name;
        info.category = "";
      } else if (overrideCategories.includes(name)) {
        info.category = name;
      } else if (overrideShapes.includes(name)) {
        info.shape = name;
      } else if (name === "+" || name === "-") {
        info.diff = name;
      } else if (name === "reset") {
        info.categoryIsDefault = false;
        info.isReset = true;
      }
    }
    info.categoryIsDefault = info.category === originalCategory;
    info.shapeIsDefault = info.shape === originalShape;
  }
  function blockName(block) {
    const words = [];
    for (const child of block.children) {
      if (!child.isLabel) {
        return;
      }
      words.push(child.value);
    }
    return words.join(" ");
  }
  function getSortedParameters(children, blockId, language) {
    const params = children.filter((child) => child.isInput || child.isBlock || child.isScript);
    if (params.length === 0 || !language || !language.commands || !language.commands[blockId]) {
      return params;
    }
    const template = language.commands[blockId];
    const matches = template.match(/%(\d+)/g);
    if (!matches) {
      return params;
    }
    const indices = matches.map((placeholder) => parseInt(placeholder.slice(1), 10) - 1);
    const maxIndex = Math.max(...indices);
    const result = new Array(maxIndex + 1);
    indices.forEach((idx, i) => {
      if (i < params.length && idx >= 0 && idx < result.length) {
        result[idx] = params[i];
      }
    });
    result.push(...params.filter((p) => !result.includes(p)));
    return result.filter((p) => p !== void 0);
  }
  function assert$1(bool, message) {
    if (!bool) {
      throw new Error(`Assertion failed! ${message || ""}`);
    }
  }
  class Label {
    constructor(value) {
      this.value = value;
    }
    get isLabel() {
      return true;
    }
  }
  class Icon {
    constructor(name) {
      this.name = name;
      assert$1(Icon.icons[name], `no info for icon ${name}`);
    }
    get isIcon() {
      return true;
    }
    static get icons() {
      return {
        greenFlag: true,
        stopSign: true,
        turnLeft: true,
        turnRight: true,
        loopArrow: true,
        addInput: true,
        delInput: true,
        list: true
      };
    }
  }
  class Input {
    constructor(shape, value, menu) {
      this.shape = shape;
      this.value = value;
      this.menu = menu || null;
      this.isBoolean = shape === "boolean";
      this.isStack = shape === "stack";
      this.isColor = shape === "color";
    }
    get isInput() {
      return true;
    }
  }
  class Block {
    constructor(info, children, comment) {
      assert$1(info);
      this.info = { ...info };
      this.children = children;
      this.comment = comment || null;
      this.diff = null;
      const shape = this.info.shape;
      this.isHat = shape === "hat" || shape === "cat" || shape === "define-hat";
      this.isFinal = /cap/.test(shape);
      this.isCommand = shape === "stack" || shape === "cap" || /block/.test(shape);
      this.isOutline = shape === "outline";
      this.isReporter = shape === "reporter";
      this.isBoolean = shape === "boolean";
      this.isRing = shape === "ring";
      this.hasScript = /block/.test(shape);
      this.isElse = shape === "celse";
      this.isEnd = shape === "cend";
    }
    get isBlock() {
      return true;
    }
    get parameters() {
      return getSortedParameters(this.children, this.info.id, this.info.language);
    }
  }
  class Comment {
    constructor(value, hasBlock) {
      this.label = new Label(value, "comment-label");
      this.hasBlock = hasBlock;
    }
    get isComment() {
      return true;
    }
  }
  class Script {
    constructor(blocks) {
      this.blocks = blocks;
      this.isEmpty = !blocks.length;
      this.isFinal = !this.isEmpty && blocks[blocks.length - 1].isFinal;
    }
    get isScript() {
      return true;
    }
  }
  class Document {
    constructor(scripts) {
      this.scripts = scripts;
    }
  }
  function assert(bool, message) {
    if (!bool) {
      throw new Error(`Assertion failed! ${""}`);
    }
  }
  function paintBlock(info, children, languages) {
    let overrides = [];
    if (Array.isArray(children[children.length - 1])) {
      overrides = children.pop();
    }
    const words = [];
    for (const child of children) {
      if (child.isLabel) {
        words.push(child.value);
      } else if (child.isIcon) {
        words.push(`@${child.name}`);
      } else {
        words.push("_");
      }
    }
    const string = words.join(" ");
    const shortHash = info.hash = minifyHash(string);
    let lang;
    let type;
    if (!overrides.includes("reset")) {
      const categoryOverride = overrides.find((o2) => overrideCategories.includes(o2)) || null;
      const o = lookupHash(shortHash, info, children, languages, categoryOverride);
      if (o) {
        lang = o.lang;
        type = o.type;
        info.language = lang;
        info.isRTL = rtlLanguages.includes(lang.code);
        if (type.shape === "ring" ? info.shape === "reporter" : info.shape === "stack") {
          info.shape = type.shape;
        }
        info.category = type.category;
        info.categoryIsDefault = true;
        if (type.id) {
          info.id = type.id;
          info.opcode = toOpcode(type.id);
        }
        if (type.id === "scratchblocks:ellipsis") {
          children = [new Label(". . .")];
        }
        if (info.opcode && blocks_info[info.opcode]) {
          const blockInfo = blocks_info[info.opcode];
          const params = blockInfo.params || [];
          const sortedParams = getSortedParameters(children, type.id, lang);
          for (let i = 0; i < sortedParams.length && i < params.length; i++) {
            const child = sortedParams[i];
            const param = params[i];
            if (child.isInput && (child.shape === "dropdown" || child.shape === "number-dropdown")) {
              if (param.options && child.menu === null) {
                for (const [optionKey, translatedText] of Object.entries(lang.dropdowns)) {
                  if (translatedText === child.value && param.options[optionKey]) {
                    child.menu = optionKey;
                    break;
                  }
                }
              }
            }
          }
        }
      } else {
        for (const lang2 of languages) {
          if (!isDefineBlock(children, lang2)) {
            continue;
          }
          info.shape = "define-hat";
          info.category = "custom";
          const outlineChildren = children.splice(lang2.definePrefix.length, children.length - lang2.defineSuffix.length).map((child) => {
            if (child.isInput && child.isBoolean) {
              child = paintBlock(
                {
                  shape: "boolean",
                  argument: "boolean",
                  category: "custom-arg",
                  opcode: "argument_reporter_boolean"
                },
                [new Label("")],
                languages
              );
            } else if (child.isInput && (child.shape === "string" || child.shape === "number")) {
              const labels = child.value.split(/ +/g).map((word) => new Label(word));
              child = paintBlock(
                {
                  shape: "reporter",
                  argument: child.shape === "string" ? "string" : "number",
                  category: "custom-arg",
                  opcode: "argument_reporter_string_number"
                },
                labels,
                languages
              );
            } else if (child.isReporter || child.isBoolean) {
              if (child.info.categoryIsDefault) {
                child.info.category = "custom-arg";
              }
              child.info.argument = child.isBoolean ? "boolean" : "number";
              child.info.opcode = child.isBoolean ? "argument_reporter_boolean" : "argument_reporter_string_number";
            }
            return child;
          });
          const outlineInfo = {
            shape: "outline",
            category: "custom",
            categoryIsDefault: true,
            opcode: "procedures_prototype"
          };
          const outline = new Block(outlineInfo, outlineChildren);
          children.splice(lang2.definePrefix.length, 0, outline);
          break;
        }
      }
    }
    applyOverrides(info, overrides);
    const block = new Block(info, children);
    block.diff = info.diff;
    return block;
  }
  function isDefineBlock(children, lang) {
    if (children.length < lang.definePrefix.length) {
      return false;
    }
    if (children.length < lang.defineSuffix.length) {
      return false;
    }
    for (let i = 0; i < lang.definePrefix.length; i++) {
      const defineWord = lang.definePrefix[i];
      const child = children[i];
      if (!child.isLabel || minifyHash(child.value) !== minifyHash(defineWord)) {
        return false;
      }
    }
    for (let i = 1; i <= lang.defineSuffix.length; i++) {
      const defineWord = lang.defineSuffix[lang.defineSuffix.length - i];
      const child = children[children.length - i];
      if (!child.isLabel || minifyHash(child.value) !== minifyHash(defineWord)) {
        return false;
      }
    }
    return true;
  }
  function parseLines(code, languages) {
    let tok = code[0];
    let index = 0;
    function next() {
      tok = code[++index];
    }
    function peek() {
      return code[index + 1];
    }
    function peekNonWs() {
      for (let i = index + 1; i < code.length; i++) {
        if (code[i] !== " ") {
          return code[i];
        }
      }
    }
    let sawNL;
    let define = [];
    languages.forEach((lang) => {
      define = define.concat(lang.define);
    });
    function makeBlock(shape, children) {
      const hasInputs = children.filter((x) => !x.isLabel).length;
      const info = {
        shape,
        category: shape === "reporter" && !hasInputs ? "variables" : "obsolete",
        categoryIsDefault: true
      };
      return paintBlock(info, children, languages);
    }
    function makeMenu(shape, value) {
      return new Input(shape, value, null);
    }
    function pParts(end) {
      const children = [];
      let label;
      while (tok && tok !== "\n") {
        if ((tok === "<" || tok === ">") && end === ">" &&
children.length === 1 &&
!children[children.length - 1].isLabel) {
          const c = peekNonWs();
          if (c === "[" || c === "(" || c === "<" || c === "{") {
            label = null;
            children.push(new Label(tok));
            next();
            continue;
          }
        }
        if (tok === end) {
          break;
        }
        if (tok === "/" && peek() === "/" && !end) {
          break;
        }
        switch (tok) {
          case "[":
            label = null;
            children.push(pString());
            break;
          case "(":
            label = null;
            children.push(pReporter());
            break;
          case "<":
            label = null;
            children.push(pPredicate());
            break;
          case "{":
            label = null;
            children.push(pEmbedded());
            break;
          case " ":
          case "	":
            next();
            label = null;
            break;
          case "◂":
          case "▸":
            children.push(pIcon());
            label = null;
            break;
          case "@": {
            next();
            let name = "";
            while (tok && /[a-zA-Z]/.test(tok)) {
              name += tok;
              next();
            }
            if (name === "cloud") {
              children.push(new Label("☁"));
            } else {
              children.push(
                Object.prototype.hasOwnProperty.call(Icon.icons, name) ? new Icon(name) : new Label(`@${name}`)
              );
            }
            label = null;
            break;
          }
          case "\\":
            next();

case ":":
            if (tok === ":" && peek() === ":") {
              children.push(pOverrides(end));
              return children;
            }
default:
            if (!label) {
              children.push(label = new Label(""));
            }
            label.value += tok;
            next();
        }
      }
      return children;
    }
    function pString() {
      next();
      let s = "";
      let escapeV = false;
      while (tok && tok !== "]" && tok !== "\n") {
        if (tok === "\\") {
          next();
          if (tok === "v") {
            escapeV = true;
          }
          if (!tok) {
            break;
          }
        } else {
          escapeV = false;
        }
        s += tok;
        next();
      }
      if (tok === "]") {
        next();
      }
      if (hexColorPat.test(s)) {
        return new Input("color", s);
      }
      return !escapeV && / v$/.test(s) ? makeMenu("dropdown", s.slice(0, s.length - 2)) : new Input("string", s);
    }
    function pBlock(end) {
      const children = pParts(end);
      if (tok && tok === "\n") {
        sawNL = true;
        next();
      }
      if (children.length === 0) {
        return;
      }
      if (children.length === 1) {
        const child = children[0];
        if (child.isBlock && (child.isReporter || child.isBoolean || child.isRing)) {
          return child;
        }
      }
      return makeBlock("stack", children);
    }
    function pReporter() {
      next();
      if (tok === " ") {
        next();
        if (tok === "v" && peek() === ")") {
          next();
          next();
          return new Input("number-dropdown", "");
        }
      }
      const children = pParts(")");
      if (tok && tok === ")") {
        next();
      }
      if (children.length === 0) {
        return new Input("number", "");
      }
      if (children.length === 1 && children[0].isLabel) {
        const value = children[0].value;
        if (/^[0-9e.-]*$/.test(value)) {
          return new Input("number", value);
        }
        if (hexColorPat.test(value)) {
          return new Input("color", value);
        }
      }
      if (children.length > 1 && children.every((child) => child.isLabel)) {
        const last = children[children.length - 1];
        if (last.value === "v") {
          children.pop();
          const value = children.map((l) => l.value).join(" ");
          return makeMenu("number-dropdown", value);
        }
      }
      const block = makeBlock("reporter", children);
      if (block.info && block.info.shape === "ring") {
        const first = block.children[0];
        if (first && first.isInput && first.shape === "number" && first.value === "") {
          block.children[0] = new Input("reporter");
        } else if (first && first.isScript && first.isEmpty || first && first.isBlock && !first.children.length) {
          block.children[0] = new Input("stack");
        }
      }
      return block;
    }
    function pPredicate() {
      next();
      const children = pParts(">");
      if (tok && tok === ">") {
        next();
      }
      if (children.length === 0) {
        return new Input("boolean");
      }
      return makeBlock("boolean", children);
    }
    function pEmbedded() {
      next();
      sawNL = false;
      const f = function() {
        while (tok && tok !== "}") {
          const block = pBlock("}");
          if (block) {
            return block;
          }
        }
      };
      const scripts = parseScripts(f);
      let blocks = [];
      scripts.forEach((script) => {
        blocks = blocks.concat(script.blocks);
      });
      if (tok === "}") {
        next();
      }
      if (!sawNL) {
        assert(blocks.length <= 1);
        return blocks.length ? blocks[0] : makeBlock("stack", []);
      }
      return new Script(blocks);
    }
    function pIcon() {
      const c = tok;
      next();
      switch (c) {
        case "▸":
          return new Icon("addInput");
        case "◂":
          return new Icon("delInput");
        default:
          return;
      }
    }
    function pOverrides(end) {
      next();
      next();
      const overrides = [];
      let override = "";
      while (tok && tok !== "\n" && tok !== end) {
        if (tok === " ") {
          if (override) {
            overrides.push(override);
            override = "";
          }
        } else if (tok === "/" && peek() === "/") {
          break;
        } else {
          override += tok;
        }
        next();
      }
      if (override) {
        overrides.push(override);
      }
      return overrides;
    }
    function pComment(end) {
      next();
      next();
      let comment = "";
      while (tok && tok !== "\n" && tok !== end) {
        comment += tok;
        next();
      }
      if (tok && tok === "\n") {
        next();
      }
      return new Comment(comment, true);
    }
    function pLine() {
      let diff;
      if (tok === "+" || tok === "-") {
        diff = tok;
        next();
      }
      const block = pBlock();
      if (tok === "/" && peek() === "/") {
        const comment = pComment();
        comment.hasBlock = block && block.children.length;
        if (!comment.hasBlock) {
          return comment;
        }
        block.comment = comment;
      }
      if (block) {
        block.diff = diff;
      }
      return block;
    }
    return () => {
      if (!tok) {
        return void 0;
      }
      const line = pLine();
      return line || "NL";
    };
  }
  function parseScripts(getLine) {
    let line = getLine();
    function next() {
      line = getLine();
    }
    function pFile() {
      while (line === "NL") {
        next();
      }
      const scripts = [];
      while (line) {
        let blocks = [];
        while (line && line !== "NL") {
          let b = pLine();
          const isGlow = b.diff === "+";
          if (isGlow) {
            b.diff = null;
          }
          if (b.isElse || b.isEnd) {
            b = new Block({ ...b.info, shape: "stack" }, b.children);
          }
          if (isGlow) {
            const last = blocks[blocks.length - 1];
            let children = [];
            if (last && last.isGlow) {
              blocks.pop();
              children = last.child.isScript ? last.child.blocks : [last.child];
            }
            children.push(b);
            blocks.push(new Script(children));
          } else if (b.isHat) {
            if (blocks.length) {
              scripts.push(new Script(blocks));
            }
            blocks = [b];
          } else if (b.isFinal) {
            blocks.push(b);
            break;
          } else if (b.isCommand) {
            blocks.push(b);
          } else {
            if (blocks.length) {
              scripts.push(new Script(blocks));
            }
            scripts.push(new Script([b]));
            blocks = [];
            break;
          }
        }
        if (blocks.length) {
          scripts.push(new Script(blocks));
        }
        while (line === "NL") {
          next();
        }
      }
      return scripts;
    }
    function pLine() {
      const b = line;
      next();
      if (b.hasScript) {
        while (true) {
          const blocks = pMouth();
          b.children.push(new Script(blocks));
          if (line && line.isElse) {
            b.info.opcode = "control_if_else";
            for (const child of line.children) {
              b.children.push(child);
            }
            next();
            continue;
          }
          if (line && line.isEnd) {
            next();
          }
          break;
        }
      }
      return b;
    }
    function pMouth() {
      const blocks = [];
      while (line) {
        if (line === "NL") {
          next();
          continue;
        }
        if (!line.isCommand) {
          return blocks;
        }
        const b = pLine();
        const isGlow = b.diff === "+";
        if (isGlow) {
          b.diff = null;
        }
        if (isGlow) {
          const last = blocks[blocks.length - 1];
          let children = [];
          if (last && last.isGlow) {
            blocks.pop();
            children = last.child.isScript ? last.child.blocks : [last.child];
          }
          children.push(b);
          blocks.push(new Script(children));
        } else {
          blocks.push(b);
        }
      }
      return blocks;
    }
    return pFile();
  }
  function eachBlock(x, cb) {
    if (x.isScript) {
      x.blocks = x.blocks.map((block) => {
        eachBlock(block, cb);
        return cb(block) || block;
      });
    } else if (x.isBlock) {
      x.children = x.children.map((child) => {
        eachBlock(child, cb);
        return cb(child) || child;
      });
    } else if (x.isGlow) {
      eachBlock(x.child, cb);
    }
  }
  const listBlocks = {
    data_addtolist: 1,
    data_deleteoflist: 1,
    data_insertatlist: 2,
    data_replaceitemoflist: 1,
    data_showlist: 0,
    data_hidelist: 0
  };
  function recogniseStuff(scripts, workspaceCustomBlocks) {
    const customBlocksByHash = workspaceCustomBlocks || Object.create(null);
    const listNames = new Set();
    scripts.forEach((script) => {
      const customArgs = new Set();
      eachBlock(script, (block) => {
        if (!block.isBlock) {
          return;
        }
        if (block.info.shape === "define-hat") {
          const outline = block.children.find((child) => child.isOutline);
          if (!outline) {
            return;
          }
          const names = [];
          const parts = [];
          for (const child of outline.children) {
            if (child.isLabel) {
              parts.push(child.value);
            } else if (child.isBlock) {
              if (!child.info.argument) {
                return;
              }
              parts.push(
                {
                  number: "%s",
                  string: "%s",
                  boolean: "%b"
                }[child.info.argument]
              );
              const name = blockName(child);
              names.push(name);
              customArgs.add(name);
            }
          }
          const spec = parts.join(" ");
          const hash = hashSpec(spec);
          const info = {
            spec,
            names
          };
          if (!customBlocksByHash[hash]) {
            customBlocksByHash[hash] = info;
          }
          block.info.id = "PROCEDURES_DEFINITION";
          block.info.opcode = "procedures_definition";
          block.info.call = info.spec;
          block.info.names = info.names;
          block.info.category = "custom";
        } else if ((block.info.categoryIsDefault || block.info.category === "custom-arg") && block.isReporter || block.isBoolean) {
          const name = blockName(block);
          if (customArgs.has(name)) {
            block.info.category = "custom-arg";
            block.info.categoryIsDefault = false;
            block.info.opcode = block.isBoolean ? "argument_reporter_boolean" : "argument_reporter_string_number";
          }
        } else if (Object.prototype.hasOwnProperty.call(listBlocks, block.info.opcode)) {
          const argIndex = listBlocks[block.info.opcode];
          const inputs = block.children.filter((child) => !child.isLabel);
          const input = inputs[argIndex];
          if (input && input.isInput) {
            listNames.add(input.value);
          }
        }
      });
    });
    scripts.forEach((script) => {
      eachBlock(script, (block) => {
        if (block.info && (block.info.categoryIsDefault && block.info.category === "obsolete" || block.info.category === "custom")) {
          const info2 = customBlocksByHash[block.info.hash];
          if (info2) {
            block.info.id = "PROCEDURES_CALL";
            block.info.opcode = "procedures_call";
            block.info.call = info2.spec;
            block.info.names = info2.names;
            block.info.category = "custom";
          }
          return;
        }
        let name, info;
        if (block.isReporter && block.info.category === "variables") {
          block.info.opcode = "data_variable";
          name = blockName(block);
          info = block.info;
        } else if (block.isReporter && block.info.category === "list") {
          if (!block.info.opcode) {
            block.info.opcode = "data_listcontents";
          }
          name = blockName(block);
          info = block.info;
        }
        if (!name) {
          return;
        }
        if (listNames.has(name)) {
          info.category = "list";
          info.categoryIsDefault = false;
          info.opcode = "data_listcontents";
        }
        return;
      });
    });
  }
  function parse(code, languages, workspaceCustomBlocks) {
    code = code.replace(/&lt;/g, "<");
    code = code.replace(/&gt;/g, ">");
    languages = languages.map((code2) => {
      const lang = allLanguages[code2];
      if (!lang) {
        throw new Error(`Unknown language: '${code2}'`);
      }
      return lang;
    });
    const f = parseLines(code, languages);
    const scripts = parseScripts(f);
    recogniseStuff(scripts, workspaceCustomBlocks);
    return new Document(scripts);
  }
  await( fetch(
    "https://unpkg.com/scratch-translate-extension-languages@latest/languages.json"
  ).then((r) => r.json().nameMap));
  const ErrorCodes = {
    PROC_PROTOTYPE_NOT_FOUND: "PROC_PROTOTYPE_NOT_FOUND",
    PROC_CALL_UNDEFINED: "PROC_CALL_UNDEFINED",
UNKNOWN_BLOCK: "UNKNOWN_BLOCK",
    BLOCK_NOT_AVAILABLE: "BLOCK_NOT_AVAILABLE",
    SHAPE_OVERRIDE_NOT_ALLOWED: "SHAPE_OVERRIDE_NOT_ALLOWED",
    CATEGORY_OVERRIDE_NOT_ALLOWED: "CATEGORY_OVERRIDE_NOT_ALLOWED",
PARAM_COUNT_MISMATCH: "PARAM_COUNT_MISMATCH",
    TYPE_MISMATCH: "TYPE_MISMATCH",
    FINAL_BLOCK_NOT_END: "FINAL_BLOCK_NOT_END",
MENU_NOT_FOUND: "MENU_NOT_FOUND",
    VALUE_NOT_FOUND: "VALUE_NOT_FOUND",
    NOTE_VALUE_OUT_OF_RANGE: "NOTE_VALUE_OUT_OF_RANGE",
    VARIABLE_NOT_FOUND: "VARIABLE_NOT_FOUND",
    CLONE_OF_MYSELF_INVALID_FOR_STAGE: "CLONE_OF_MYSELF_INVALID_FOR_STAGE",
    SENSING_OF_STAGE_INVALID_PROPERTY: "SENSING_OF_STAGE_INVALID_PROPERTY",
    SENSING_OF_SPRITE_INVALID_PROPERTY: "SENSING_OF_SPRITE_INVALID_PROPERTY"
  };
  class Text2Blocks {
    constructor(target, runtime, genId, workspace) {
      this.target = target;
      this.runtime = runtime;
      this.stage = runtime.getTargetForStage();
      this.genId = genId;
      this.workspace = workspace;
      this.blockJson = [];
      this.variableNames = new Set();
      this.listNames = new Set();
      this.errors = [];
      this.warnings = [];
    }
checkBlockAvailability(opcode) {
      const isStage = this.target.isStage;
      if (isStage && opcode.startsWith("motion_")) {
        return false;
      }
      const spriteOnlyBlocks = new Set([
        "control_deletethisclone",
        "control_startasclone",
        "faceSensing_goToPart",
        "faceSensing_pointInFaceTiltDirection",
        "faceSensing_setSizeToFaceSize",
        "faceSensing_whenSpriteTouchesPart",
        "looks_changesizeby",
        "looks_costumenumbername",
        "looks_goforwardbackwardlayers",
        "looks_gotofrontback",
        "looks_hide",
        "looks_nextcostume",
        "looks_say",
        "looks_sayforsecs",
        "looks_setsizeto",
        "looks_show",
        "looks_size",
        "looks_switchcostumeto",
        "looks_think",
        "looks_thinkforsecs",
        "pen_changePenColorParamBy",
        "pen_changePenSizeBy",
        "pen_penDown",
        "pen_penUp",
        "pen_setPenColorParamTo",
        "pen_setPenColorToColor",
        "pen_setPenSizeTo",
        "pen_stamp",
        "sensing_coloristouchingcolor",
        "sensing_distanceto",
        "sensing_setdragmode",
        "sensing_touchingcolor",
        "sensing_touchingobject"
]);
      const stageOnlyBlocks = new Set([
        "looks_switchbackdroptoandwait"
]);
      if (spriteOnlyBlocks.has(opcode)) {
        return !isStage;
      }
      if (stageOnlyBlocks.has(opcode)) {
        return isStage;
      }
      return true;
    }
    applyVariableMappings(variableMappings) {
      if (!variableMappings || variableMappings.size === 0) {
        return this.blockJson;
      }
      for (const block of this.blockJson) {
        if (block.opcode === "data_variable") {
          const currentVarName = block.fields.VARIABLE?.value;
          if (currentVarName && variableMappings.has(currentVarName)) {
            const varMapping = variableMappings.get(currentVarName);
            block.fields.VARIABLE.value = varMapping.name;
            if (varMapping.id) {
              block.fields.VARIABLE.id = varMapping.id;
            }
          }
          continue;
        }
        if (block.opcode === "data_listcontents") {
          const currentListName = block.fields.LIST?.value;
          if (currentListName && variableMappings.has(currentListName)) {
            const listMapping = variableMappings.get(currentListName);
            block.fields.LIST.value = listMapping.name;
            if (listMapping.id) {
              block.fields.LIST.id = listMapping.id;
            }
          }
          continue;
        }
        for (const [fieldName, field] of Object.entries(block.fields)) {
          if (field.variableType === "list" || field.variableType === "broadcast_msg" || field.variableType === "") {
            const currentName = field.value;
            if (currentName && variableMappings.has(currentName)) {
              const mapping = variableMappings.get(currentName);
              field.value = mapping.name;
              if (mapping.id) {
                field.id = mapping.id;
              }
            }
          }
        }
      }
      return this.blockJson;
    }
    text2blocks(text, languages = []) {
      this.variableNames.clear();
      this.listNames.clear();
      this.errors = [];
      this.warnings = [];
      const self = this;
      const blocks_json = [];
      const blockMap = new Map();
      const procDefinitions = new Map();
      const workspaceCustomBlocks = collectWorkspaceProcedureDefinitions();
      const doc = parse(text, languages, workspaceCustomBlocks);
      console.log("Parsed document:", doc);
      for (const script of doc.scripts) {
        collectProcedureDefinitions(script.blocks);
      }
      for (const script of doc.scripts) {
        processScript(script.blocks, null, true);
      }
      this.blockJson = blocks_json;
      function addBlock(block) {
        blocks_json.push(block);
        blockMap.set(block.id, block);
      }
      function findBlockById(blockId) {
        return blockMap.get(blockId);
      }
      function validateDynamicValue(value, type) {
        const target = self.target;
        const stage = self.stage;
        try {
          switch (type) {
            case "sprites": {
              for (const t of self.runtime.targets || []) {
                if (t.isStage || !t.isOriginal) continue;
                if (t.sprite.name === value) return true;
              }
              return false;
            }
            case "sounds": {
              return target.getSounds().some((s) => s.name === value);
            }
            case "costumes": {
              return target.getCostumes().some((c) => c.name === value);
            }
            case "backdrops": {
              return stage.getCostumes().some((c) => c.name === value);
            }
            case "messages": {
              return Object.values({ ...target.variables, ...stage.variables }).some(
                (variable) => variable.type === "broadcast_msg" && variable.name === value
              );
            }
            case "keys": {
              return value === "enter" || value.length === 1;
            }
case "variables":
            case "lists":
            case "targetVariables":
            default:
              return true;
          }
        } catch (error) {
          console.error(`Error validating dynamic value "${value}" for type "${type}":`, error);
          return true;
        }
      }
      function validateTargetVariable(value, targetName) {
        const stage = self.stage;
        try {
          if (targetName === "_stage_") {
            return Object.values(stage.variables || {}).some(
              (variable) => variable.type === "" && variable.name === value
            );
          }
          if (self.runtime.getSpriteTargetByName(targetName)) {
            return Object.values(self.runtime.getSpriteTargetByName(targetName).variables || {}).some(
              (variable) => variable.type === "" && variable.name === value
            );
          }
          return false;
        } catch (error) {
          console.error(`Error validating target variable "${value}" for target "${targetName}":`, error);
          return true;
        }
      }
      function collectProcedureDefinitions(blocks) {
        for (const block of blocks) {
          if (block.info?.opcode === "procedures_definition") {
            const prototypeBlock = block.parameters?.[0];
            if (prototypeBlock && prototypeBlock.info?.opcode === "procedures_prototype") {
              const proccode_parts = [];
              const argument_ids = [];
              const argument_names = [];
              const argument_defaults = [];
              for (const child of prototypeBlock.children) {
                if (child.isLabel) {
                  proccode_parts.push(child.value.replace("%", "\\%"));
                } else if (child.isBlock) {
                  const argument_id = self.genId();
                  proccode_parts.push(child.isBoolean ? "%b" : "%s");
                  argument_defaults.push(child.isBoolean ? "false" : "");
                  argument_ids.push(argument_id);
                  argument_names.push(blockName(child));
                }
              }
              const proccode = proccode_parts.join(" ");
              if ([
                "__proto__",
                "constructor",
                "hasOwnProperty",
                "isPrototypeOf",
                "propertyIsEnumerable",
                "toLocaleString",
                "toString",
                "valueOf"
              ].includes(proccode)) {
                self.errors.push(`Invalid proccode: "${proccode}"`);
              }
              if (/[\x00-\x1F]/.test(proccode)) {
                self.errors.push(`Invalid proccode (contains control characters): "${proccode}"`);
              }
              if (procDefinitions.has(proccode)) {
                self.warnings.push(`Duplicate procedure definition for proccode: "${proccode}"`);
                continue;
              }
              const prototypeMutation = {
                tagName: "mutation",
                children: [],
                proccode,
                argumentids: JSON.stringify(argument_ids),
                argumentnames: JSON.stringify(argument_names),
                argumentdefaults: JSON.stringify(argument_defaults),
                warp: "false"
              };
              const callMutation = {
                tagName: "mutation",
                children: [],
                proccode,
                argumentids: JSON.stringify(argument_ids),
                warp: "false"
              };
              procDefinitions.set(proccode, {
                argumentids: argument_ids,
                argumentnames: argument_names,
                argumentdefaults: argument_defaults,
                warp: "false",
                prototypeMutation,
                callMutation
              });
            }
          }
        }
      }
      function collectWorkspaceProcedureDefinitions() {
        const customBlocksByHash = {};
        const topBlocks = self.workspace.getTopBlocks();
        for (const block of topBlocks) {
          if (block.type !== "procedures_definition") {
            continue;
          }
          const childBlocks = block.childBlocks || block.getChildren && block.getChildren();
          if (!childBlocks || childBlocks.length === 0) {
            continue;
          }
          const prototypeBlock = childBlocks[0];
          if (prototypeBlock.type !== "procedures_prototype") {
            continue;
          }
          const mutationDom = prototypeBlock.mutationToDom && prototypeBlock.mutationToDom();
          if (!mutationDom) {
            continue;
          }
          const proccode = mutationDom.getAttribute("proccode");
          const argumentnames = JSON.parse(mutationDom.getAttribute("argumentnames") || "[]");
          if (!proccode) {
            continue;
          }
          const hash = hashSpec(proccode);
          if (customBlocksByHash[hash]) {
            continue;
          }
          customBlocksByHash[hash] = {
            spec: proccode,
            names: argumentnames
          };
          const argumentids = JSON.parse(mutationDom.getAttribute("argumentids") || "[]");
          const argumentdefaults = JSON.parse(mutationDom.getAttribute("argumentdefaults") || "[]");
          const warp = mutationDom.getAttribute("warp") || "false";
          const prototypeMutation = {
            tagName: "mutation",
            children: [],
            proccode,
            argumentids: JSON.stringify(argumentids),
            argumentnames: JSON.stringify(argumentnames),
            argumentdefaults: JSON.stringify(argumentdefaults),
            warp
          };
          const callMutation = {
            tagName: "mutation",
            children: [],
            proccode,
            argumentids: JSON.stringify(argumentids),
            warp
          };
          procDefinitions.set(proccode, {
            argumentids,
            argumentnames,
            argumentdefaults,
            warp,
            prototypeMutation,
            callMutation
          });
        }
        return customBlocksByHash;
      }
      function validateParameterType(param, info, parentOpcode) {
        if (parentOpcode === "procedures_call") {
          return true;
        }
        if (info.type === FIELD_DROPDOWN) {
          if (!param.isInput) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: { parentOpcode, inputName: info.name, expected: "value", got: param.shape }
            });
            return false;
          }
        } else if (info.type === DROPDOWN) {
          if (param.isScript) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: { parentOpcode, inputName: info.name, expected: "value", got: "script" }
            });
            return false;
          }
        } else if (info.type === BOOLEAN) {
          if (param.isScript) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: { parentOpcode, inputName: info.name, expected: "boolean block", got: "script" }
            });
            return false;
          }
          if (!param.isBoolean) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: {
                parentOpcode,
                inputName: info.name,
                expected: "boolean block",
                got: param.info?.shape || "unknown"
              }
            });
            return false;
          }
        } else if (info.type === SCRIPT) {
          if (!param.isScript) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: { parentOpcode, inputName: info.name, expected: "script", got: param.info?.shape || "unknown" }
            });
            return false;
          }
        } else {
          if (param.isScript) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: { parentOpcode, inputName: info.name, expected: "reporter block", got: "script" }
            });
            return false;
          }
          if (param.isCommand) {
            self.errors.push({
              code: ErrorCodes.TYPE_MISMATCH,
              params: { parentOpcode, inputName: info.name, expected: "reporter block", got: "command block" }
            });
            return false;
          }
        }
        return true;
      }
      function processParameter(param, info, parentBlockId, parentOpcode) {
        if (!validateParameterType(param, info, parentOpcode)) {
          return null;
        }
        let shadow_block_id = null;
        let input_block_id = null;
        let variableType = null;
        if (param.isBlock) {
          const nestedBlockId = processBlock(param, parentBlockId, false);
          input_block_id = nestedBlockId;
        } else if (param.isScript) {
          const nestedScriptId = processScript(param.blocks, parentBlockId, false);
          input_block_id = nestedScriptId;
        }
        if (info.type === FIELD_DROPDOWN) {
          let value = param.value;
          if (param.menu) {
            const staticValue = info.options?.[param.menu];
            if (staticValue !== void 0) {
              value = staticValue;
            } else if (!info.dynamicOptions) {
              self.warnings.push({
                code: ErrorCodes.MENU_NOT_FOUND,
                params: { menu: param.menu, parentOpcode, inputName: info.name }
              });
            }
          } else if (info.dynamicOptions) {
            if (!validateDynamicValue(param.value, info.dynamicOptions)) {
              self.warnings.push({
                code: ErrorCodes.VALUE_NOT_FOUND,
                params: { value: param.value, expectedType: info.dynamicOptions, parentOpcode, inputName: info.name }
              });
            }
            value = param.value;
            if (info.dynamicOptions === "variables") {
              variableType = "";
            } else if (info.dynamicOptions === "lists") {
              variableType = "list";
            } else if (info.dynamicOptions === "messages") {
              variableType = "broadcast_msg";
            }
          }
          return {
            type: "field",
            fieldName: info.name,
            value,
            variableType
          };
        } else if (info.type === DROPDOWN) {
          const input_id = self.genId();
          shadow_block_id = input_id;
          let value = param.value;
          if (param.isBlock) {
            value = Object.values(info.options || {})[0] || "";
            if (info.opcode === "control_create_clone_of_menu" && self.target.isStage) {
              value = self.runtime.targets.find((t) => !t.isStage)?.getName() || "";
            }
          } else {
            if (param.menu) {
              const staticValue = info.options?.[param.menu];
              if (staticValue !== void 0) {
                value = staticValue;
              } else if (!info.dynamicOptions) {
                self.warnings.push({
                  code: ErrorCodes.MENU_NOT_FOUND,
                  params: { menu: param.menu, parentOpcode, inputName: info.name }
                });
              }
            } else if (info.dynamicOptions) {
              if (!validateDynamicValue(param.value, info.dynamicOptions)) {
                self.warnings.push({
                  code: ErrorCodes.VALUE_NOT_FOUND,
                  params: { value: param.value, expectedType: info.dynamicOptions, parentOpcode, inputName: info.name }
                });
              }
              value = param.value;
              if (info.dynamicOptions === "messages") {
                variableType = "broadcast_msg";
              }
            }
          }
          addBlock({
            id: input_id,
            opcode: info.opcode,
            fields: {
              [info.internal_field_name || info.name]: {
                name: info.internal_field_name || info.name,
                value,
                variableType
              }
            },
            inputs: {},
            parent: parentBlockId,
            next: null,
            shadow: true,
            topLevel: false
          });
        } else if (info.opcode === "procedures_prototype") ;
        else if (info.type !== BOOLEAN && info.type !== SCRIPT) {
          const input_id = self.genId();
          shadow_block_id = input_id;
          const field_name = info.opcode === "text" ? "TEXT" : info.opcode === "colour_picker" ? "COLOUR" : info.opcode === "note" ? "NOTE" : "NUM";
          let value;
          if (param.isBlock) {
            value = info.opcode === "text" ? "" : info.opcode === "colour_picker" ? "#000000" : 0;
          } else {
            value = param.value;
            if (info.opcode === "note" && (value < 0 || value > 130)) {
              self.warnings.push({
                code: ErrorCodes.NOTE_VALUE_OUT_OF_RANGE,
                params: { value, min: 0, max: 130, parentOpcode, inputName: info.name }
              });
            } else if (info.opcode === "colour_picker") {
              if (param.isColor) {
                if (value.length === 4) {
                  value = "#" + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
                }
              } else {
                self.errors.push({
                  code: ErrorCodes.TYPE_MISMATCH,
                  params: { parentOpcode, inputName: info.name, expected: "color value", got: param.shape }
                });
              }
            }
          }
          addBlock({
            id: input_id,
            opcode: info.opcode,
            fields: {
              [field_name]: {
                name: field_name,
                value
              }
            },
            inputs: {},
            parent: parentBlockId,
            next: null,
            shadow: true,
            topLevel: false
          });
        }
        return {
          type: "input",
          inputName: info.name,
          block: input_block_id || shadow_block_id,
          shadow: shadow_block_id
        };
      }
      function processBlock(block, parentBlockId = null, isTopLevel = false) {
        if (block.isComment) {
          return null;
        }
        if (block.info.shapeIsDefault === false) {
          self.errors.push({ code: ErrorCodes.SHAPE_OVERRIDE_NOT_ALLOWED, params: { hash: block.info.hash } });
          return null;
        }
        if (block.info.categoryIsDefault === false && block.info.category !== "variables" && block.info.category !== "list" && block.info.category !== "custom-arg" && block.info.category !== "custom") {
          self.errors.push({ code: ErrorCodes.CATEGORY_OVERRIDE_NOT_ALLOWED, params: { hash: block.info.hash } });
          return null;
        }
        const opcode = block.info?.opcode;
        if (!opcode) {
          self.errors.push({ code: ErrorCodes.UNKNOWN_BLOCK, params: { hash: block.info.hash } });
          return null;
        }
        if (!self.checkBlockAvailability(opcode)) {
          const targetType = self.target.isStage ? "stage" : "sprite";
          self.errors.push({ code: ErrorCodes.BLOCK_NOT_AVAILABLE, params: { opcode, targetType } });
          return null;
        }
        const block_id = self.genId();
        const block_json = {
          id: block_id,
          opcode,
          fields: {},
          inputs: {},
          parent: parentBlockId,
          next: null,
          shadow: opcode === "procedures_prototype" ? true : false,
          topLevel: isTopLevel
        };
        if (opcode === "procedures_prototype") {
          const proccode_parts = [];
          for (const child of block.children) {
            if (child.isLabel) {
              proccode_parts.push(child.value.replace("%", "\\%"));
            } else if (child.isBlock) {
              proccode_parts.push(child.isBoolean ? "%b" : "%s");
            }
          }
          const proccode = proccode_parts.join(" ");
          const procDef = procDefinitions.get(proccode);
          if (procDef) {
            block_json.mutation = procDef.prototypeMutation;
            let argIndex = 0;
            for (const child of block.children) {
              if (child.isBlock) {
                const param_id = processBlock(child, block_id, false);
                const argId = procDef.argumentids[argIndex];
                block_json.inputs[argId] = {
                  block: param_id,
                  shadow: param_id,
                  name: argId
                };
                argIndex++;
              }
            }
          } else {
            self.errors.push({ code: ErrorCodes.PROC_PROTOTYPE_NOT_FOUND, params: { proccode } });
          }
        } else if (opcode === "argument_reporter_string_number" || opcode === "argument_reporter_boolean") {
          const parentBlock = findBlockById(parentBlockId);
          block_json.shadow = parentBlock && parentBlock.opcode === "procedures_prototype";
          block_json.fields["VALUE"] = {
            name: "VALUE",
            value: blockName(block)
          };
        } else if (opcode === "procedures_call") {
          const proccode = block.info.call;
          const procDef = procDefinitions.get(proccode);
          if (!procDef) {
            self.errors.push({ code: ErrorCodes.PROC_CALL_UNDEFINED, params: { proccode } });
            return null;
          }
          if (procDef.argumentids.length !== block.parameters.length) {
            self.errors.push({
              code: ErrorCodes.PARAM_COUNT_MISMATCH,
              params: { proccode, expected: procDef.argumentids.length, got: block.parameters.length }
            });
            return null;
          }
          block_json.mutation = procDef.callMutation;
          for (let i = 0; i < procDef.argumentids.length; i++) {
            const param = block.parameters[i];
            const argId = procDef.argumentids[i];
            const argName = procDef.argumentnames[i];
            const isBoolean = procDef.argumentdefaults[i] === "false";
            const paramInfo = {
              name: argName,
              type: isBoolean ? BOOLEAN : null,
              opcode: isBoolean ? null : "text"
            };
            const result = processParameter(param, paramInfo, block_id, opcode);
            block_json.inputs[argId] = {
              block: result.block,
              shadow: result.shadow,
              name: argId
            };
          }
        } else {
          const params_info = blocks_info[opcode]?.params || [];
          if (params_info.length !== block.parameters.length) {
            self.errors.push({
              code: ErrorCodes.PARAM_COUNT_MISMATCH,
              params: { opcode, expected: params_info.length, got: block.parameters.length }
            });
            return null;
          }
          let param_index = 0;
          for (const param_info of params_info) {
            const param = block.parameters[param_index];
            const result = processParameter(param, param_info, block_id, opcode);
            if (result === null) {
              return null;
            }
            if (result.type === "field") {
              block_json.fields[result.fieldName] = {
                name: result.fieldName,
                value: result.value,
                variableType: result.variableType
              };
            } else if (result.type === "input") {
              block_json.inputs[result.inputName] = {
                block: result.block,
                shadow: result.shadow,
                name: result.inputName
              };
            }
            param_index++;
          }
        }
        if (opcode === "control_create_clone_of") {
          const isStage = self.target.isStage || false;
          const cloneOption = block_json.inputs["CLONE_OPTION"]?.shadow;
          if (isStage && cloneOption) {
            const shadowBlock = findBlockById(cloneOption);
            if (shadowBlock?.fields?.CLONE_OPTION?.value === "_myself_") {
              self.warnings.push({ code: ErrorCodes.CLONE_OF_MYSELF_INVALID_FOR_STAGE, params: {} });
            }
          }
        }
        if (opcode === "sensing_of") {
          const propertyValue = block_json.fields["PROPERTY"]?.value;
          const objectInput = block_json.inputs["OBJECT"]?.shadow;
          if (propertyValue && objectInput) {
            const objectBlock = findBlockById(objectInput);
            const objectValue = objectBlock?.fields?.OBJECT?.value;
            if (objectValue === "_stage_") {
              const allowedForStage = ["backdrop #", "backdrop name", "volume"];
              if (!allowedForStage.includes(propertyValue)) {
                if (!validateTargetVariable(propertyValue, "_stage_")) {
                  self.warnings.push({
                    code: ErrorCodes.SENSING_OF_STAGE_INVALID_PROPERTY,
                    params: { property: propertyValue, allowed: allowedForStage.join(", ") }
                  });
                }
              }
            } else {
              const disallowedForSprite = ["backdrop #", "backdrop name"];
              if (disallowedForSprite.includes(propertyValue)) {
                self.warnings.push({
                  code: ErrorCodes.SENSING_OF_SPRITE_INVALID_PROPERTY,
                  params: { property: propertyValue, objectValue }
                });
              } else if (objectValue) {
                if (!validateTargetVariable(propertyValue, objectValue)) {
                  self.warnings.push({
                    code: ErrorCodes.VARIABLE_NOT_FOUND,
                    params: { variable: propertyValue, targetSprite: objectValue }
                  });
                }
              }
            }
          }
        }
        if (opcode === "data_variable") {
          const varName = blockName(block);
          self.variableNames.add(varName);
          block_json.fields["VARIABLE"] = {
            name: "VARIABLE",
            value: varName,
            variableType: ""
          };
        } else if (opcode === "data_listcontents") {
          const listName = blockName(block);
          self.listNames.add(listName);
          block_json.fields["LIST"] = {
            name: "LIST",
            value: listName,
            variableType: "list"
          };
        }
        addBlock(block_json);
        return block_id;
      }
      function processScript(blocksList, parentBlockId = null, isTopLevel = true) {
        let firstBlockId = null;
        let previousBlockId = null;
        for (let i = 0; i < blocksList.length; i++) {
          const block = blocksList[i];
          if (block.isComment) {
            continue;
          }
          const blockId = processBlock(block, parentBlockId, isTopLevel && i === 0);
          if (!blockId) {
            continue;
          }
          if (!firstBlockId) {
            firstBlockId = blockId;
          }
          if (previousBlockId) {
            const prevBlock = findBlockById(previousBlockId);
            if (prevBlock) {
              prevBlock.next = blockId;
            }
          }
          if (i < blocksList.length - 1) {
            if (block.isFinal) {
              self.errors.push({
                code: ErrorCodes.FINAL_BLOCK_NOT_END,
                params: { opcode: block.info?.opcode }
              });
            }
          }
          if (previousBlockId && !isTopLevel) {
            const currentBlock = findBlockById(blockId);
            if (currentBlock) {
              currentBlock.parent = previousBlockId;
            }
          }
          previousBlockId = blockId;
        }
        return firstBlockId;
      }
    }
  }
  const extraAliases = {
    en: {
"turn ccw %1 degrees": "MOTION_TURNLEFT",
      "turn left %1 degrees": "MOTION_TURNLEFT",
      "turn cw %1 degrees": "MOTION_TURNRIGHT",
      "turn right %1 degrees": "MOTION_TURNRIGHT",
      "when flag clicked": "EVENT_WHENFLAGCLICKED",
      "when gf clicked": "EVENT_WHENFLAGCLICKED",
      "when green flag clicked": "EVENT_WHENFLAGCLICKED"
    },
    de: {
"drehe dich nach links um %1 Grad": "MOTION_TURNLEFT",
      "drehe dich nach rechts um %1 Grad": "MOTION_TURNRIGHT",
      "Wenn die grüne Flagge angeklickt": "EVENT_WHENFLAGCLICKED",
      Ende: "scratchblocks:end"
    },
    pt: {
"gira para a esquerda %1 º": "MOTION_TURNLEFT",
      "gira para a direita %1 º": "MOTION_TURNRIGHT",
      "Quando alguém clicar na bandeira verde": "EVENT_WHENFLAGCLICKED",
      fim: "scratchblocks:end"
    },
    it: {
"ruota in senso antiorario di %1 gradi": "MOTION_TURNLEFT",
      "ruota in senso orario di %1 gradi": "MOTION_TURNRIGHT",
      "quando si clicca sulla bandiera verde": "EVENT_WHENFLAGCLICKED",
      fine: "scratchblocks:end"
    },
    fr: {
"tourner gauche de %1 degrés": "MOTION_TURNLEFT",
      "tourner droite de %1 degrés": "MOTION_TURNRIGHT",
      "quand le drapeau vert pressé": "EVENT_WHENFLAGCLICKED",
      fin: "scratchblocks:end"
    },
    gd: {
"cuairtich @turnLeft le %1 ceum": "MOTION_TURNLEFT",
      "cuairtich @turnRight le %1 ceum": "MOTION_TURNRIGHT",
      "le briogadh air @greenFlag": "EVENT_WHENFLAGCLICKED",
      deireadh: "scratchblocks:end"
    },
    es: {
"girar a la izquierda %1 grados": "MOTION_TURNLEFT",
      "girar a la derecha %1 grados": "MOTION_TURNRIGHT",
      "al presionar bandera verde": "EVENT_WHENFLAGCLICKED",
      fin: "scratchblocks:end"
    },
    nl: {
"draai %1 graden naar links": "MOTION_TURNLEFT",
      "draai %1 graden naar rechts": "MOTION_TURNRIGHT",
      "wanneer groene vlag wordt aangeklikt": "EVENT_WHENFLAGCLICKED",
      einde: "scratchblocks:end"
    },
    "zh-cn": {
"左转 %1 度": "MOTION_TURNLEFT",
      "右转 %1 度": "MOTION_TURNRIGHT",
      当绿旗被点击: "EVENT_WHENFLAGCLICKED",
      点击绿旗时: "EVENT_WHENFLAGCLICKED",
      结束: "scratchblocks:end"
    },
    "zh-tw": {
"左轉 %1 度": "MOTION_TURNLEFT",
      "右轉 %1 度": "MOTION_TURNRIGHT",
      當綠旗被點擊: "EVENT_WHENFLAGCLICKED",
      當綠旗被點擊時: "EVENT_WHENFLAGCLICKED",
      結束: "scratchblocks:end"
    },
    he: {
"הסתובב שמאל %1 מעלות": "MOTION_TURNLEFT",
      "הסתובב ימינה %1 מעלות": "MOTION_TURNRIGHT",
      "כאשר לוחצים על דגל ירוק": "EVENT_WHENFLAGCLICKED",
      סוף: "scratchblocks:end"
    },
    pl: {
"obróć w lewo o %1 stopni": "MOTION_TURNLEFT",
      "obróć w prawo o %1 stopni": "MOTION_TURNRIGHT",
      "kiedy kliknięto zieloną flagę": "EVENT_WHENFLAGCLICKED",
      koniec: "scratchblocks:end"
    },
    nb: {
"vend venstre %1 grader": "MOTION_TURNLEFT",
      "vend høyre %1 grader": "MOTION_TURNRIGHT",
      "når grønt flagg klikkes": "EVENT_WHENFLAGCLICKED",
      slutt: "scratchblocks:end"
    },
    ru: {
"повернуть влево на %1 градусов": "MOTION_TURNLEFT",
      "повернуть вправо на %1 градусов": "MOTION_TURNRIGHT",
      "когда щёлкнут по зелёному флагу": "EVENT_WHENFLAGCLICKED",
      конец: "scratchblocks:end"
    },
    ca: {
"gira a l'esquerra %1 graus": "MOTION_TURNLEFT",
      "gira a la dreta %1 graus": "MOTION_TURNRIGHT",
      "quan la bandera verda es cliqui": "EVENT_WHENFLAGCLICKED",
      "quan la bandera verda es premi": "EVENT_WHENFLAGCLICKED",
      fi: "scratchblocks:end"
    },
    tr: {
"%1 derece sola dön": "MOTION_TURNLEFT",
      "%1 derece sağa dön": "MOTION_TURNRIGHT",
      "%1 derece saatin tersi yönde dön": "MOTION_TURNLEFT",
      "%1 derece saat yönünde dön": "MOTION_TURNRIGHT",
      "yeşil bayrak tıklandığında": "EVENT_WHENFLAGCLICKED",
      son: "scratchblocks:end"
    },
    el: {
"στρίψε αριστερά %1 μοίρες": "MOTION_TURNLEFT",
      "στρίψε αριστερόστροφα %1 μοίρες": "MOTION_TURNLEFT",
      "στρίψε δεξιά %1 μοίρες": "MOTION_TURNRIGHT",
      "στρίψε δεξιόστροφα %1 μοίρες": "MOTION_TURNRIGHT",
      "Όταν στην πράσινη σημαία γίνει κλικ": "EVENT_WHENFLAGCLICKED",
      τέλος: "scratchblocks:end"
    },
    cy: {
"troi %1 gradd i'r chwith": "MOTION_TURNLEFT",
      "troi %1 gradd i'r dde": "MOTION_TURNRIGHT",
      "pan fo'r flag werdd yn cael ei glicio": "EVENT_WHENFLAGCLICKED",
      diwedd: "scratchblocks:end"
    },
    hi: {
"%1 डिग्री से बाएं घूम जाए": "MOTION_TURNLEFT",
      "%1 डिग्री से दाएं घूम जाए": "MOTION_TURNRIGHT",
      "जब झंडे को क्लिक किया गया हो": "EVENT_WHENFLAGCLICKED",
      अंत: "scratchblocks:end"
    },
    hu: {
"fordulj balra %1 fokot": "MOTION_TURNLEFT",
      "fordulj jobbra %1 fokot": "MOTION_TURNRIGHT",
      "zászlóra kattintáskor": "EVENT_WHENFLAGCLICKED",
      "a zászlóra kattintáskor": "EVENT_WHENFLAGCLICKED",
      vége: "scratchblocks:end"
    },
    ro: {
"rotește la stânga %1 grade": "MOTION_TURNLEFT",
      "rotește la dreapta %1 grade": "MOTION_TURNRIGHT",
      "când se face click pe stegulețul verde": "EVENT_WHENFLAGCLICKED",
      terminare: "scratchblocks:end"
    },
    id: {
"putar ke kiri %1 derajat": "MOTION_TURNLEFT",
      "putar ke kanan %1 derajat": "MOTION_TURNRIGHT",
      "ketika bendera hijau diklik": "EVENT_WHENFLAGCLICKED",
      selesai: "scratchblocks:end"
    },
    hr: {
"skreni lijevo %1 stupnjeva": "MOTION_TURNLEFT",
      "skreni desno %1 stupnjeva": "MOTION_TURNRIGHT",
      "kada je zelena zastava kliknut": "EVENT_WHENFLAGCLICKED",
      kraj: "scratchblocks:end"
    },
    cs: {
"otoč se o %1 stupňů doleva": "MOTION_TURNLEFT",
      "otoč se o %1 stupňů doprava": "MOTION_TURNRIGHT",
      "po kliknutí na zelenou vlajku": "EVENT_WHENFLAGCLICKED",
      konec: "scratchblocks:end"
    },
    sl: {
"obrni se za %1 stopinj v levo": "MOTION_TURNLEFT",
      "obrni se za %1 stopinj v desno": "MOTION_TURNRIGHT",
      "ko je kliknjena zelena zastavica": "EVENT_WHENFLAGCLICKED",
      ustavi: "scratchblocks:end"
    },
    fa: {
"به اندازه %1 درجه به چپ بچرخ": "MOTION_TURNLEFT",
      "به اندازه %1 درجه به راست بچرخ": "MOTION_TURNRIGHT",
      "وقتی که پرچم کلیک شد": "EVENT_WHENFLAGCLICKED",
      آخر: "scratchblocks:end"
    },
    ja: {
"左に %1 度回す": "MOTION_TURNLEFT",
      "反時計回りに %1 度回す": "MOTION_TURNLEFT",
      "右に %1 度回す": "MOTION_TURNRIGHT",
      "時計回りに %1 度回す": "MOTION_TURNRIGHT",
      緑の旗が押されたとき: "EVENT_WHENFLAGCLICKED",
      緑の旗がクリックされたとき: "EVENT_WHENFLAGCLICKED"
    },
    "ja-Hira": {
"ひだりに %1 どまわす": "MOTION_TURNLEFT",
      "はんとけいまわりに %1 どまわす": "MOTION_TURNLEFT",
      "みぎに %1 どまわす": "MOTION_TURNRIGHT",
      "とけいまわりに %1 どまわす": "MOTION_TURNRIGHT",
      みどりのはたがおされたとき: "EVENT_WHENFLAGCLICKED",
      みどりのはたがクリックされたとき: "EVENT_WHENFLAGCLICKED"
    }
  };
  const soundEffects = ["SOUND_EFFECTS_PITCH", "SOUND_EFFECTS_PAN"];
  const microbitWhen = ["microbit.gesturesMenu.moved", "microbit.gesturesMenu.shaken", "microbit.gesturesMenu.jumped"];
  const osis = ["CONTROL_STOP_OTHER"];
  const translateKey = (raw, key) => {
    const result = raw.mappings[key] || raw.extensionMappings[key];
    if (!result) {
      return;
    }
    return fixup(key, result);
  };
  const lookupEachIn = (raw) => (items) => {
    const output = [];
    for (const key of items) {
      const result = translateKey(raw, key);
      if (!result) {
        continue;
      }
      output.push(result);
    }
    return output;
  };
  const buildLocale = (code, rawLocale) => {
    const listFor = lookupEachIn(rawLocale);
    const aliases = extraAliases[code];
    const procDef = translateKey(rawLocale, "PROCEDURES_DEFINITION");
    const locale = {
      commands: {},
      dropdowns: {},
      soundEffects: listFor(soundEffects),
      microbitWhen: listFor(microbitWhen),
      osis: listFor(osis),
      definePrefix: /(.*)%1/.exec(procDef)[1].trim().split(/ /g).filter((x) => !!x),
      defineSuffix: /%1(.*)/.exec(procDef)[1].trim().split(/ /g).filter((x) => !!x),
      math: listFor(Object.keys(blocks_info.operator_mathop.params[0].options)),
      aliases: aliases || {}
    };
    for (const [opcode, command] of Object.entries(blocks_info)) {
      if (command.skipLocaleBuild || command.id?.startsWith("scratchblocks:")) {
        continue;
      }
      for (const param of command.params || []) {
        for (const optionId in param.options || {}) {
          if (optionId in locale.dropdowns) {
            continue;
          }
          if (optionId.startsWith("raw:")) {
            const rawText = optionId.slice("raw:".length);
            locale.dropdowns[optionId] = rawText;
            continue;
          }
          const result2 = translateKey(rawLocale, optionId);
          if (!result2) {
            console.warn(`Missing translation for ${optionId} in locale ${code}`);
            continue;
          }
          locale.dropdowns[optionId] = result2;
        }
      }
      const id = command.id || (extensionList.includes(command.category) ? opcode.replace("_", ".") : opcode.replace("operator_", "operators_").toUpperCase());
      const result = translateKey(rawLocale, id);
      if (!result) {
        console.warn(`Missing translation for ${id} in locale ${code}`);
        continue;
      }
      locale.commands[id] = result;
    }
    locale.commands["scratchblocks:ellipsis"] = ". . .";
    if (code === "en") {
      locale.osis.push("other scripts in stage");
      locale.renamedBlocks = {
        "say %1 for %2 secs": "LOOKS_SAYFORSECS",
        "think %1 for %2 secs": "LOOKS_THINKFORSECS",
        "play sound %1": "SOUND_PLAY",
        "wait %1 secs": "CONTROL_WAIT",
        clear: "pen.clear"
      };
      locale.commands["scratchblocks:end"] = "end";
    }
    return locale;
  };
  const fixup = (key, value) => {
    const variables = (blocks_info[toOpcode(key)]?.params || []).map((p) => p.name);
    value = value.replace(/\[[^\]]+\]/g, (key2) => `%${variables.indexOf(key2.slice(1, -1)) + 1}`);
    value = value.trim();
    switch (key) {
      case "EVENT_WHENFLAGCLICKED":
        return value.replace("%1", "@greenFlag");
      case "MOTION_TURNLEFT":
        return value.replace("%1", "@turnLeft").replace("%2", "%1");
      case "MOTION_TURNRIGHT":
        return value.replace("%1", "@turnRight").replace("%2", "%1");
      case "CONTROL_STOP":
        return value + " %1";
      default:
        return value;
    }
  };
  function getLocale(code, reduxState, blockly) {
    return buildLocale(code, {
      mappings: blockly.ScratchMsgs.locales[code],
      extensionMappings: reduxState.locales.messagesByLocale[code]
    });
  }
  class TabManager {
    constructor(addon, content, containerClassName = "") {
      this.addon = addon;
      this.tabs = [];
      this.currentTabIndex = 0;
      this.#initTabsContainer(content, containerClassName);
    }
#initTabsContainer(content, containerClassName) {
      this.tabsContainer = document.createElement("div");
      this.tabsContainer.className = this.addon.tab.scratchClass("gui_tabs", {
        others: containerClassName
      });
      content.append(this.tabsContainer);
      this.tabsHeader = document.createElement("div");
      this.tabsHeader.className = this.addon.tab.scratchClass("react-tabs_react-tabs__tab-list", "gui_tab-list");
      this.tabsContainer.append(this.tabsHeader);
    }
createTab(tabName, tabId, panelContent) {
      const tabHeader = document.createElement("div");
      tabHeader.className = this.addon.tab.scratchClass("react-tabs_react-tabs__tab", "gui_tab");
      tabHeader.textContent = tabName;
      tabHeader.dataset.tabId = tabId;
      const tabPanel = document.createElement("div");
      tabPanel.className = this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel", "gui_tab-panel");
      tabPanel.dataset.tabId = tabId;
      if (panelContent) {
        if (Array.isArray(panelContent)) {
          panelContent.forEach((item) => tabPanel.append(item));
        } else {
          tabPanel.append(panelContent);
        }
      }
      const tab = {
        name: tabName,
        id: tabId,
        header: tabHeader,
        panel: tabPanel
      };
      this.tabs.push(tab);
      this.tabsHeader.append(tabHeader);
      this.tabsContainer.append(tabPanel);
      const tabIndex = this.tabs.length - 1;
      tabHeader.addEventListener("click", () => this.switchTab(tabIndex));
    }
switchTab(tabIdOrIndex) {
      let tabIndex;
      if (typeof tabIdOrIndex === "string") {
        tabIndex = this.tabs.findIndex((tab) => tab.id === tabIdOrIndex);
        if (tabIndex === -1) {
          console.warn(`Tab with id "${tabIdOrIndex}" not found`);
          return;
        }
      } else {
        tabIndex = tabIdOrIndex;
      }
      if (tabIndex < 0 || tabIndex >= this.tabs.length) {
        console.warn(`Invalid tab index: ${tabIndex}`);
        return;
      }
      const currentTab = this.tabs[this.currentTabIndex];
      currentTab.header.classList.remove(
        this.addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        this.addon.tab.scratchClass("gui_is-selected")
      );
      currentTab.panel.classList.remove(
        this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel--selected"),
        this.addon.tab.scratchClass("gui_is-selected")
      );
      const newTab = this.tabs[tabIndex];
      newTab.header.classList.add(
        this.addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        this.addon.tab.scratchClass("gui_is-selected")
      );
      newTab.panel.classList.add(
        this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel--selected"),
        this.addon.tab.scratchClass("gui_is-selected")
      );
      this.currentTabIndex = tabIndex;
    }
  }
  var _GM_addStyle = (() => typeof GM_addStyle != "undefined" ? GM_addStyle : void 0)();
  const style$1 = `
.sa-text2blocks-textarea {
  width: 100%;
  height: 100%;
  padding: 0.4em;
  margin-bottom: 0.4em;
  resize: none;
}

.sa-text2blocks-modal-container {
  width: 70%;
  height: 70%;
}

.sa-text2blocks-tabs-container {
  height: calc(100% - 100px);
}

.sa-text2blocks-variables-panel {
  padding: 10px;
  overflow-y: auto;
}

.sa-text2blocks-variables-content {
  width: 100%;
  height: 100%;
}

.sa-text2blocks-button {
  margin-right: 10px;
}

.sa-text2blocks-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tables for variables and lists */
.sa-text2blocks-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.sa-text2blocks-table th,
.sa-text2blocks-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--editorDarkMode-border, #ffffff0d);
}

.sa-text2blocks-table th {
  background-color: var(--editorDarkMode-accent, #151515);
  font-weight: 600;
  font-size: 12px;
  color: var(--editorDarkMode-page-text, #ffffff);
}

.sa-text2blocks-table tr:hover {
  background-color: var(--editorDarkMode-input, #202020);
}

.sa-text2blocks-table-name-col {
  width: 25%;
  font-weight: 500;
  word-break: break-word;
  color: var(--editorDarkMode-page-text, #ffffff);
}

.sa-text2blocks-table-name-col span {
  font-weight: 500;
}

.sa-text2blocks-table-action-col {
  width: 20%;
}

.sa-text2blocks-table-config-col {
  width: 55%;
}

/* Selects and inputs */
.sa-text2blocks-select {
  padding: 6px 8px;
  border: 1px solid var(--editorDarkMode-border, #fc7c24);
  border-radius: 4px;
  background-color: var(--editorDarkMode-input, #202020);
  color: var(--editorDarkMode-input-text, #ffffff);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  min-width: 100px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.sa-text2blocks-select:hover {
  border-color: var(--editorDarkMode-primary, #855cd6);
}

.sa-text2blocks-select:focus {
  outline: none;
  border-color: var(--editorDarkMode-primary, #855cd6);
  box-shadow: 0 0 0 2px var(--editorDarkMode-primary-transparent15, #855cd626);
}

.sa-text2blocks-input {
  padding: 6px 8px;
  border: 1px solid var(--editorDarkMode-border, #fc7c24);
  border-radius: 4px;
  background-color: var(--editorDarkMode-input, #202020);
  color: var(--editorDarkMode-input-text, #ffffff);
  font-size: 12px;
  font-family: inherit;
  min-width: 80px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.sa-text2blocks-input::placeholder {
  color: var(--editorDarkMode-input-transparentText, rgba(255, 255, 255, 0.4));
}

.sa-text2blocks-input:hover {
  border-color: var(--editorDarkMode-primary, #855cd6);
}

.sa-text2blocks-input:focus {
  outline: none;
  border-color: var(--editorDarkMode-primary, #855cd6);
  box-shadow: 0 0 0 2px var(--editorDarkMode-primary-transparent15, #855cd626);
}

.sa-text2blocks-config-container {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
`;
  _GM_addStyle(style$1);
  async function text2Blocks({ addon, console: console2, msg }) {
    const Blockly = addon.Blockly;
    const workspace = addon.workspace;
    const vm = addon.vm;
    const reduxState = addon.reduxState;
    const userLang = reduxState.locales.locale;
    loadLanguages({
      en: getLocale("en", reduxState, Blockly),
      ...userLang !== "en" ? { [userLang]: getLocale(userLang, reduxState, Blockly) } : {}
    });
    const editorMenu = document.querySelector("[class*=menu-bar_main-menu_]");
    const devider = document.createElement("div");
    devider.className = addon.tab.scratchClass("divider_divider", "menu-bar_divider");
    editorMenu.appendChild(devider);
    const menuItem = document.createElement("div");
    menuItem.className = addon.tab.scratchClass("menu-bar_menu-bar-item", "menu-bar_no-offset", "menu-bar_hoverable");
    menuItem.textContent = msg("main");
    editorMenu.appendChild(menuItem);
    menuItem.addEventListener("click", async () => {
      const modal = addon.tab.createModal(msg("main"), {
        isOpen: true,
        useEditorClasses: true
      });
      const { container, content, closeButton, remove } = modal;
      closeButton.addEventListener("click", remove);
      container.classList.add("sa-text2blocks-modal-container");
      content.style.height = "100%";
      const tabManager = new TabManager(addon, content, "sa-text2blocks-tabs-container");
      const textarea = document.createElement("textarea");
      textarea.className = addon.tab.scratchClass("prompt_variable-name-text-input", {
        others: "sa-text2blocks-textarea"
      });
      tabManager.createTab(msg("code"), "code-tab", textarea);
      const variablesPanel = document.createElement("div");
      variablesPanel.className = addon.tab.scratchClass("sa-text2blocks-variables-panel", {
        others: "sa-text2blocks-variables-content"
      });
      tabManager.createTab(msg("variables"), "variables-tab", variablesPanel);
      const issuesPanel = document.createElement("div");
      issuesPanel.className = addon.tab.scratchClass("sa-text2blocks-issues-panel", {
        others: "sa-text2blocks-issues-content"
      });
      tabManager.createTab(msg("issues"), "issues-tab", issuesPanel);
      tabManager.switchTab("code-tab");
      const variableMappings = new Map();
      const buttonRow = document.createElement("div");
      buttonRow.className = addon.tab.scratchClass("prompt_button-row");
      const parseButton = document.createElement("button");
      parseButton.textContent = msg("parse-button");
      parseButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-text2blocks-button" });
      const applyButton = document.createElement("button");
      applyButton.textContent = msg("apply-button");
      applyButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-text2blocks-button" });
      applyButton.disabled = true;
      buttonRow.append(parseButton, applyButton);
      content.append(buttonRow);
      textarea.addEventListener("input", () => {
        applyButton.disabled = true;
        parseButton.disabled = false;
      });
      const target = vm.runtime.getEditingTarget();
      const text2blocks = new Text2Blocks(target, vm.runtime, Blockly.utils.genUid, workspace);
      function updateVariablesPanel() {
        variablesPanel.innerHTML = "";
        if (text2blocks.variableNames.size === 0 && text2blocks.listNames.size === 0) {
          const emptyMsg = document.createElement("p");
          emptyMsg.textContent = msg("no-variables-lists");
          emptyMsg.style.color = "var(--editorDarkMode-input-transparentText, rgba(255, 255, 255, 0.4))";
          variablesPanel.appendChild(emptyMsg);
          return;
        }
        if (text2blocks.variableNames.size > 0) {
          const varTitle = document.createElement("h3");
          varTitle.textContent = msg("variables");
          varTitle.style.marginBottom = "10px";
          varTitle.style.color = "var(--editorDarkMode-page-text, #ffffff)";
          variablesPanel.appendChild(varTitle);
          const varTable = createVariablesTable(Array.from(text2blocks.variableNames), "variable");
          variablesPanel.appendChild(varTable);
        }
        if (text2blocks.listNames.size > 0) {
          const listTitle = document.createElement("h3");
          listTitle.textContent = msg("lists");
          listTitle.style.marginBottom = "10px";
          listTitle.style.marginTop = "20px";
          listTitle.style.color = "var(--editorDarkMode-page-text, #ffffff)";
          variablesPanel.appendChild(listTitle);
          const listTable = createVariablesTable(Array.from(text2blocks.listNames), "list");
          variablesPanel.appendChild(listTable);
        }
      }
      function updateIssuesPanel() {
        issuesPanel.innerHTML = "";
        const hasErrors = text2blocks.errors.length > 0;
        const hasWarnings = text2blocks.warnings.length > 0;
        if (!hasErrors && !hasWarnings) {
          const emptyMsg = document.createElement("p");
          emptyMsg.textContent = msg("no-issues");
          emptyMsg.style.color = "var(--editorDarkMode-input-transparentText, rgba(255, 255, 255, 0.4))";
          issuesPanel.appendChild(emptyMsg);
          return;
        }
        function formatErrorMessage(error) {
          const { code, params } = error;
          const p = params || {};
          switch (code) {
            case "INVALID_PROCCODE":
              return `Invalid proccode: "${p.proccode}"`;
            case "PROCCODE_WITH_CONTROL_CHARS":
              return `Invalid proccode (contains control characters): "${p.proccode}"`;
            case "TYPE_MISMATCH":
              return `Type mismatch for ${p.parentOpcode}.${p.inputName}: expected ${p.expected}, got ${p.got}`;
            case "PARAM_COUNT_MISMATCH":
              return `Parameter count mismatch: expected ${p.expected}, got ${p.got}${p.opcode ? ` for block ${p.opcode}` : p.proccode ? ` for procedure "${p.proccode}"` : ""}`;
            case "UNKNOWN_BLOCK":
              return `Unknown block (hash: ${p.hash})`;
            case "BLOCK_NOT_AVAILABLE":
              return `Block "${p.opcode}" is not available for ${p.targetType}`;
            case "SHAPE_OVERRIDE_NOT_ALLOWED":
              return `Shape override not allowed for block (hash: ${p.hash})`;
            case "CATEGORY_OVERRIDE_NOT_ALLOWED":
              return `Category override not allowed for block (hash: ${p.hash})`;
            case "PROC_PROTOTYPE_NOT_FOUND":
              return `Procedure prototype not found for: "${p.proccode}"`;
            case "PROC_CALL_UNDEFINED":
              return `Procedure call refers to undefined procedure: "${p.proccode}"`;
            case "FINAL_BLOCK_NOT_END":
              return `Final block (${p.opcode}) must be at the end`;
            case "MENU_NOT_FOUND":
              return `Menu "${p.menu}" not found for ${p.parentOpcode}.${p.inputName}`;
            case "VALUE_NOT_FOUND":
              return `Value "${p.value}" not found in ${p.expectedType} for ${p.parentOpcode}.${p.inputName}`;
            case "NOTE_VALUE_OUT_OF_RANGE":
              return `Note value "${p.value}" out of range (${p.min}-${p.max}) for ${p.parentOpcode}.${p.inputName}`;
            case "VARIABLE_NOT_FOUND":
              return `Variable "${p.variable}" not found${p.targetSprite ? ` in sprite "${p.targetSprite}"` : " in stage"}`;
            case "CLONE_OF_MYSELF_INVALID_FOR_STAGE":
              return `Block "control_create_clone_of" cannot use "_myself_" option when target is stage`;
            case "SENSING_OF_STAGE_INVALID_PROPERTY":
              return `Block "sensing_of" with stage: PROPERTY can only be ${p.allowed}`;
            case "SENSING_OF_SPRITE_INVALID_PROPERTY":
              return `Block "sensing_of" with sprite "${p.objectValue}": PROPERTY "${p.property}" is only available for stage`;
            case "DUPLICATE_PROC_DEFINITION":
              return `Duplicate procedure definition for: "${p.proccode}"`;
            default:
              return `${code}${p ? ": " + JSON.stringify(p) : ""}`;
          }
        }
        if (hasErrors) {
          const errorTitle = document.createElement("h3");
          errorTitle.textContent = msg("errors");
          errorTitle.style.marginBottom = "10px";
          errorTitle.style.color = "#ff6b6b";
          issuesPanel.appendChild(errorTitle);
          const errorList = document.createElement("ul");
          errorList.style.color = "var(--editorDarkMode-page-text, #ffffff)";
          errorList.style.marginBottom = "20px";
          for (const error of text2blocks.errors) {
            const li = document.createElement("li");
            li.textContent = formatErrorMessage(error);
            li.style.marginBottom = "8px";
            errorList.appendChild(li);
          }
          issuesPanel.appendChild(errorList);
        }
        if (hasWarnings) {
          const warningTitle = document.createElement("h3");
          warningTitle.textContent = msg("warnings");
          warningTitle.style.marginBottom = "10px";
          warningTitle.style.color = "#ffd166";
          issuesPanel.appendChild(warningTitle);
          const warningList = document.createElement("ul");
          warningList.style.color = "var(--editorDarkMode-page-text, #ffffff)";
          for (const warning of text2blocks.warnings) {
            const li = document.createElement("li");
            li.textContent = formatErrorMessage(warning);
            li.style.marginBottom = "8px";
            warningList.appendChild(li);
          }
          issuesPanel.appendChild(warningList);
        }
      }
      function createVariablesTable(names, type) {
        const table = document.createElement("table");
        table.className = "sa-text2blocks-table";
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const nameHeader = document.createElement("th");
        nameHeader.textContent = msg("name");
        nameHeader.className = "sa-text2blocks-table-name-col";
        const actionHeader = document.createElement("th");
        actionHeader.textContent = msg("action");
        actionHeader.className = "sa-text2blocks-table-action-col";
        const configHeader = document.createElement("th");
        configHeader.textContent = msg("configuration");
        configHeader.className = "sa-text2blocks-table-config-col";
        headerRow.appendChild(nameHeader);
        headerRow.appendChild(actionHeader);
        headerRow.appendChild(configHeader);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement("tbody");
        for (const name of names) {
          const row = createVariableRow(name, type);
          tbody.appendChild(row);
        }
        table.appendChild(tbody);
        return table;
      }
      function createVariableRow(name, type) {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.className = "sa-text2blocks-table-name-col";
        const nameLabel = document.createElement("span");
        nameLabel.textContent = name;
        nameCell.appendChild(nameLabel);
        row.appendChild(nameCell);
        const actionCell = document.createElement("td");
        actionCell.className = "sa-text2blocks-table-action-col";
        const actionSelect = document.createElement("select");
        actionSelect.className = "sa-text2blocks-select";
        const optionNew = document.createElement("option");
        optionNew.value = "new";
        optionNew.textContent = msg("create-new");
        actionSelect.appendChild(optionNew);
        const optionExisting = document.createElement("option");
        optionExisting.value = "existing";
        optionExisting.textContent = msg("use-existing");
        actionSelect.appendChild(optionExisting);
        const existingVars = getVariablesOfTarget(target, type);
        const sameNameExists = existingVars.some((v) => v.name === name);
        const defaultAction = sameNameExists ? "existing" : "new";
        actionSelect.value = defaultAction;
        actionCell.appendChild(actionSelect);
        row.appendChild(actionCell);
        const configCell = document.createElement("td");
        configCell.className = "sa-text2blocks-table-config-col";
        const configContainer = document.createElement("div");
        configContainer.className = "sa-text2blocks-config-container";
        const initialConfigContent = defaultAction === "new" ? createNewVarConfig(name, type) : createExistingVarConfig(name, type);
        configContainer.appendChild(initialConfigContent);
        configCell.appendChild(configContainer);
        row.appendChild(configCell);
        actionSelect.addEventListener("change", () => {
          configContainer.innerHTML = "";
          if (actionSelect.value === "new") {
            const newVarConfig = createNewVarConfig(name, type);
            configContainer.appendChild(newVarConfig);
          } else if (actionSelect.value === "existing") {
            const existingVarConfig = createExistingVarConfig(name, type);
            configContainer.appendChild(existingVarConfig);
          }
        });
        return row;
      }
      function createNewVarConfig(name, type) {
        const container2 = document.createElement("div");
        container2.className = "sa-text2blocks-config-container";
        const input = document.createElement("input");
        input.type = "text";
        input.className = "sa-text2blocks-input";
        input.placeholder = msg("new-name-placeholder", { name });
        input.value = "";
        const scopeSelect = document.createElement("select");
        scopeSelect.className = "sa-text2blocks-select";
        const optionSprite = document.createElement("option");
        optionSprite.value = "sprite";
        optionSprite.textContent = addon.tab.scratchMessage("gui.gui.variableScopeOptionSpriteOnly");
        scopeSelect.appendChild(optionSprite);
        const optionGlobal = document.createElement("option");
        optionGlobal.value = "global";
        optionGlobal.textContent = addon.tab.scratchMessage("gui.gui.variableScopeOptionAllSprites");
        scopeSelect.appendChild(optionGlobal);
        scopeSelect.value = "sprite";
        function updateMapping() {
          const customName = input.value.trim() || name;
          const scope = scopeSelect.value;
          console2.log(`[TODO] Create new ${type} "${customName}" with scope: ${scope}`);
          variableMappings.set(name, {
            type: "new",
            data: {
              name: customName,
              varType: type,
              scope
            }
          });
          console2.log("Variable mappings updated:", variableMappings);
        }
        input.addEventListener("change", updateMapping);
        input.addEventListener("input", updateMapping);
        scopeSelect.addEventListener("change", updateMapping);
        updateMapping();
        container2.appendChild(input);
        container2.appendChild(scopeSelect);
        return container2;
      }
      function createExistingVarConfig(name, type) {
        const container2 = document.createElement("div");
        container2.className = "sa-text2blocks-config-container";
        const existingSelect = document.createElement("select");
        existingSelect.className = "sa-text2blocks-select";
        const existingVariables = getVariablesOfTarget(target, type);
        for (const varObj of existingVariables) {
          const option = document.createElement("option");
          option.value = varObj.name;
          option.textContent = varObj.name;
          option.dataset.variableId = varObj.id;
          existingSelect.appendChild(option);
        }
        const sameNameVar = existingVariables.find((v) => v.name === name);
        if (sameNameVar) {
          existingSelect.value = name;
        }
        function updateMapping() {
          const selectedVar = existingSelect.value;
          const selectedOption = existingSelect.options[existingSelect.selectedIndex];
          const variableId = selectedOption.dataset.variableId;
          console2.log(`Map "${name}" to existing ${type} "${selectedVar}" (id: ${variableId})`);
          variableMappings.set(name, {
            type: "existing",
            data: {
              name,
              varType: type,
              mappedTo: selectedVar,
              mappedToId: variableId
            }
          });
          console2.log("Variable mappings updated:", variableMappings);
        }
        existingSelect.addEventListener("change", updateMapping);
        if (existingVariables.length > 0) {
          updateMapping();
        }
        container2.appendChild(existingSelect);
        return container2;
      }
      parseButton.addEventListener("click", async () => {
        try {
          const text = textarea.value;
          text2blocks.text2blocks(text, userLang !== "en" ? [userLang, "en"] : ["en"]);
          console2.log("Converted blocks JSON:", text2blocks.blockJson);
          console2.log("Variable names:", text2blocks.variableNames);
          console2.log("List names:", text2blocks.listNames);
          console2.log("Errors:", text2blocks.errors);
          console2.log("Warnings:", text2blocks.warnings);
          updateVariablesPanel();
          updateIssuesPanel();
          if (text2blocks.errors.length > 0) {
            applyButton.disabled = true;
          } else {
            applyButton.disabled = false;
          }
          if (text2blocks.errors.length > 0 || text2blocks.warnings.length > 0) {
            tabManager.switchTab("issues-tab");
          } else if (text2blocks.variableNames.size > 0 || text2blocks.listNames.size > 0) {
            tabManager.switchTab("variables-tab");
          }
        } catch (error) {
          console2.log("Error parsing text:", error);
          applyButton.disabled = true;
          alert("Parse failed: " + error.message);
        }
      });
      applyButton.addEventListener("click", async () => {
        if (text2blocks.warnings.length > 0) {
          if (!await addon.tab.confirm(msg("warnings-title"), msg("warnings-confirm-content"), { useEditorClasses: true })) {
            return;
          }
        }
        try {
          const stage = vm.runtime.getTargetForStage();
          const duplicates = [];
          for (const [originalName, mapping] of variableMappings) {
            if (mapping.type === "new") {
              const { name: newName, varType, scope } = mapping.data;
              const variableType = varType === "list" ? "list" : "";
              const targetList = scope === "global" ? [stage] : [target, stage];
              for (const targetToCheck of targetList) {
                const existingVars = Object.values(targetToCheck.variables).filter((v) => v.type === variableType);
                const conflictVar = existingVars.find((v) => v.name === newName);
                if (conflictVar) {
                  duplicates.push(`${varType === "list" ? msg("list") : msg("variable")}: "${newName}"`);
                  break;
                }
              }
            }
          }
          if (duplicates.length > 0) {
            const duplicateList = duplicates.join("\n");
            alert(msg("duplicate-name-error", { names: duplicateList }));
            return;
          }
          const finalVariableMappings = new Map();
          for (const [originalName, mapping] of variableMappings) {
            if (mapping.type === "new") {
              const { name: newName, varType, scope } = mapping.data;
              const variableType = varType === "list" ? "list" : "";
              const variableId = Blockly.utils.genUid();
              let targetForVar;
              let isCloud = false;
              if (scope === "sprite") {
                targetForVar = target;
                isCloud = false;
              } else if (scope === "global") {
                targetForVar = stage;
                isCloud = false;
              } else if (scope === "cloud") {
                console2.warn(`[TODO] Cloud variable "${newName}" is not yet supported`);
                continue;
              }
              targetForVar.createVariable(variableId, newName, variableType, isCloud);
              finalVariableMappings.set(originalName, {
                name: newName,
                id: variableId
              });
            } else if (mapping.type === "existing") {
              finalVariableMappings.set(originalName, {
                name: mapping.data.mappedTo,
                id: mapping.data.mappedToId
              });
            }
          }
          text2blocks.applyVariableMappings(finalVariableMappings);
          await vm.shareBlocksToTarget(text2blocks.blockJson, target.id);
          vm.emitWorkspaceUpdate();
          vm.emitTargetsUpdate();
          workspace.updateToolbox(reduxState.scratchGui.toolbox.toolboxXML);
          workspace.toolboxRefreshEnabled_ = true;
          remove();
        } catch (error) {
          console2.log("Error applying blocks:", error);
          alert("Apply failed: " + error.message);
        }
      });
    });
    function getVariablesOfTarget(target, type = "variable") {
      type = type === "list" ? "list" : "";
      return Array.from(
new Set([
          ...Object.values(target.variables).filter((v) => v.type === type),
          ...Object.values(vm.runtime.getTargetForStage().variables).filter((v) => v.type === type)
        ])
      );
    }
  }
  const style = `
/* Page */
html:not(.sa-editor),
body:not(.sa-editor > *, .scratchCommentBody),
#view {
  background-color: var(--darkWww-page, #fcfcfc);
  background-image: var(
    --darkWww-page-scratchr2BackgroundImage,
    url("https://cdn.scratch.mit.edu/scratchr2/static/images/scratch-bg.png")
  );
}
body:not(.sa-editor > *, .scratchCommentBody) {
  color: var(--darkWww-page-scratchr2Text, #322f31);
  font-family: "Helvetica Neue", Arial, sans-serif;
}
p {
  color: inherit;
}
#view {
  margin-top: 35px;
}
.subnavigation {
  top: 35px;
}
@media (min-width: 942px) {
  .inner {
    width: 940px;
  }
}

/* Links */
a {
  font-weight: normal;
  text-shadow: none;
}
a,
a:link,
a:visited,
a:active {
  color: var(--darkWww-link-scratchr2, #855cd6);
}
a:hover {
  color: var(--darkWww-link-scratchr2, #855cd6);
  text-decoration: underline;
}

/* Buttons */
.button {
  background-color: var(--darkWww-button-scratchr2, #855cd6);
  border-radius: 5px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 13px;
  font-weight: normal;
}
:root:not(.sa-editor) .button.white {
  background-image: linear-gradient(
    var(--darkWww-box-scratchr2ButtonGradientTop, white),
    var(--darkWww-box-scratchr2ButtonGradientBottom, #ccc)
  );
  border: 1px solid var(--darkWww-box-scratchr2ButtonBorder, #999);
  color: var(--darkWww-box-scratchr2ButtonText, #666);
  text-shadow: 0 1px var(--darkWww-box, white);
}
:root:not(.sa-editor) .button.white:hover {
  background-color: var(--darkWww-box-scratchr2ButtonHover, #e6e6e6);
  background-image: none;
}
.forms-close-button {
  width: auto;
  height: auto;
  padding: 2px 5px 3px 5px;
  background-color: rgba(0, 0, 0, 0.1);
  border: 3px solid transparent;
  border-radius: 35px;
  box-shadow: none;
  font-size: 16px;
  line-height: 13.5px;
}
.forms-close-button img {
  display: none;
}
.forms-close-button::after {
  content: "x";
}

/* Inputs */
.input,
:root:not(.sa-editor) .select select,
.textarea {
  padding: 4px;
  background-color: var(--darkWww-box, white);
  border-color: var(--darkWww-border-20, #ccc);
  border-radius: 3px;
  color: var(--darkWww-box-scratchr2InputText, #555);
  font-size: 13px;
}
.input,
.textarea {
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
  transition:
    border-color 0.2s linear,
    box-shadow 0.2s linear;
}
.input:focus,
.textarea:focus {
  border-color: rgba(82, 168, 236, 0.8);
  box-shadow:
    inset 0 1px 1px rgba(0, 0, 0, 0.075),
    0 0 8px rgba(82, 168, 236, 0.6);
  transition:
    border-color 0.2s linear,
    box-shadow 0.2s linear;
}
.select label:empty {
  display: none;
}
:root:not(.sa-editor) .select select {
  appearance: auto;
  height: 28px;
  background-image: none;
}
:root:not(.sa-editor) .select select:focus,
:root:not(.sa-editor) .select select:hover {
  background-color: var(--darkWww-box, white);
  background-image: none;
  color: var(--darkWww-box-scratchr2InputText, #555);
}
:root:not(.sa-editor) .select select:focus {
  border-color: var(--darkWww-border-20, #ccc);
}
:root:not(.sa-editor) .select select:focus-visible {
  outline: revert;
}
:root:not(.sa-editor) .select select > option {
  background-color: var(--darkWww-box, white);
  color: var(--darkWww-box-scratchr2InputText, #555);
}
.inplace-input,
.inplace-textarea {
  background-color: var(--darkWww-box, white);
  border-color: var(--darkWww-border-20, #ccc);
  border-radius: 3px;
  transition: none;
}
.inplace-textarea {
  margin: 0 -2px;
  width: calc(100% + 4px);
  padding: 0;
  font-size: 13px;
  line-height: 18px;
  transition: none;
}
.inplace-input:focus,
.inplace-textarea:focus {
  border-style: dashed;
  border-color: var(--darkWww-border-20, #ccc);
  box-shadow: none;
}
.inplace-input:not([value=""], :hover, :focus),
.inplace-textarea:not(:empty, :hover, :focus) {
  background-color: transparent;
  border-color: transparent;
}
.inplace-textarea::placeholder {
  font-style: normal;
}

/* Box component */
.box {
  border-color: var(--darkWww-box-scratchr2Border, #e0e0e0);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.27);
}
.box .box-header {
  height: auto;
  padding: 7px 20px;
  background-color: var(--darkWww-gray-scratchr2, #f7f7f7);
  border-bottom-color: var(--darkWww-box-scratchr2Border, #e0e0e0);
  text-shadow: var(--darkWww-gray-scratchr2TextShadow, 0 1px white);
}
.box .box-header h4 {
  color: var(--darkWww-gray-scratchr2HeaderText, #554747);
  line-height: 20px;
}
@media (min-width: 942px) {
  .box .box-header h4 {
    font-size: 1rem;
  }
}
.box .box-header p {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
}
.box .box-content {
  color: var(--darkWww-box-scratchr2Text, #322f31);
}

/* Navigation bar */
#navigation {
  height: 35px;
  background-color: var(--darkWww-navbar-scratchr2, #855cd6);
  border: none;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}
#navigation .inner > ul {
  height: 35px;
}
#navigation .logo a {
  margin: 0;
  width: 80px;
  height: 35px;
  background-image: url("https://cdn.scratch.mit.edu/scratchr2/static/images/logo_sm.png");
  background-position: left center;
  background-size: auto;
  transition: none;
}
#navigation .logo a:hover {
  background-image: url("https://cdn.scratch.mit.edu/scratchr2/static/images/logo_sm_highlight.png");
  background-size: auto;
  transition: none;
}
#navigation .link > a {
  height: 35px;
  padding: 0 15px;
  background-clip: padding-box;
  border-left: 1px solid transparent;
  font-size: 15px;
  font-weight: normal;
  line-height: 35px;
}
#navigation .inner > ul > li.search {
  margin: 0;
  padding: 6px 10px;
  height: auto;
  border-left: 1px solid transparent;
}
#navigation .inner > ul > li.search .form {
  /* Must be less than input height to center input correctly */
  line-height: 18px;
}
#navigation .inner > ul > li.search .input {
  margin: 0;
  background-color: var(--darkWww-box, white);
  border-radius: 10px;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
}
#navigation .inner > ul > li.search .input[type="text"] {
  width: calc(100% - 38px);
  height: 14px;
  padding: 4px;
  padding-left: 33px;
  color: var(--darkWww-box-scratchr2InputText, #555);
  font-size: 13px;
  transition: none;
}
#navigation .inner > ul > li.search .input[type="text"]:focus {
  background-color: var(--darkWww-box, white);
  transition: none;
}
#navigation .inner > ul > li.search .input[type="text"]::placeholder {
  color: var(--darkWww-box-scratchr2InputPlaceholder, #bbb);
}
#navigation .inner > ul > li.search .button {
  margin: 0;
}
#navigation .inner > ul > li.search .btn-search {
  width: 0;
  height: 22px;
  padding: 0;
  padding-left: 28px;
  background-image: url("https://cdn.scratch.mit.edu/scratchr2/static/images/nav-search-glass.png");
  background-position: 9px center;
  background-size: auto;
  border-right: 1px solid var(--darkWww-border-20, #ccc);
  border-radius: 0;
  opacity: 0.8;
  cursor: default;
}
#navigation .messages > a {
  width: 42px;
  padding: 0;
  background-image: none;
}
#navigation .messages > a::before {
  /* Move icon into a pseudo-element so filters can be applied to it separately */
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("https://cdn.scratch.mit.edu/scratchr2/static/images/nav-notifications.png");
  background-repeat: no-repeat;
  background-position: center center;
  background-size: auto;
}
#navigation .messages > a:hover::before {
  background-size: auto;
}
#navigation .messages .message-count.show {
  top: 4px;
  right: 0;
  min-width: 16px;
  height: 15px;
  padding: 0;
  background-color: var(--darkWww-messageIndicatorColor-scratchr2, #f9a739);
  border-radius: 10px;
  font-size: 9px;
  line-height: 14px;
  text-align: center;
}
#navigation .mystuff > a {
  width: 45px;
  padding: 0;
  background-image: url("https://cdn.scratch.mit.edu/scratchr2/static/images/mystuff.png");
  background-size: auto;
}
#navigation .mystuff > a:hover {
  background-size: auto;
}
.account-nav .user-info {
  display: inline-block;
  height: 35px;
  padding: 0 10px;
  background-clip: padding-box;
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  line-height: 35px;
}
.account-nav .user-info .avatar-wrapper {
  vertical-align: middle;
  margin-top: -3px;
  margin-right: 5px;
  --avatar-size: 26px;
}
.account-nav .user-info .avatar {
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 1px;
}
.account-nav .user-info::after {
  margin-left: 4px;
  width: 0;
  height: 0;
  background-image: none;
  border-top: 4px solid var(--darkWww-navbar-scratchr2Text, white);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  opacity: 0.5;
}
#navigation .link.join > a,
#navigation .link.login-item > a {
  height: 33px;
  padding: 0 10px;
  font-weight: bold;
  line-height: 33px;
}
#navigation .link > a:hover,
#navigation .inner > ul > li.right a:hover,
.account-nav .user-info.open {
  background-color: var(--darkWww-navbar-scratchr2ItemHover, rgba(0, 0, 0, 0.1));
}
#navigation .inner > ul > li.right.join > a:hover {
  background-color: #f9a739;
  color: white;
}

/* Account dropdown */
.account-nav .dropdown {
  top: 34px;
  right: 1px;
  min-width: 160px;
  max-width: 220px;
  box-sizing: content-box;
  background-color: var(--darkWww-navbar-scratchr2, #855cd6);
  background-clip: padding-box;
  border-color: var(--darkWww-border-20, #ccc);
  border-top: none;
  border-right: none;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  box-shadow:
    inset 0 1px 1px rgba(100, 100, 100, 0.25),
    0 1px 1px rgba(0, 0, 0, 0.25);
}
.account-nav .dropdown > li {
  margin: 0;
}
.account-nav .dropdown > li a {
  padding-right: 5px;
  font-weight: normal;
}
.account-nav .dropdown > li.divider {
  margin-top: 10px;
  background-clip: padding-box;
  border-color: transparent;
}
.account-nav .dropdown > li.divider a {
  padding: 0 9px;
}
.account-nav .dropdown > li:last-child {
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}

/* Login dropdown */
.dropdown.with-arrow {
  margin-top: 11px;
  min-width: 160px;
  max-width: 220px;
  padding: 1px;
  border-color: transparent;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.dropdown.with-arrow::before {
  top: -11px;
  width: 0;
  height: 0;
  background-color: transparent;
  border: 11px solid transparent;
  border-top: none;
  border-bottom-color: var(--darkWww-navbar-scratchr2, #855cd6);
  border-radius: 0;
  transform: none;
}
.login {
  width: auto;
  padding: 9px 14px;
  line-height: 18px;
}
.login label {
  margin-bottom: 8px;
  padding: 0;
  color: var(--darkWww-navbar-scratchr2Text, #d9edf5);
  font-weight: normal;
}
.login .row {
  margin: 0;
}
.login .input {
  margin-bottom: 8px;
  width: 170px;
  height: 18px;
}
.login .submit-row {
  justify-content: flex-start;
}
.login .button {
  margin: 3px;
  height: 32px;
  box-sizing: border-box;
  padding: revert;
  line-height: 30px;
}
.login .submit-button {
  margin-top: 4px;
}
.login a {
  margin: 0;
  line-height: 33px;
}
.login a,
.login a:link,
.login a:visited,
.login a:active {
  color: var(--darkWww-navbar-scratchr2Text, #d9edf5);
}
#navigation .inner > ul > li.right .login a:hover {
  background-color: transparent;
}

/* Footer */
#footer {
  height: 220px;
  padding-top: 20px;
  padding-bottom: 0;
  background-color: var(--darkWww-footer-scratchr2, #ececec);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.14);
  color: var(--darkWww-footer-scratchr2Text, #666);
}
#footer:not(:last-child) {
  box-shadow: inset 0 10px 10px -10px rgba(0, 0, 0, 0.14);
}
#footer .lists {
  margin-bottom: 10px;
  padding-left: 3px;
  justify-content: flex-start;
}
#footer .lists dl {
  flex-grow: 1;
  flex-basis: 0;
  margin: 0;
  font-size: 13px;
}
#footer .lists dt {
  margin-bottom: 5px;
  font-size: 14px;
  line-height: 1.25em;
}
#footer .lists dd {
  margin: 0;
  line-height: 20px;
}
.language-chooser .select .control-label {
  display: none;
}
.language-chooser .select select {
  margin-right: 30px;
}

/* collapse-footer */
:root {
  --footer-hover-height: 210px !important;
}

/* Modals */
.modal-overlay,
.youtube-video-modal-overlay,
.cards-modal-overlay {
  background-color: rgba(0, 0, 0, 0.8);
}
.modal-content,
.youtube-video-modal-container,
.cards-modal-container {
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
}
.modal-content-close,
.youtube-video-modal-container .cards-modal-header .close-button,
.cards-modal-container .cards-modal-header .close-button {
  top: 12px;
  right: 15px;
  width: auto;
  height: auto;
  background-color: transparent;
  background-image: none;
  border: none;
  color: var(--darkWww-box-scratchr2BlackText, black);
  font-size: 20px;
  font-weight: bold;
  line-height: 13.5px;
  opacity: 0.25;
}
.modal-content-close:hover,
.youtube-video-modal-container .cards-modal-header .close-button:hover,
.cards-modal-container .cards-modal-header .close-button:hover {
  opacity: 0.4;
}
.modal-content-close::before,
.youtube-video-modal-container .cards-modal-header .close-button::after,
.cards-modal-container .cards-modal-header .close-button::after {
  content: "d7"; /* U+00D7 MULTIPLICATION SIGN */
}
.modal-content-close-img,
.youtube-video-modal-container .cards-modal-header .close-button img {
  display: none;
}
.modal-header,
.report-modal-header,
.share-modal .title,
.update-thumbnail-info-modal .update-thumbnail-info-modal-title,
.youtube-video-modal-container .cards-modal-header.mint-green,
.cards-modal-container .cards-modal-header,
.mod-feedback .feedback-header {
  padding: 5px 15px;
  background-color: transparent;
  box-shadow: inset 0 -1px 0 0 var(--darkWww-border-5, #eee);
}
.modal-sizes .modal-header {
  height: auto;
  padding-top: 5px;
}
.modal-title,
.report-content-label,
.share-modal .title,
.update-thumbnail-info-modal .update-thumbnail-info-modal-title,
.cards-modal-container .cards-modal-header .cards-title {
  color: var(--darkWww-box-scratchr2HeaderText, #554747);
  text-align: left;
  font-size: 18px;
  line-height: 32px;
}
.sa-modal-title {
  height: auto !important;
  padding: 5px 15px !important;
  background-color: transparent !important;
  box-shadow: inset 0 -1px 0 0 var(--darkWww-border-5, #eee) !important;
  color: var(--darkWww-box-scratchr2HeaderText, #554747) !important;
  text-align: left !important;
}
.tou-modal .tou-step-top-bar {
  display: none;
}
.tou-modal .tou-step-inner-content a.link {
  color: var(--darkWww-box-greenText, #328554);
}
.sa-confirm-text {
  margin-bottom: 0.9375rem !important;
  color: var(--darkWww-box-scratchr2Text, #322f31);
  font-size: 13px;
}
.modal-content .action-buttons {
  margin: 0;
  padding: 14px 15px 15px;
  background-color: var(--darkWww-gray-scratchr2TableCell, #f5f5f5);
  border-top: 1px solid var(--darkWww-border, #ddd);
  box-shadow: inset 0 1px 0 var(--darkWww-gray-boxHighlight, white);
}
.modal-content .action-button {
  height: 32px;
  padding: 0 6px;
  line-height: 30px;
}
.modal-content .action-button.disabled,
.modal-content .action-button.disabled:hover {
  background-image: linear-gradient(
    var(--darkWww-box-scratchr2ButtonGradientTop, white),
    var(--darkWww-box-scratchr2ButtonGradientBottom, #ccc)
  );
  border-color: var(--darkWww-box-scratchr2ButtonBorder, #999);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.05);
  color: var(--darkWww-box-scratchr2ButtonText, #666);
  text-shadow: 0 1px var(--darkWww-box, white);
  opacity: 0.5;
}
.modal-content .submit-button {
  border: 1px solid var(--darkWww-button-scratchr2, #855cd6);
}
.modal-content .submit-button:hover {
  background-color: var(--darkWww-button-scratchr2Hover, #7854c0);
}
.mod-feedback .feedback-content .feedback-form .feedback-submit {
  background-color: #4d97ff;
  background-image: none;
  border: 1px solid #4c97ff;
  color: white;
  text-shadow: none;
}
.mod-feedback .feedback-content .feedback-form .feedback-submit:hover {
  background-color: #4280d7;
}
`;
  _GM_addStyle(style);
  const zhCN = {
    main: "将文本转换为积木",
    "parse-button": "解析",
    "apply-button": "应用",
    code: "代码",
    variables: "变量",
    issues: "问题",
    lists: "列表",
    name: "名称",
    action: "操作",
    configuration: "配置",
    "create-new": "创建新项",
    "use-existing": "使用现有项",
    "new-name-placeholder": "默认值：{name}",
    errors: "错误",
    warnings: "警告",
    "warnings-confirm-content": "存在警告。它们可能导致意外行为，甚至破坏您的项目。您想继续吗？如果您不确定，请点击“取消”。",
    "no-variables-lists": "未找到变量或列表。",
    "no-issues": "未发现问题。",
    "duplicate-name-error": "已存在：\n{names}",
    variable: "变量",
    list: "列表"
  };
  setTimeout(async () => {
    const api = window.api = await getAddonApi();
    console.log("[text2blocks] API", api);
    text2Blocks({
      addon: api,
      console: {
        log: (...args) => console.log("[text2blocks]", ...args),
        error: (...args) => console.error("[text2blocks]", ...args)
      },
      msg: (t) => zhCN[t] || t
    });
  }, 2e3);

})();