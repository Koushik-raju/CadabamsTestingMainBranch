import "dotenv/config";
import { defineConfig } from "@hey-api/openapi-ts";

const BACKEND_V2_URL = process.env.NEXT_PUBLIC_BACKEND_URL! + "/docs-json";

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
