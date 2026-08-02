import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SITE_ROOT = new URL("../", import.meta.url);

test("global headers leave page-level indexability decisions to page metadata", async () => {
  const headers = await readFile(new URL("public/_headers", SITE_ROOT), "utf8");
  const globalBlock = headers.match(/^\/\*\n(?<block>(?:  .+\n)+)/m)?.groups?.block ?? "";
  const robotsHeader = globalBlock
    .split("\n")
    .find((line) => line.trimStart().startsWith("X-Robots-Tag:"));

  assert.ok(robotsHeader, "the global block must keep an X-Robots-Tag header");
  assert.doesNotMatch(robotsHeader, /(?:^|[,:\s])index(?:[,:\s]|$)/i);
  assert.doesNotMatch(robotsHeader, /(?:^|[,:\s])follow(?:[,:\s]|$)/i);
  assert.match(robotsHeader, /max-snippet:-1/);
  assert.match(robotsHeader, /max-image-preview:large/);
  assert.match(robotsHeader, /max-video-preview:-1/);
});

test("homepage entity graph does not duplicate the default Organization", async () => {
  const { mergeJsonLdWithDefaultOrganization } = await import(
    "../src/utils/structured-data.mjs"
  );
  const defaultOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://karmastro.com/#organization",
  };
  const homepageGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://karmastro.com/#organization",
      },
      { "@type": "WebSite" },
    ],
  };

  assert.deepEqual(
    mergeJsonLdWithDefaultOrganization(defaultOrganization, homepageGraph),
    [homepageGraph],
  );
  assert.deepEqual(
    mergeJsonLdWithDefaultOrganization(defaultOrganization, { "@type": "Article" }),
    [defaultOrganization, { "@type": "Article" }],
  );
});
