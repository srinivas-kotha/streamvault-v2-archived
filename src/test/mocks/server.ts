/**
 * MSW server instance for Vitest (Node.js environment).
 *
 * Usage in tests:
 *   import { server } from '@/test/mocks/server';
 *   server.use(http.get('/api/...', () => HttpResponse.json({...})));
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
