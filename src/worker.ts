import { createApp } from "./app.js";

export default {
  fetch(request: Request, env: Record<string, unknown>, executionCtx: unknown) {
    const app = createApp(env);
    return app.fetch(request, env, executionCtx as never);
  },
};
