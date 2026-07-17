import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4321",
    headless: true,
  },
  webServer: {
    command: "npm --prefix ../site run preview -- --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321/oracle/",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
