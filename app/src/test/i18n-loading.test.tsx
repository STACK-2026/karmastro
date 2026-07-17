// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider, UI_LOCALES, fr, loadUiDictionary, translate, useT } from "@/i18n/ui";

afterEach(() => {
  cleanup();
  document.cookie = "karmastro_lang=; Max-Age=0; Path=/";
});

describe("lazy UI dictionaries", () => {
  it("loads every supported locale and preserves the French fallback contract", async () => {
    expect(UI_LOCALES).toHaveLength(11);
    for (const locale of UI_LOCALES) {
      const dictionary = await loadUiDictionary(locale);
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(fr).sort());
      expect(translate("common.save", dictionary)).toBeTruthy();
      expect(translate("common.save", {})).toBe(fr["common.save"]);
    }
  });

  it("interpolates values without mutating the loaded dictionary", async () => {
    const dictionary = await loadUiDictionary("en");
    const before = dictionary["profile.year_label"];
    expect(translate("profile.year_label", dictionary, { year: 2026 })).toContain("2026");
    expect(dictionary["profile.year_label"]).toBe(before);
  });

  it("holds the UI on a neutral fallback until the requested locale is ready", async () => {
    document.cookie = "karmastro_lang=en; Path=/";
    const Probe = () => {
      const { t, locale } = useT();
      return <p>{locale}:{t("common.save")}</p>;
    };

    render(
      <I18nProvider fallback={<p>cosmic-loading</p>}>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.queryByText("fr:Enregistrer")).not.toBeInTheDocument();
    expect(await screen.findByText("en:Save")).toBeInTheDocument();
  });
});
