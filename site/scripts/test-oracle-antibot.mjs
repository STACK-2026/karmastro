import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const oracleFile = new URL("../src/pages/oracle.astro", import.meta.url);
const edgeFile = new URL(
  "../../app/supabase/functions/oracle-chat/index.ts",
  import.meta.url,
);

test("a legacy URL question waits for human confirmation", async () => {
  const page = await readFile(oracleFile, "utf8");

  assert.match(
    page,
    /const pendingQuestion = incomingHandoff\?\.question \|\| "";/,
  );
  assert.match(page, /if \(legacyQuestion\) input\.value = legacyQuestion;/);
  assert.doesNotMatch(
    page,
    /pendingQuestion = incomingHandoff\?\.question \|\| legacyQuestion/,
  );
  assert.match(page, /if \(pendingQuestion\)[\s\S]*send\(question\);/);
});

test("synthetic clicks cannot submit the public Oracle", async () => {
  const page = await readFile(oracleFile, "utf8");

  assert.match(
    page,
    /sendBtn\.addEventListener\("click", \(event\) => \{ if \(event\.isTrusted\) send\(input\.value\); \}\);/,
  );
  assert.match(
    page,
    /e\.key === "Enter" && e\.isTrusted/,
  );
});

test("the server rejects automation before parsing the request body", async () => {
  const edge = await readFile(edgeFile, "utf8");
  const policyCheck = edge.indexOf("isOracleAutomatedUserAgent(");
  const bodyParse = edge.indexOf("normalizeChatRequest(await req.json())");

  assert.notEqual(policyCheck, -1);
  assert.notEqual(bodyParse, -1);
  assert.equal(policyCheck < bodyParse, true);
});
