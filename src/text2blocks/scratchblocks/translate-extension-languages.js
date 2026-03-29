export const languageNameMap = await fetch(
  "https://unpkg.com/scratch-translate-extension-languages@latest/languages.json"
).then((r) => r.json().nameMap);

export const spokenLanguageCodes = [
  "ar",
  "zh-cn",
  "da",
  "nl",
  "en",
  "fr",
  "de",
  "hi",
  "is",
  "it",
  "ja",
  "ko",
  "nb",
  "pl",
  "pt-br",
  "pt",
  "ro",
  "ru",
  "es",
  "es-419",
  "sv",
  "tr",
  "cy",
];
