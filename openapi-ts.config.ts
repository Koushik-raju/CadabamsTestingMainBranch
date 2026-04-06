import { defineConfig } from "@hey-api/openapi-ts";

const OPENAPI_URL =
  "https://asjkuqm3eoea6q7sqkfpuqt2ye0letxc.lambda-url.ap-south-1.on.aws/api/v1/openapi";

export default defineConfig([
  {
    input: OPENAPI_URL,
    output: "sdk/auth-and-crm",
    plugins: [
      {
        name: "@hey-api/client-axios",
        runtimeConfigPath: "@/api/hey-api.auth-and-crm.ts",
      },
      "@hey-api/sdk",
    ],
  },
]);
