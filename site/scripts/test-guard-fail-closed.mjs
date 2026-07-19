import assert from "node:assert/strict";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("the content guard preserves a failing child exit code", async () => {
  const fakeBin = await mkdtemp(path.join(tmpdir(), "karmastro-guard-"));
  const fakeNode = path.join(fakeBin, "node");
  await writeFile(
    fakeNode,
    '#!/bin/sh\ncounter="$0.count"\nif [ ! -f "$counter" ]; then\n  touch "$counter"\n  exit 23\nfi\nexit 0\n',
  );
  await chmod(fakeNode, 0o755);

  try {
    const result = spawnSync("bash", ["scripts/guard-content.sh"], {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        GEMINI_API_KEY: "",
        PATH: `${fakeBin}:${process.env.PATH}`,
      },
      encoding: "utf8",
    });

    assert.equal(result.status, 23, `${result.stdout}\n${result.stderr}`);
  } finally {
    await rm(fakeBin, { recursive: true, force: true });
  }
});
