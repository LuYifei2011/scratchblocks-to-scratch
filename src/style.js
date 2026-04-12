import "./text2blocks/style.js";
import { GM_addStyle } from "$";

const isTurboWarp = window.location.host === "turbowarp.org" || !!window.__SB2S_DESKTOP_TURBOWARP__;
const isGandi = window.location.href.startsWith("https://www.ccw.site/gandi");

if (isTurboWarp) {
  GM_addStyle(`
    :root {
      --editorDarkMode-page-text: var(--text-primary);
      --editorDarkMode-input: var(--input-background);
      --editorDarkMode-input-text: var(--text-primary);
      --editorDarkMode-primary-transparent15: var(--looks-transparent);
      --editorDarkMode-input-transparentText: var(--text-primary-transparent-default);
      --ui-text-primary-transparent: var(--text-primary);
    }
  `);
} else if (isGandi) {
  GM_addStyle(`
    :root {
      --editorDarkMode-page-text: var(--theme-text-primary);
      --editorDarkMode-input-text: var(--theme-text-primary);
      --ui-text-primary-transparent: var(--theme-text-primary);
      --editorDarkMode-accent: var(--theme-color-350);
      --editorDarkMode-accent-text: var(--theme-text-primary);
      --editorDarkMode-input: var(--theme-color-50);
      --editorDarkMode-primary: var(--theme-brand-color);
      --editorDarkMode-primary-transparent15: color-mix(in srgb, var(--theme-brand-color) 15%, transparent);
      --editorDarkMode-border: var(--theme-color-200);
      --editorDarkMode-input-transparentText: color-mix(in srgb, var(--theme-text-primary) 60%, transparent);
    }
    html[theme="dark"] select option {
      background-color: black;
      color: white;
    }
  `);
}
