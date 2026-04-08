import { defineConfig } from '@hey-api/openapi-ts';

const OPENAPI_URL = 'https://auth.cadabams.com/api/v1/openapi';

export default defineConfig([
  {
    input: OPENAPI_URL,
    output: 'sdk/auth-and-crm',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '@/api/hey-api.auth-and-crm.ts',
      },
      '@hey-api/sdk',
    ],
  },
]);
