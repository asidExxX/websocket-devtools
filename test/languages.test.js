import assert from "node:assert/strict";
import test from "node:test";

import {
  chromeLocaleMapping,
  getChromeUILanguageFlat,
  languageDisplayNames,
  supportedLanguages,
  translations,
} from "../src/locales/index.js";

test("only English and Simplified Chinese remain selectable and packaged", () => {
  assert.deepEqual(supportedLanguages, ["en-us", "zh-cn"]);
  assert.deepEqual(Object.keys(translations), supportedLanguages);
  assert.deepEqual(Object.keys(languageDisplayNames), supportedLanguages);
  assert.deepEqual(Object.keys(chromeLocaleMapping), supportedLanguages);

  const originalChrome = globalThis.chrome;
  globalThis.chrome = {
    i18n: {
      getMessage() { return ""; },
      getUILanguage() { return "zh-TW"; },
    },
  };
  try {
    assert.equal(getChromeUILanguageFlat(), "zh-cn");
    globalThis.chrome.i18n.getUILanguage = () => "ja-JP";
    assert.equal(getChromeUILanguageFlat(), "en-us");
  } finally {
    if (originalChrome === undefined) delete globalThis.chrome;
    else globalThis.chrome = originalChrome;
  }
});

test("legacy saved languages resolve to a supported language", async () => {
  const { default: i18n } = await import("../src/utils/i18n.js");
  await new Promise(setImmediate);
  const originalGetSavedLanguage = i18n.getSavedLanguage;
  const originalGetBrowserLanguage = i18n.getBrowserLanguage;
  const originalChromeSupported = i18n.chromeSupported;
  let savedLanguage = "zh-tw";
  i18n.getSavedLanguage = async () => savedLanguage;
  i18n.getBrowserLanguage = () => "en-us";
  i18n.chromeSupported = false;

  try {
    await i18n.initUserPreference();
    assert.equal(i18n.getCurrentLanguage(), "zh-cn");

    savedLanguage = "ja";
    await i18n.initUserPreference();
    assert.equal(i18n.getCurrentLanguage(), "en-us");
  } finally {
    i18n.getSavedLanguage = originalGetSavedLanguage;
    i18n.getBrowserLanguage = originalGetBrowserLanguage;
    i18n.chromeSupported = originalChromeSupported;
  }
});
