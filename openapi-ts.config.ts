import "dotenv/config";
import { defineConfig } from "@hey-api/openapi-ts";
import { CONFIG } from "./config/env";

const BACKEND_V2_URL = CONFIG.BACKEND_URL + "/docs-json";

export default defineConfig([
  {
    input: BACKEND_V2_URL,
    output: "sdk/backend-v2",
    plugins: [
      {
        name: "@hey-api/client-axios",
        runtimeConfigPath: "@/api/backend-v2.ts",
      },
      "@hey-api/sdk",
    ],
  },
]);
