import { handleAstroRequest } from "./handler.mjs";

const ENGINE_URL = Deno.env.get("ASTRO_ENGINE_URL") ||
  "http://168.119.229.20:8100";

Deno.serve((request) => handleAstroRequest(request, { engineUrl: ENGINE_URL }));
